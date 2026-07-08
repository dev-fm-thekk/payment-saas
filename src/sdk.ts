import { PaymentClient, ProviderName } from '@payment-sdk/core';
import vars from './config';

export const paymentClient = new PaymentClient({
  provider: ProviderName.RAZORPAY,
  credentials: {
    apiKey: vars.RAZORPAY_KEY_ID || '',
    apiSecret: vars.RAZORPAY_KEY_SECRET,
  },
});
