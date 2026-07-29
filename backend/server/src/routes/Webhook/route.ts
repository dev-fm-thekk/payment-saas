import express from 'express';
import { authenticateApiKey } from '../../middlewares/apikey.middleware';
import type { ApiKeyRequest } from '../../middlewares/apikey.middleware';
import {
  CreateWebhookSchema,
  GetWebhookSchema,
  UpdateWebhookSchema,
  DeleteWebhookSchema,
  validateSchema,
} from '../../../utils/schema';
import {
  createWebhook,
  getWebhook,
  updateWebhook,
  deleteWebhook,
  handleIncomingWebhookEvent,
  listWebhookEvents,
} from '../../services/Webhook/webhook.service';
import db from '../../../db';
import { eq } from 'drizzle-orm';
import { providerConfigs, services } from '../../../db/schema';

const webhookRouter = express.Router();

// ─── Authenticated webhook management routes ──────────────────────────────────
// These routes allow tenants to register/manage webhooks with the provider.
// They are protected by the API-key middleware.

/**
 * POST /webhook
 *
 * Registers a new webhook endpoint with the payment provider (Stripe or Razorpay)
 * configured for the specified service.
 *
 * Body:
 *   serviceId    - UUID of the service
 *   url          - Publicly accessible HTTPS URL to receive events
 *   events       - Array of provider event names (e.g. ["payment.captured"])
 *   secret?      - Optional signing secret; provider may auto-generate one
 *   alert_email? - Optional email for failure alerts (Razorpay)
 *   accountId?   - Optional account scope (Razorpay Routes)
 */
