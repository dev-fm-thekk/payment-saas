import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { processPayment, processRefund, listTransactions } from '../../src/services/transactions/transaction.service';

const mockDb = {
  select: mock(() => mockDb),
  from: mock(() => mockDb),
  innerJoin: mock(() => mockDb),
  where: mock(() => mockDb),
  limit: mock(() => []),
  insert: mock(() => mockDb),
  values: mock(() => mockDb),
  returning: mock(() => []),
  update: mock(() => mockDb),
  set: mock(() => mockDb),
};

mock.module('../../db', () => ({
  default: mockDb,
}));

const mockAdapter = {
  createOrder: mock(() => ({ id: 'provider_order_123', providerOrderId: 'provider_order_123' })),
  pay: mock(() => ({ id: 'pay_123' })),
  capturePayment: mock(() => ({ id: 'cap_123' })),
  refund: mock(() => ({ id: 'ref_123', amount: 500 })),
  getTransaction: mock(() => ({ id: 'txn_123' })),
  createAccount: mock(() => ({ id: 'acc_123' })),
  createPlan: mock(() => ({ id: 'plan_123' })),
  listTransactions: mock(() => [{ id: 'txn_123' }]),
};

mock.module('@payment-sdk/core', () => ({
  ProviderFactory: {
    create: mock(() => mockAdapter),
  },
  ProviderName: {
    STRIPE: 'stripe',
    RAZORPAY: 'razorpay',
  }
}));

