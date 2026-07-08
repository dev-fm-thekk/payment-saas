import { ClientConfig } from './types/config';
import { IPaymentProvider } from './provider';
import { ProviderName } from './types/enums';
import { RazorpayAdapter } from './adapters/razorpay.adapter';
import { StripeAdapter } from './adapters/stripe.adapter';

export class ProviderFactory {
  static create(config: ClientConfig): IPaymentProvider {
    switch (config.provider) {
      case ProviderName.RAZORPAY:
        return new RazorpayAdapter(config.credentials);
      case ProviderName.STRIPE:
        return new StripeAdapter(config.credentials);
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }
}
