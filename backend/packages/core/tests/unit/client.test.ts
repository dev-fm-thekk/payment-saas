import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentClient } from '../../src/client';
import { ProviderName } from '../../src/types/enums';
import { ProviderFactory } from '../../src/factory';
import type { ClientConfig } from '../../src/types/config';

vi.mock('../../src/factory', () => {
  return {
    ProviderFactory: {
      create: vi.fn(),
    },
  };
});

describe('PaymentClient', () => {
  let client: PaymentClient;
  let mockProvider: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProvider = {
      createOrder: vi.fn().mockResolvedValue({ id: 'order_123' }),
      pay: vi.fn().mockResolvedValue({ id: 'pay_123' }),
      capturePayment: vi.fn().mockResolvedValue({ id: 'cap_123' }),
      refund: vi.fn().mockResolvedValue({ id: 'ref_123' }),
      getTransaction: vi.fn().mockResolvedValue({ id: 'txn_123' }),
      createAccount: vi.fn().mockResolvedValue({ id: 'acc_123' }),
      createPlan: vi.fn().mockResolvedValue({ id: 'plan_123' }),
      listTransactions: vi.fn().mockResolvedValue([{ id: 'txn_123' }]),
    };
    vi.mocked(ProviderFactory.create).mockReturnValue(mockProvider);

    const config: ClientConfig = {
      provider: ProviderName.STRIPE,
      credentials: { apiKey: 'test' },
    };
    client = new PaymentClient(config);
  });

  it('delegates createOrder to provider', async () => {
    const request = { amount: 100, currency: 'USD' };
    const res = await client.createOrder(request);
    expect(mockProvider.createOrder).toHaveBeenCalledWith(request);
    expect(res.id).toBe('order_123');
  });

  it('delegates pay to provider', async () => {
    const request = { amount: 100, currency: 'USD' };
    const res = await client.pay(request);
    expect(mockProvider.pay).toHaveBeenCalledWith(request);
    expect(res.id).toBe('pay_123');
  });

  it('delegates capturePayment to provider', async () => {
    const res = await client.capturePayment('pay_123', 100, 'USD');
    expect(mockProvider.capturePayment).toHaveBeenCalledWith('pay_123', 100, 'USD');
    expect(res.id).toBe('cap_123');
  });

  it('delegates refund to provider', async () => {
    const request = { transactionId: 'pay_123', amount: 50 };
    const res = await client.refund(request);
    expect(mockProvider.refund).toHaveBeenCalledWith(request);
    expect(res.id).toBe('ref_123');
  });

  it('delegates getTransaction to provider', async () => {
    const res = await client.getTransaction('txn_123');
    expect(mockProvider.getTransaction).toHaveBeenCalledWith('txn_123');
    expect(res.id).toBe('txn_123');
  });

  it('delegates createAccount to provider', async () => {
    const request = { email: 'test@example.com', businessName: 'Test', country: 'US' };
    const res = await client.createAccount(request);
    expect(mockProvider.createAccount).toHaveBeenCalledWith(request);
    expect(res.id).toBe('acc_123');
  });

  it('delegates createPlan to provider', async () => {
    const request = { planId: 'plan_123' };
    const res = await client.createPlan(request);
    expect(mockProvider.createPlan).toHaveBeenCalledWith(request);
    expect(res.id).toBe('plan_123');
  });

  it('delegates listTransactions to provider', async () => {
    const request = { limit: 10 };
    const res = await client.listTransactions(request);
    expect(mockProvider.listTransactions).toHaveBeenCalledWith(request);
    expect(res).toHaveLength(1);
    expect(res[0]!.id).toBe('txn_123');
  });
});