describe('Payment Service', () => {
  beforeEach(() => {
    mockDb.limit.mockClear();
    mockDb.returning.mockClear();
    mockDb.update.mockClear();
    mockAdapter.createOrder.mockClear();
    mockAdapter.refund.mockClear();
    mockAdapter.listTransactions.mockClear();
  });

  describe('processPayment', () => {
    it('returns error if service not found or does not belong to company', async () => {
      mockDb.limit.mockReturnValueOnce([]); // service query returns empty
      
      const result = await processPayment({ serviceId: 'svc_1', amount: 100, currency: 'USD' }, 'comp_1');
      
      expect(result.status).toBe('failed');
      expect(result.error).toBe('Service not found or does not belong to your company');
    });

    it('returns error if no provider configured', async () => {
      mockDb.limit.mockReturnValueOnce([{ id: 'svc_1', currency: 'USD' }]); // service query
      mockDb.limit.mockReturnValueOnce([]); // provider config query returns empty
      
      const result = await processPayment({ serviceId: 'svc_1', amount: 100, currency: 'USD' }, 'comp_1');
      
      expect(result.status).toBe('failed');
      expect(result.error).toBe('No provider configured for this service');
    });

    it('marks order as failed if provider call fails', async () => {
      mockDb.limit.mockReturnValueOnce([{ id: 'svc_1', currency: 'USD' }]); // service query
      mockDb.limit.mockReturnValueOnce([{ provider: 'stripe', credentialsEncrypted: {} }]); // provider query
      mockDb.returning.mockReturnValueOnce([{ id: 'order_1', amount: '100', currency: 'USD', status: 'created' }]); // insert order
      
      mockAdapter.createOrder.mockRejectedValueOnce(new Error('Provider API error'));
      
      const result = await processPayment({ serviceId: 'svc_1', amount: 100, currency: 'USD' }, 'comp_1');
      
      expect(result.status).toBe('failed');
      expect(result.error).toContain('Provider API error');
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('processes payment successfully', async () => {
      mockDb.limit.mockReturnValueOnce([{ id: 'svc_1', currency: 'USD' }]); // service query
      mockDb.limit.mockReturnValueOnce([{ provider: 'stripe', credentialsEncrypted: {} }]); // provider query
      mockDb.returning.mockReturnValueOnce([{ id: 'order_1', amount: '100', currency: 'USD', status: 'created' }]); // insert order
      mockDb.returning.mockReturnValueOnce([{ id: 'pay_1', status: 'pending' }]); // insert payment
      
      const result = await processPayment({ serviceId: 'svc_1', amount: 100, currency: 'USD' }, 'comp_1');
      
      expect(result.status).toBe('success');
      expect(result.data).toMatchObject({
        orderId: 'order_1',
        paymentId: 'pay_1',
        providerPaymentId: 'provider_order_123',
        provider: 'stripe',
      });
    });
  });

  describe('processRefund', () => {
    it('returns error if payment not found or access denied', async () => {
      mockDb.limit.mockReturnValueOnce([]); // payment join query returns empty
      
      const result = await processRefund({ serviceId: 'svc_1', paymentId: 'pay_1' }, 'comp_1');
      
      expect(result.status).toBe('failed');
      expect(result.error).toBe('Payment not found or access denied');
    });

    it('returns error if payment is not succeeded', async () => {
      mockDb.limit.mockReturnValueOnce([{ 
        payment: { id: 'pay_1', status: 'pending' },
        order: { id: 'order_1' } 
      }]);
      
      const result = await processRefund({ serviceId: 'svc_1', paymentId: 'pay_1' }, 'comp_1');
      
      expect(result.status).toBe('failed');
      expect(result.error).toBe('Only succeeded payments can be refunded');
    });

    it('processes refund successfully', async () => {
      mockDb.limit.mockReturnValueOnce([{ 
        payment: { id: 'pay_1', status: 'succeeded', providerPaymentId: 'pi_123' },
        order: { id: 'order_1', amount: '1000' } 
      }]); // payment query
      mockDb.limit.mockReturnValueOnce([{ id: 'svc_1', currency: 'USD' }]); // resolveAdapter: service query
      mockDb.limit.mockReturnValueOnce([{ provider: 'stripe', credentialsEncrypted: {} }]); // resolveAdapter: provider query
      mockDb.returning.mockReturnValueOnce([{ id: 'ref_1', amount: '500', status: 'pending' }]); // insert refund
      
      const result = await processRefund({ serviceId: 'svc_1', paymentId: 'pay_1', amount: 500 }, 'comp_1');
      
      expect(result.status).toBe('success');
      expect(result.data).toMatchObject({
        refundId: 'ref_1',
        providerRefundId: 'ref_123',
        orderStatus: 'partially_refunded',
      });
      expect(mockDb.update).toHaveBeenCalled();
    });
    
    it('marks order as fully refunded when amount matches', async () => {
      mockDb.limit.mockReturnValueOnce([{ 
        payment: { id: 'pay_1', status: 'succeeded', providerPaymentId: 'pi_123' },
        order: { id: 'order_1', amount: '500' } 
      }]); // payment query
      mockDb.limit.mockReturnValueOnce([{ id: 'svc_1', currency: 'USD' }]); // resolveAdapter: service query
      mockDb.limit.mockReturnValueOnce([{ provider: 'stripe', credentialsEncrypted: {} }]); // resolveAdapter: provider query
      mockDb.returning.mockReturnValueOnce([{ id: 'ref_1', amount: '500', status: 'pending' }]); // insert refund
      
      const result = await processRefund({ serviceId: 'svc_1', paymentId: 'pay_1', amount: 500 }, 'comp_1');
      
      expect(result.status).toBe('success');
      expect(result.data).toMatchObject({
        orderStatus: 'refunded',
      });
    });
  });

  describe('listTransactions', () => {
    it('lists transactions successfully', async () => {
      mockDb.limit.mockReturnValueOnce([{ id: 'svc_1', currency: 'USD' }]); // resolveAdapter: service query
      mockDb.limit.mockReturnValueOnce([{ provider: 'stripe', credentialsEncrypted: {} }]); // resolveAdapter: provider query
      
      const result = await listTransactions({ serviceId: 'svc_1', limit: 10 }, 'comp_1');
      
      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(1);
      expect(mockAdapter.listTransactions).toHaveBeenCalledWith({
        limit: 10,
        from: undefined,
        to: undefined,
        status: undefined,
        cursor: undefined
      });
    });
  });
});
