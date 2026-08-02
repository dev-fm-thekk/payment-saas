import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StripeAdapter } from '../../src/adapters/stripe.adapter';
import { ProviderName, ErrorCode, OrderStatus, PaymentStatus, RefundStatus } from '../../src/types/enums';
import { PaymentError } from '../../src/errors';
import Stripe from 'stripe';

vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      paymentIntents: {
        create: vi.fn(),
        capture: vi.fn(),
        retrieve: vi.fn(),
        list: vi.fn(),
      },
      refunds: {
        create: vi.fn(),
      },
      accounts: {
        create: vi.fn(),
      },
      prices: {
        create: vi.fn(),
      },
    })),
  };
});

describe('StripeAdapter', () => {
  let adapter: StripeAdapter;
  let mockStripe: any;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new StripeAdapter({ apiKey: 'test_key' });
    mockStripe = vi.mocked(Stripe).mock.results[0]!.value;
  });

  describe('createOrder', () => {
    it('creates a payment intent with manual capture method', async () => {
      const mockResponse = {
        id: 'pi_test123',
        amount: 5000,
        currency: 'usd',
        status: 'requires_payment_method',
        metadata: { env: 'test' },
        created: 1700000000,
      };
      mockStripe.paymentIntents.create.mockResolvedValue(mockResponse);

      const request = {
        amount: 5000,
        currency: 'USD',
        description: 'Test order',
      };

      const result = await adapter.createOrder(request);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 5000,
        currency: 'usd',
        description: 'Test order',
        metadata: undefined,
        capture_method: 'manual',
      });
      expect(result.id).toBe('pi_test123');
      expect(result.status).toBe(OrderStatus.CREATED);
      expect(result.providerOrderId).toBe('pi_test123');
    });

    it('throws PaymentError on failure', async () => {
      mockStripe.paymentIntents.create.mockRejectedValue(new Error('Stripe error'));
      await expect(adapter.createOrder({ amount: 100, currency: 'USD' })).rejects.toThrow(PaymentError);
    });
  });

  describe('pay', () => {
    it('creates a payment intent', async () => {
      const mockResponse = {
        id: 'pi_test123',
        amount: 5000,
        currency: 'usd',
        status: 'succeeded',
        created: 1700000000,
      };
      mockStripe.paymentIntents.create.mockResolvedValue(mockResponse);

      const request = {
        amount: 5000,
        currency: 'USD',
      };

      const result = await adapter.pay(request);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 5000,
        currency: 'usd',
        description: undefined,
        metadata: undefined,
      });
      expect(result.id).toBe('pi_test123');
      expect(result.status).toBe(PaymentStatus.SUCCEEDED);
    });
  });

  describe('capturePayment', () => {
    it('captures a payment intent', async () => {
      const mockResponse = {
        id: 'pi_test123',
        amount: 5000,
        currency: 'usd',
        status: 'succeeded',
        created: 1700000000,
      };
      mockStripe.paymentIntents.capture.mockResolvedValue(mockResponse);

      const result = await adapter.capturePayment('pi_test123', 5000, 'USD');

      expect(mockStripe.paymentIntents.capture).toHaveBeenCalledWith('pi_test123', {
        amount_to_capture: 5000,
      });
      expect(result.status).toBe(PaymentStatus.SUCCEEDED);
    });
  });

  describe('refund', () => {
    it('creates a refund', async () => {
      const mockResponse = {
        id: 're_test123',
        payment_intent: 'pi_test123',
        amount: 5000,
        currency: 'usd',
        status: 'succeeded',
        created: 1700000000,
      };
      mockStripe.refunds.create.mockResolvedValue(mockResponse);

      const result = await adapter.refund({ transactionId: 'pi_test123', amount: 5000 });

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test123',
        amount: 5000,
        metadata: undefined,
      });
      expect(result.id).toBe('re_test123');
      expect(result.status).toBe(RefundStatus.SUCCEEDED);
    });
  });

  describe('getTransaction', () => {
    it('retrieves a payment intent', async () => {
      const mockResponse = {
        id: 'pi_test123',
        amount: 5000,
        currency: 'usd',
        status: 'succeeded',
        created: 1700000000,
      };
      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockResponse);

      const result = await adapter.getTransaction('pi_test123');

      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_test123');
      expect(result.id).toBe('pi_test123');
    });
  });

  describe('createAccount', () => {
    it('creates an account', async () => {
      const mockResponse = {
        id: 'acct_test123',
        details_submitted: true,
        created: 1700000000,
      };
      mockStripe.accounts.create.mockResolvedValue(mockResponse);

      const result = await adapter.createAccount({ email: 'test@example.com', businessName: 'Test Inc', country: 'US' });

      expect(mockStripe.accounts.create).toHaveBeenCalledWith({
        type: 'standard',
        email: 'test@example.com',
        country: 'US',
      });
      expect(result.id).toBe('acct_test123');
    });
  });

  describe('createPlan', () => {
    it('creates a price', async () => {
      const mockResponse = { id: 'price_123' };
      mockStripe.prices.create.mockResolvedValue(mockResponse);

      const result = await adapter.createPlan({ item: { amount: 1000, currency: 'USD', name: 'Premium' }, period: 'monthly' });

      expect(mockStripe.prices.create).toHaveBeenCalledWith({
        unit_amount: 1000,
        currency: 'usd',
        recurring: { interval: 'month' },
        product_data: { name: 'Premium' },
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe('listTransactions', () => {
    it('lists payment intents', async () => {
      const mockResponse = {
        data: [
          { id: 'pi_1', amount: 1000, currency: 'usd', status: 'succeeded', created: 1700000000 },
          { id: 'pi_2', amount: 2000, currency: 'usd', status: 'succeeded', created: 1700000000 },
        ],
      };
      mockStripe.paymentIntents.list.mockResolvedValue(mockResponse);

      const result = await adapter.listTransactions({ limit: 10, cursor: 'pi_0' });

      expect(mockStripe.paymentIntents.list).toHaveBeenCalledWith({
        limit: 10,
        starting_after: 'pi_0',
      });
      expect(result).toHaveLength(2);
      expect(result[0]!.id).toBe('pi_1');
    });
  });

  describe('mapError', () => {
    it('maps Stripe errors to PaymentError', async () => {
      mockStripe.paymentIntents.create.mockRejectedValue({ message: 'Card declined', code: 'card_declined' });
      try {
        await adapter.createOrder({ amount: 100, currency: 'USD' });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err).toBeInstanceOf(PaymentError);
        expect(err.code).toBe(ErrorCode.PROVIDER_ERROR);
        expect(err.providerErrorCode).toBe('card_declined');
        expect(err.message).toBe('Card declined');
        expect(err.provider).toBe(ProviderName.STRIPE);
      }
    });
  });
});
