import { describe, it, expect, mock, beforeEach, beforeAll, afterAll } from 'bun:test';
import express from 'express';

// Mock the middleware to bypass API key checking
const mockAuthenticateApiKey = mock((req: any, res: any, next: any) => {
  if (req.headers['x-api-key'] === 'valid_key') {
    req.companyId = 'comp_1';
    next();
  } else {
    res.status(401).json({ status: 'failed', error: 'Missing or invalid API key' });
  }
});
mock.module('../../src/middlewares/apikey.middleware', () => ({
  authenticateApiKey: mockAuthenticateApiKey
}));

// Mock the payment service
const mockProcessPayment = mock(async () => ({ status: 'success', data: { orderId: 'order_1' } }));
const mockProcessRefund = mock(async () => ({ status: 'success', data: { refundId: 'ref_1' } }));
const mockListTransactions = mock(async () => ({ status: 'success', data: [] }));

mock.module('../../src/services/Payment/payment.service', () => ({
  processPayment: mockProcessPayment,
  processRefund: mockProcessRefund,
  listTransactions: mockListTransactions
}));

let server: any;
let baseUrl: string;

beforeAll(async () => {
  // Dynamically import the router AFTER mocks are setup
  const routerModule = await import('../../src/routes/Payment/route');
  const paymentRouter = routerModule.default;

  // Setup express app
  const app = express();
  app.use(express.json());
  app.use('/payment', paymentRouter);
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(500).json({ error: err.message });
  });

  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
});

afterAll(() => {
  if (server) server.close();
});

describe('Payment Routes', () => {
  beforeEach(() => {
    mockProcessPayment.mockClear();
    mockProcessRefund.mockClear();
    mockListTransactions.mockClear();
  });

  describe('POST /payment/pay', () => {
    it('returns 401 without API key', async () => {
      const res = await fetch(`${baseUrl}/payment/pay`, { method: 'POST' });
      expect(res.status).toBe(401);
    });

    it('returns 400 for invalid body', async () => {
      const res = await fetch(`${baseUrl}/payment/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'valid_key' },
        body: JSON.stringify({ amount: 100 })
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('serviceId: Invalid input');
    });

    it('returns 400 if service returns failed', async () => {
      mockProcessPayment.mockResolvedValueOnce({ status: 'failed', error: 'Service error' });
      const res = await fetch(`${baseUrl}/payment/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'valid_key' },
        body: JSON.stringify({ serviceId: '123e4567-e89b-12d3-a456-426614174000', amount: 100, currency: 'USD' })
      });
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Service error');
    });

    it('returns 201 on success', async () => {
      const res = await fetch(`${baseUrl}/payment/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'valid_key' },
        body: JSON.stringify({ serviceId: '123e4567-e89b-12d3-a456-426614174000', amount: 100, currency: 'USD' })
      });
      
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.data.orderId).toBe('order_1');
    });
  });

  describe('POST /payment/refund', () => {
    it('returns 400 for invalid body', async () => {
      const res = await fetch(`${baseUrl}/payment/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'valid_key' },
        body: JSON.stringify({})
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('serviceId: Invalid input');
    });

    it('returns 404 if payment not found', async () => {
      mockProcessRefund.mockResolvedValueOnce({ status: 'failed', error: 'Payment not found' });
      const res = await fetch(`${baseUrl}/payment/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'valid_key' },
        body: JSON.stringify({ serviceId: '123e4567-e89b-12d3-a456-426614174000', paymentId: 'pay_1' })
      });
      
      expect(res.status).toBe(404);
    });

    it('returns 200 on success', async () => {
      const res = await fetch(`${baseUrl}/payment/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'valid_key' },
        body: JSON.stringify({ serviceId: '123e4567-e89b-12d3-a456-426614174000', paymentId: 'pay_1' })
      });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.refundId).toBe('ref_1');
    });
  });

  describe('GET /payment/list-transactions', () => {
    it('returns 400 for invalid query', async () => {
      const res = await fetch(`${baseUrl}/payment/list-transactions`, {
        method: 'GET',
        headers: { 'x-api-key': 'valid_key' }
      });
      expect(res.status).toBe(400);
    });

    it('returns 200 on success', async () => {
      const res = await fetch(`${baseUrl}/payment/list-transactions?serviceId=123e4567-e89b-12d3-a456-426614174000`, {
        method: 'GET',
        headers: { 'x-api-key': 'valid_key' }
      });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toEqual([]);
    });
  });
});
