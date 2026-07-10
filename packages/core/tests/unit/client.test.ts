import { describe, it, expect, vi } from 'vitest';
import { PaymentClient } from '../../src/client';
import { ProviderName } from '../../src/types/enums';
import { ProviderFactory } from '../../src/factory';

vi.mock('../../src/factory', () => {
  return {
    ProviderFactory: {
      create: vi.fn().mockReturnValue({
        pay: vi.fn().mockResolvedValue({ id: 'test_payment_id', status: 'SUCCEEDED' }),
        capturePayment: vi.fn(),
        refund: vi.fn(),
        getTransaction: vi.fn(),
        createAccount: vi.fn(),
        createPlan: vi.fn(),
        listTransactions: vi.fn(),
      }),
    },
  };
});

describe('PaymentClient', () => {
  it('should instantiate and delegate pay call to the provider', async () => {
    const config = {
      provider: ProviderName.STRIPE,
      credentials: { apiKey: 'sk_test_123' },
    };

    const client = new PaymentClient(config);
    expect(ProviderFactory.create).toHaveBeenCalledWith(config);

    const request = { amount: 100, currency: 'USD' };
    const response = await client.pay(request);

    expect(response).toEqual({ id: 'test_payment_id', status: 'SUCCEEDED' });
  });
});
