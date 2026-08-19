import { and, eq } from 'drizzle-orm';
import db from '../../../db';
import { providerConfigs, services } from '../../../db/schema';
import { RazorpayAdapter, StripeAdapter, ProviderName } from '../../../core';
import logger from '../../services/logging/logging.service';
import type { CreatePaymentLinkInputType } from '../../../utils/schema';

export const createPaymentLink = async (input: CreatePaymentLinkInputType, companyId: string) => {
  try {
    const { serviceId, ...paymentLinkData } = input;

    // Verify service belongs to companyId
    const svc = await db
      .select({ id: services.id, currency: services.currency })
      .from(services)
      .where(and(eq(services.id, serviceId), eq(services.companyId, companyId)))
      .limit(1);

    if (!svc[0]) {
      return {
        status: 'failed',
        error: 'Service not found or does not belong to your company',
      };
    }

    // Fetch the active provider config for this service
    const configs = await db
      .select()
      .from(providerConfigs)
      .where(eq(providerConfigs.serviceId, serviceId))
      .limit(1);

    if (!configs[0]) {
      return { status: 'failed', error: 'No provider configured for this service' };
    }

    const config = configs[0];

    // Initialize adapter based on provider config
    type credential = { apiKey: string; apiSecret?: string };
    const credentials = config.credentialsEncrypted as credential;

    let adapter;
    if (config.provider === 'stripe') {
      adapter = new StripeAdapter({ apiKey: credentials.apiKey });
    } else if (config.provider === 'razorpay') {
      adapter = new RazorpayAdapter({
        apiKey: credentials.apiKey,
        apiSecret: credentials.apiSecret!,
      });
    } else {
      return { status: 'failed', error: 'Unsupported provider' };
    }

    // Call the adapter's createPaymentLink
    const result = await adapter.createPaymentLink({
      ...paymentLinkData,
      item: input.items,
    });

    return { status: 'success', data: result };
  } catch (err: any) {
    logger.error('Error creating payment link:', err);
    return { status: 'failed', error: err.message || String(err) };
  }
};
