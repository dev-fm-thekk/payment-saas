import { describe, it, expect } from 'vitest';
import { ResponseNormaliser } from '../../src/normaliser';
import { ProviderName, PaymentStatus, RefundStatus, AccountStatus, OrderStatus } from '../../src/types/enums';

describe('ResponseNormaliser', () => {
  const normaliser = new ResponseNormaliser();

  describe('normaliseOrder', () => {
    it('normalises Razorpay order correctly', () => {
      const raw = {
        id: 'order_ABC123',
        amount: 50000,
        currency: 'INR',
        status: 'created',
        notes: { env: 'test' },
        created_at: 1700000000,
      };
      
      const result = normaliser.normaliseOrder(raw, ProviderName.RAZORPAY);
      
      expect(result).toEqual({
        id: 'order_ABC123',
        amount: 50000,
        currency: 'INR',
        status: OrderStatus.CREATED,
        metadata: { env: 'test' },
        providerOrderId: 'order_ABC123',
        createdAt: new Date(1700000000 * 1000),
        updatedAt: new Date(1700000000 * 1000),
      });
    });

    it('normalises Stripe payment intent as order correctly', () => {
      const raw = {
        id: 'pi_ABC123',
        amount: 5000,
        currency: 'usd',
        status: 'requires_payment_method',
        metadata: { env: 'test' },
        created: 1700000000,
      };

      const result = normaliser.normaliseOrder(raw, ProviderName.STRIPE);
      
      expect(result).toEqual({
        id: 'pi_ABC123',
        amount: 5000,
        currency: 'USD',
        status: OrderStatus.CREATED,
        metadata: { env: 'test' },
        providerOrderId: 'pi_ABC123',
        createdAt: new Date(1700000000 * 1000),
        updatedAt: new Date(1700000000 * 1000),
      });
    });

    it('throws error for unsupported provider', () => {
      expect(() => normaliser.normaliseOrder({}, 'UNKNOWN' as ProviderName)).toThrowError('Unsupported provider: UNKNOWN');
    });
  });

  describe('normalisePayment', () => {
    it('normalises Razorpay payment correctly', () => {
      const raw = {
        id: 'pay_ABC123',
        amount: 50000,
        currency: 'INR',
        status: 'captured',
        notes: {},
        created_at: 1700000000,
      };
      
      const result = normaliser.normalisePayment(raw, ProviderName.RAZORPAY);
      
      expect(result).toEqual({
        id: 'pay_ABC123',
        status: PaymentStatus.SUCCEEDED,
        amount: 50000,
        currency: 'INR',
        provider: ProviderName.RAZORPAY,
        providerTransactionId: 'pay_ABC123',
        createdAt: new Date(1700000000 * 1000),
        metadata: {},
      });
    });

    it('normalises Stripe payment intent correctly', () => {
      const raw = {
        id: 'pi_ABC123',
        amount: 5000,
        currency: 'usd',
        status: 'succeeded',
        metadata: { env: 'test' },
        created: 1700000000,
      };

      const result = normaliser.normalisePayment(raw, ProviderName.STRIPE);
      
      expect(result).toEqual({
        id: 'pi_ABC123',
        status: PaymentStatus.SUCCEEDED,
        amount: 5000,
        currency: 'USD',
        provider: ProviderName.STRIPE,
        providerTransactionId: 'pi_ABC123',
        createdAt: new Date(1700000000 * 1000),
        metadata: { env: 'test' },
      });
    });
  });

  describe('normaliseRefund', () => {
    it('normalises Razorpay refund correctly', () => {
      const raw = {
        id: 'rfnd_ABC123',
        payment_id: 'pay_ABC123',
        amount: 50000,
        currency: 'INR',
        status: 'processed',
        created_at: 1700000000,
      };
      
      const result = normaliser.normaliseRefund(raw, ProviderName.RAZORPAY);
      
      expect(result).toEqual({
        id: 'rfnd_ABC123',
        transactionId: 'pay_ABC123',
        amount: 50000,
        currency: 'INR',
        status: RefundStatus.SUCCEEDED,
        provider: ProviderName.RAZORPAY,
        createdAt: new Date(1700000000 * 1000),
      });
    });

    it('normalises Stripe refund correctly', () => {
      const raw = {
        id: 're_ABC123',
        payment_intent: 'pi_ABC123',
        amount: 5000,
        currency: 'usd',
        status: 'succeeded',
        created: 1700000000,
      };

      const result = normaliser.normaliseRefund(raw, ProviderName.STRIPE);
      
      expect(result).toEqual({
        id: 're_ABC123',
        transactionId: 'pi_ABC123',
        amount: 5000,
        currency: 'USD',
        status: RefundStatus.SUCCEEDED,
        provider: ProviderName.STRIPE,
        createdAt: new Date(1700000000 * 1000),
      });
    });
  });

  describe('normaliseAccount', () => {
    it('normalises Razorpay account correctly', () => {
      const raw = {
        id: 'acc_ABC123',
        created_at: 1700000000,
      };
      
      const result = normaliser.normaliseAccount(raw, ProviderName.RAZORPAY);
      
      expect(result).toEqual({
        id: 'acc_ABC123',
        provider: ProviderName.RAZORPAY,
        providerAccountId: 'acc_ABC123',
        status: AccountStatus.ACTIVE,
        createdAt: new Date(1700000000 * 1000),
      });
    });

    it('normalises Stripe account correctly', () => {
      const raw = {
        id: 'acct_ABC123',
        details_submitted: true,
        created: 1700000000,
      };

      const result = normaliser.normaliseAccount(raw, ProviderName.STRIPE);
      
      expect(result).toEqual({
        id: 'acct_ABC123',
        provider: ProviderName.STRIPE,
        providerAccountId: 'acct_ABC123',
        status: AccountStatus.ACTIVE,
        createdAt: new Date(1700000000 * 1000),
      });
    });
    
    it('normalises Stripe account with pending details', () => {
      const raw = {
        id: 'acct_ABC123',
        details_submitted: false,
        created: 1700000000,
      };

      const result = normaliser.normaliseAccount(raw, ProviderName.STRIPE);
      
      expect(result.status).toEqual(AccountStatus.PENDING_VERIFICATION);
    });
  });

  describe('status mapping edge cases', () => {
    it('maps unknown Razorpay order status to CREATED', () => {
      const raw = { id: 'test', status: 'unknown', created_at: 0 };
      const res = normaliser.normaliseOrder(raw, ProviderName.RAZORPAY);
      expect(res.status).toBe(OrderStatus.CREATED);
    });
    
    it('maps Razorpay order attempted status to CREATED', () => {
      const raw = { id: 'test', status: 'attempted', created_at: 0 };
      const res = normaliser.normaliseOrder(raw, ProviderName.RAZORPAY);
      expect(res.status).toBe(OrderStatus.CREATED);
    });
    
    it('maps Razorpay order paid status to PAID', () => {
      const raw = { id: 'test', status: 'paid', created_at: 0 };
      const res = normaliser.normaliseOrder(raw, ProviderName.RAZORPAY);
      expect(res.status).toBe(OrderStatus.PAID);
    });
  });
});
