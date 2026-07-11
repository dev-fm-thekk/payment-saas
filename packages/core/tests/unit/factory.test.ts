import { describe, it, expect } from 'vitest';
import { ProviderFactory } from '../../src/factory';
import { ProviderName } from '../../src/types/enums';
import { StripeAdapter } from '../../src/adapters/stripe.adapter';
import { RazorpayAdapter } from '../../src/adapters/razorpay.adapter';
import type { ClientConfig } from '../../src/types/config';

describe('ProviderFactory', () => {
  it('creates a StripeAdapter for ProviderName.STRIPE', () => {
    const config: ClientConfig = {
      provider: ProviderName.STRIPE,
      credentials: { apiKey: 'test' },
    };
    const adapter = ProviderFactory.create(config);
    expect(adapter).toBeInstanceOf(StripeAdapter);
  });

  it('creates a RazorpayAdapter for ProviderName.RAZORPAY', () => {
    const config: ClientConfig = {
      provider: ProviderName.RAZORPAY,
      credentials: { apiKey: 'test', apiSecret: 'test' },
    };
    const adapter = ProviderFactory.create(config);
    expect(adapter).toBeInstanceOf(RazorpayAdapter);
  });

  it('throws an error for unknown provider', () => {
    const config = {
      provider: 'UNKNOWN' as ProviderName,
      credentials: { apiKey: 'test' },
    };
    expect(() => ProviderFactory.create(config)).toThrow('Unknown provider: UNKNOWN');
  });
});
