import db from '../../../db';
import { eq, and, desc } from 'drizzle-orm';
import { providerConfigs, services, webhookEvents } from '../../../db/schema';
import { ProviderFactory, ProviderName } from '@payment-sdk/core';
import type {
  CreateWebhookType,
  GetWebhookType,
  UpdateWebhookType,
  DeleteWebhookType,
} from '../../../utils/schema';
import logger from '../logging/logging.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolves the active provider adapter for a given serviceId, validating
 * that the service belongs to the calling company.
 */
async function resolveAdapter(serviceId: string, companyId: string) {
  try {
    const svc = await db
      .select({ id: services.id })
      .from(services)
      .where(and(eq(services.id, serviceId), eq(services.companyId, companyId)))
      .limit(1);

    if (!svc[0]) {
      return { error: 'Service not found or does not belong to your company', data: null };
    }

    const configs = await db
      .select()
      .from(providerConfigs)
      .where(eq(providerConfigs.serviceId, serviceId))
      .limit(1);

    if (!configs[0]) {
      return { error: 'No provider configured for this service', data: null };
    }

    const config = configs[0];
    const rawCredentials = JSON.parse(config.credentialsEncrypted as string);

    const providerName =
      config.provider === 'stripe' ? ProviderName.STRIPE : ProviderName.RAZORPAY;

    const credentials =
      providerName === ProviderName.RAZORPAY
        ? {
            apiKey: rawCredentials['RAZORPAY_KEY_ID'],
            apiSecret: rawCredentials['RAZORPAY_KEY_SECRET'],
          }
        : {
            apiKey: rawCredentials['STRIPE_SECRET_KEY'] ?? rawCredentials['apiKey'],
          };

    const adapter = ProviderFactory.create({ provider: providerName, credentials });

    return { error: null, data: { adapter, provider: config.provider } };
  } catch (err) {
    logger.error(err);
    return { error: 'Failed to resolve provider adapter', data: null };
  }
}

// ─── Create Webhook ───────────────────────────────────────────────────────────

export async function createWebhook(input: CreateWebhookType, companyId: string) {
  try {
    const resolved = await resolveAdapter(input.serviceId, companyId);
    if (resolved.error || !resolved.data) {
      return { status: 'failed' as const, error: resolved.error };
    }
    const { adapter } = resolved.data;

    const webhook = await adapter.createWebHook({
      url: input.url,
      events: input.events,
      secret: input.secret,
      alert_email: input.alert_email,
      accountId: input.accountId,
    });

    return { status: 'success' as const, data: webhook };
  } catch (err) {
    logger.error(err);
    return {
      status: 'failed' as const,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Get Webhook ─────────────────────────────────────────────────────────────

export async function getWebhook(input: GetWebhookType, companyId: string) {
  try {
    const resolved = await resolveAdapter(input.serviceId, companyId);
    if (resolved.error || !resolved.data) {
      return { status: 'failed' as const, error: resolved.error };
    }
    const { adapter } = resolved.data;

    const webhook = await adapter.listWebhook(input.webhookId, input.accountId ?? '');

    return { status: 'success' as const, data: webhook };
  } catch (err) {
    logger.error(err);
    return {
      status: 'failed' as const,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Update Webhook ───────────────────────────────────────────────────────────

export async function updateWebhook(input: UpdateWebhookType, companyId: string) {
  try {
    const resolved = await resolveAdapter(input.serviceId, companyId);
    if (resolved.error || !resolved.data) {
      return { status: 'failed' as const, error: resolved.error };
    }
    const { adapter } = resolved.data;

    const webhook = await adapter.updateWebhook({
      webhookId: input.webhookId,
      accountId: input.accountId,
      url: input.url,
      events: input.events,
      secret: input.secret,
      alert_email: input.alert_email,
    });

    return { status: 'success' as const, data: webhook };
  } catch (err) {
    logger.error(err);
    return {
      status: 'failed' as const,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Delete Webhook ───────────────────────────────────────────────────────────

export async function deleteWebhook(input: DeleteWebhookType, companyId: string) {
  try {
    const resolved = await resolveAdapter(input.serviceId, companyId);
    if (resolved.error || !resolved.data) {
      return { status: 'failed' as const, error: resolved.error };
    }
    const { adapter } = resolved.data;

    const result = await adapter.deleteWebhook(input.webhookId, input.accountId);

    return { status: 'success' as const, data: result };
  } catch (err) {
    logger.error(err);
    return {
      status: 'failed' as const,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Incoming Webhook Event Handler ──────────────────────────────────────────

/**
 * Handles an incoming raw webhook event from a payment provider.
 * - Verifies the signature using the provider's secret.
 * - Persists the raw event to `webhook_events` for idempotent processing.
 * - Returns the parsed event so the route can respond 200 immediately.
 */
export async function handleIncomingWebhookEvent(params: {
  provider: 'stripe' | 'razorpay';
  rawBody: Buffer;
  signature: string;
  secret: string;
  /** Credentials required to create a temporary adapter instance for verification */
  credentials: Record<string, string>;
}) {
  try {
    const providerName =
      params.provider === 'stripe' ? ProviderName.STRIPE : ProviderName.RAZORPAY;

    const adapter = ProviderFactory.create({
      provider: providerName,
      credentials: params.credentials as unknown as import('@payment-sdk/core').ProviderCredentials,
    });

    const isValid = adapter.verifyWebhookSignature({
      rawBody: params.rawBody,
      signature: params.signature,
      secret: params.secret,
    });

    if (!isValid) {
      return { status: 'failed' as const, error: 'Invalid webhook signature' };
    }

    // Parse the raw body to extract event type
    const payload = JSON.parse(params.rawBody.toString('utf-8'));
    const eventType: string =
      params.provider === 'stripe'
        ? payload.type ?? 'unknown'
        : payload.event ?? 'unknown';

    // Persist to webhook_events table for downstream processing
    await db.insert(webhookEvents).values({
      provider: params.provider,
      eventType,
      payload,
      processed: false,
    });

    return { status: 'success' as const, data: { eventType, received: true } };
  } catch (err) {
    logger.error(err);
    return {
      status: 'failed' as const,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── List Stored Webhook Events ───────────────────────────────────────────────

export async function listWebhookEvents(params: {
  provider?: 'stripe' | 'razorpay';
  processed?: boolean;
  limit?: number;
}) {
  try {
    const conditions = [];
    if (params.provider) conditions.push(eq(webhookEvents.provider, params.provider));
    if (params.processed !== undefined) {
      conditions.push(eq(webhookEvents.processed, params.processed));
    }

    const rows = await db
      .select()
      .from(webhookEvents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(webhookEvents.receivedAt))
      .limit(params.limit ?? 50);

    return { status: 'success' as const, data: rows };
  } catch (err) {
    logger.error(err);
    return {
      status: 'failed' as const,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
