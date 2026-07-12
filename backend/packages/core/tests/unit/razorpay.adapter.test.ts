import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RazorpayAdapter } from '../../src/adapters/razorpay.adapter';
import { ProviderName, ErrorCode, OrderStatus, PaymentStatus, RefundStatus } from '../../src/types/enums';
import { PaymentError } from '../../src/errors';
import Razorpay from 'razorpay';

vi.mock('razorpay', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      orders: {
        create: vi.fn(),
      },
      payments: {
        capture: vi.fn(),
        refund: vi.fn(),
        fetch: vi.fn(),
        all: vi.fn(),
      },
      accounts: {
        create: vi.fn(),
      },
      plans: {
        create: vi.fn(),
      },
    })),
  };
});

describe('RazorpayAdapter', () => {
  let adapter: RazorpayAdapter;
  let mockRazorpay: any;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new RazorpayAdapter({ apiKey: 'test_key', apiSecret: 'test_secret' });
    mockRazorpay = vi.mocked(Razorpay).mock.results[0].value;
  });

  describe('createOrder', () => {
    it('creates an order', async () => {
      const mockResponse = {
        id: 'order_test123',
        amount: 50000,
        currency: 'INR',
        status: 'created',
        notes: { env: 'test' },
        created_at: 1700000000,
      };
      mockRazorpay.orders.create.mockResolvedValue(mockResponse);

      const request = {
        amount: 50000,
        currency: 'INR',
        receipt: 'receipt_123',
      };

      const result = await adapter.createOrder(request);

      expect(mockRazorpay.orders.create).toHaveBeenCalledWith({
        amount: 50000,
        currency: 'INR',
        receipt: 'receipt_123',
        notes: undefined,
      });
      expect(result.id).toBe('order_test123');
      expect(result.status).toBe(OrderStatus.CREATED);
    });
  });

  describe('pay', () => {
    it('creates an order for payment', async () => {
      const mockResponse = {
        id: 'order_test123',
        amount: 50000,
        currency: 'INR',
        status: 'created',
        created_at: 1700000000,
      };
      mockRazorpay.orders.create.mockResolvedValue(mockResponse);

      const request = {
        amount: 50000,
        currency: 'INR',
      };

      const result = await adapter.pay(request);

      expect(mockRazorpay.orders.create).toHaveBeenCalledWith({
        amount: 50000,
        currency: 'INR',
        receipt: undefined,
        notes: undefined,
      });
      expect(result.id).toBe('order_test123');
      expect(result.status).toBe(PaymentStatus.PENDING);
    });
  });

  describe('capturePayment', () => {
    it('captures a payment', async () => {
      const mockResponse = {
        id: 'pay_test123',
        amount: 50000,
        currency: 'INR',
        status: 'captured',
        created_at: 1700000000,
      };
      mockRazorpay.payments.capture.mockResolvedValue(mockResponse);

      const result = await adapter.capturePayment('pay_test123', 50000, 'INR');

      expect(mockRazorpay.payments.capture).toHaveBeenCalledWith('pay_test123', 50000, 'INR');
      expect(result.status).toBe(PaymentStatus.SUCCEEDED);
    });
  });

  describe('refund', () => {
    it('creates a refund', async () => {
      const mockResponse = {
        id: 'rfnd_test123',
        payment_id: 'pay_test123',
        amount: 50000,
        currency: 'INR',
        status: 'processed',
        created_at: 1700000000,
      };
      mockRazorpay.payments.refund.mockResolvedValue(mockResponse);

      const result = await adapter.refund({ transactionId: 'pay_test123', amount: 50000 });

      expect(mockRazorpay.payments.refund).toHaveBeenCalledWith('pay_test123', {
        amount: 50000,
        notes: undefined,
      });
      expect(result.id).toBe('rfnd_test123');
      expect(result.status).toBe(RefundStatus.SUCCEEDED);
    });
  });

  describe('getTransaction', () => {
    it('fetches a payment', async () => {
      const mockResponse = {
        id: 'pay_test123',
        amount: 50000,
        currency: 'INR',
        status: 'captured',
        created_at: 1700000000,
      };
      mockRazorpay.payments.fetch.mockResolvedValue(mockResponse);

      const result = await adapter.getTransaction('pay_test123');

      expect(mockRazorpay.payments.fetch).toHaveBeenCalledWith('pay_test123');
      expect(result.id).toBe('pay_test123');
    });
  });

  describe('createAccount', () => {
    it('creates a sub-account', async () => {
      const mockResponse = {
        id: 'acc_test123',
        created_at: 1700000000,
      };
      // We know Razorpay adapter casts this to any
      mockRazorpay.accounts.create.mockResolvedValue(mockResponse);

      const result = await adapter.createAccount({ email: 'test@example.com', businessName: 'Test Inc', country: 'IN' });

      expect(mockRazorpay.accounts.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        profile: { name: 'Test Inc' },
      });
      expect(result.id).toBe('acc_test123');
    });
  });

  describe('createPlan', () => {
    it('creates a plan', async () => {
      const mockResponse = { id: 'plan_123' };
      mockRazorpay.plans.create.mockResolvedValue(mockResponse);

      const request = { item: { name: 'Premium', amount: 1000, currency: 'INR' }, period: 'monthly' } as any;
      const result = await adapter.createPlan(request);

      expect(mockRazorpay.plans.create).toHaveBeenCalledWith(request);
      expect(result).toBe(mockResponse);
    });
  });

  describe('listTransactions', () => {
    it('lists payments with timestamps', async () => {
      const mockResponse = {
        items: [
          { id: 'pay_1', amount: 1000, currency: 'INR', status: 'captured', created_at: 1700000000 },
        ],
      };
      mockRazorpay.payments.all.mockResolvedValue(mockResponse);

      const from = new Date('2023-01-01T00:00:00Z');
      const to = new Date('2023-01-02T00:00:00Z');
      const result = await adapter.listTransactions({ limit: 10, from, to });

      expect(mockRazorpay.payments.all).toHaveBeenCalledWith({
        count: 10,
        from: Math.floor(from.getTime() / 1000),
        to: Math.floor(to.getTime() / 1000),
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('mapError', () => {
    it('maps BAD_REQUEST_ERROR to INVALID_REQUEST', async () => {
      mockRazorpay.orders.create.mockRejectedValue({
        error: { code: 'BAD_REQUEST_ERROR', description: 'Invalid amount' },
      });
      try {
        await adapter.createOrder({ amount: 100, currency: 'INR' });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err).toBeInstanceOf(PaymentError);
        expect(err.code).toBe(ErrorCode.INVALID_REQUEST);
        expect(err.providerErrorCode).toBe('BAD_REQUEST_ERROR');
        expect(err.message).toBe('Invalid amount');
        expect(err.retryable).toBe(false);
      }
    });

    it('maps AUTHENTICATION_ERROR to AUTHENTICATION_ERROR', async () => {
      mockRazorpay.orders.create.mockRejectedValue({
        error: { code: 'AUTHENTICATION_ERROR', description: 'Invalid API key' },
      });
      try {
        await adapter.createOrder({ amount: 100, currency: 'INR' });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.code).toBe(ErrorCode.AUTHENTICATION_ERROR);
        expect(err.retryable).toBe(false);
      }
    });

    it('defaults to PROVIDER_ERROR for unknown errors', async () => {
      mockRazorpay.orders.create.mockRejectedValue({
        error: { code: 'SOME_SERVER_ERROR', description: 'Internal error' },
      });
      try {
        await adapter.createOrder({ amount: 100, currency: 'INR' });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.code).toBe(ErrorCode.PROVIDER_ERROR);
        expect(err.retryable).toBe(true);
      }
    });
  });
});