webhookRouter.post('/', authenticateApiKey, async (req: ApiKeyRequest, res, next) => {
  try {
    const { error: zodError, data } = validateSchema(CreateWebhookSchema, req.body);
    if (zodError) {
      res.status(400).json({
        status: 'failed',
        error: zodError.issues
          .map((e: any) => `${e.path.join('.')}: ${e.message}`)
          .join(', '),
      });
      return;
    }

    const result = await createWebhook(data, req.companyId!);
    if (result.status === 'failed') {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /webhook/:webhookId
 *
 * Fetches a specific webhook from the provider by its provider-assigned ID.
 *
 * Query params:
 *   serviceId   - UUID of the service
 *   accountId?  - Razorpay account ID (optional)
 */
webhookRouter.get('/:webhookId', authenticateApiKey, async (req: ApiKeyRequest, res, next) => {
  try {
    const { error: zodError, data } = validateSchema(GetWebhookSchema, {
      serviceId: req.query.serviceId,
      webhookId: req.params.webhookId,
      accountId: req.query.accountId,
    });
    if (zodError) {
      res.status(400).json({
        status: 'failed',
        error: zodError.issues
          .map((e: any) => `${e.path.join('.')}: ${e.message}`)
          .join(', '),
      });
      return;
    }

    const result = await getWebhook(data, req.companyId!);
    if (result.status === 'failed') {
      const isNotFound = result.error?.includes('not found');
      res.status(isNotFound ? 404 : 400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /webhook/:webhookId
 *
 * Updates an existing webhook (URL, events, secret, alert email).
 *
 * Body:
 *   serviceId    - UUID of the service
 *   accountId?   - Razorpay account scope
 *   url?         - New callback URL
 *   events?      - Updated list of event names
 *   secret?      - New signing secret
 *   alert_email? - New alert email
 */
webhookRouter.patch('/:webhookId', authenticateApiKey, async (req: ApiKeyRequest, res, next) => {
  try {
    const { error: zodError, data } = validateSchema(UpdateWebhookSchema, {
      ...req.body,
      webhookId: req.params.webhookId,
    });
    if (zodError) {
      res.status(400).json({
        status: 'failed',
        error: zodError.issues
          .map((e: any) => `${e.path.join('.')}: ${e.message}`)
          .join(', '),
      });
      return;
    }

    const result = await updateWebhook(data, req.companyId!);
    if (result.status === 'failed') {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /webhook/:webhookId
 *
 * Deletes (or deactivates) a webhook with the provider.
 *
 * Body:
 *   serviceId   - UUID of the service
 *   accountId?  - Razorpay account scope
 */
webhookRouter.delete('/:webhookId', authenticateApiKey, async (req: ApiKeyRequest, res, next) => {
  try {
    const { error: zodError, data } = validateSchema(DeleteWebhookSchema, {
      serviceId: req.body.serviceId ?? req.query.serviceId,
      webhookId: req.params.webhookId,
      accountId: req.body.accountId ?? req.query.accountId,
    });
    if (zodError) {
      res.status(400).json({
        status: 'failed',
        error: zodError.issues
          .map((e: any) => `${e.path.join('.')}: ${e.message}`)
          .join(', '),
      });
      return;
    }

    const result = await deleteWebhook(data, req.companyId!);
    if (result.status === 'failed') {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// ─── Incoming event routes (unauthenticated — called by providers) ─────────────
// These endpoints receive raw events from Stripe/Razorpay.
// They must read the raw body (not the parsed JSON) for signature verification.
// Mount express.raw() inline per-route to keep the rest of the app using JSON.

/**
 * POST /webhook/events/stripe
 *
 * Stripe webhook receiver.
 * Stripe sends a `Stripe-Signature` header for verification.
 *
 * Required env var: STRIPE_WEBHOOK_SECRET (whsec_…)
 *
 * The serviceId is passed as a query param so the correct credentials are used.
 */
webhookRouter.post(
  '/events/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res, next) => {
    try {
      const serviceId = req.query.serviceId as string;
      const signature = req.headers['stripe-signature'] as string;
      const secret = process.env.STRIPE_WEBHOOK_SECRET ?? '';

      if (!serviceId || !signature) {
        res.status(400).json({ status: 'failed', error: 'Missing serviceId or Stripe-Signature header' });
        return;
      }

      // Look up credentials for this service
      const configs = await db
        .select()
        .from(providerConfigs)
        .innerJoin(services, eq(providerConfigs.serviceId, services.id))
        .where(eq(providerConfigs.serviceId, serviceId))
        .limit(1);

      if (!configs[0]) {
        res.status(400).json({ status: 'failed', error: 'Service or provider config not found' });
        return;
      }

      const rawCreds = JSON.parse(configs[0].provider_configs.credentialsEncrypted as string);
      const credentials = {
        apiKey: rawCreds['STRIPE_SECRET_KEY'] ?? rawCreds['apiKey'],
      };

      const result = await handleIncomingWebhookEvent({
        provider: 'stripe',
        rawBody: req.body as Buffer,
        signature,
        secret,
        credentials,
      });

      if (result.status === 'failed') {
        // Return 400 so Stripe retries (except signature mismatch → 401)
        const isAuthError = result.error?.includes('signature');
        res.status(isAuthError ? 401 : 400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /webhook/events/razorpay
 *
 * Razorpay webhook receiver.
 * Razorpay sends a `X-Razorpay-Signature` header for HMAC-SHA256 verification.
 *
 * Required env var: RAZORPAY_WEBHOOK_SECRET
 *
 * The serviceId is passed as a query param so the correct credentials are used.
 */
webhookRouter.post(
  '/events/razorpay',
  express.raw({ type: 'application/json' }),
  async (req, res, next) => {
    try {
      const serviceId = req.query.serviceId as string;
      const signature = req.headers['x-razorpay-signature'] as string;
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';

      if (!serviceId || !signature) {
        res.status(400).json({
          status: 'failed',
          error: 'Missing serviceId or X-Razorpay-Signature header',
        });
        return;
      }

      const configs = await db
        .select()
        .from(providerConfigs)
        .innerJoin(services, eq(providerConfigs.serviceId, services.id))
        .where(eq(providerConfigs.serviceId, serviceId))
        .limit(1);

      if (!configs[0]) {
        res.status(400).json({ status: 'failed', error: 'Service or provider config not found' });
        return;
      }

      const rawCreds = JSON.parse(configs[0].provider_configs.credentialsEncrypted as string);
      const credentials = {
        apiKey: rawCreds['RAZORPAY_KEY_ID'],
        apiSecret: rawCreds['RAZORPAY_KEY_SECRET'],
      };

      const result = await handleIncomingWebhookEvent({
        provider: 'razorpay',
        rawBody: req.body as Buffer,
        signature,
        secret,
        credentials,
      });

      if (result.status === 'failed') {
        const isAuthError = result.error?.includes('signature');
        res.status(isAuthError ? 401 : 400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /webhook/events
 *
 * Lists stored webhook events from the `webhook_events` table.
 * Protected by API key — for internal dashboard / debugging use.
 *
 * Query params:
 *   provider?   - Filter by 'stripe' | 'razorpay'
 *   processed?  - Filter by processed status (true | false)
 *   limit?      - Max results (default 50)
 */
webhookRouter.get('/events', authenticateApiKey, async (_req: ApiKeyRequest, res, next) => {
  try {
    const provider = _req.query.provider as 'stripe' | 'razorpay' | undefined;
    const processedParam = _req.query.processed;
    const processed =
      processedParam === 'true' ? true : processedParam === 'false' ? false : undefined;
    const limit = _req.query.limit ? parseInt(_req.query.limit as string, 10) : 50;

    const result = await listWebhookEvents({ provider, processed, limit });
    if (result.status === 'failed') {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

export default webhookRouter;
