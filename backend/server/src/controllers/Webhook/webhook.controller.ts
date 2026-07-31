import type { ApiKeyRequest } from '../../middlewares/apikey.middleware';
import {
  CreateWebhookSchema,
  GetWebhookSchema,
  UpdateWebhookSchema,
  DeleteWebhookSchema,
  validateSchema,
} from '../../../utils/schema';
import { createWebhook, deleteWebhook, getWebhook, updateWebhook } from './webhook.helper';


export const createWebHookController = async (req: ApiKeyRequest,  res: any,  next: any) => {
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
};

export const getWebHookController = async (req: ApiKeyRequest,  res: any,  next: any) => {
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
};

export const updateWebHookController = async (req: ApiKeyRequest,  res: any,  next: any) => {
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
};

export const deleteWebhookController = async (req: ApiKeyRequest,  res: any,  next: any) => {
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
};

// export const post_events_stripe_handler4 = async (req: any,  res: any,  next: any) => {
//     try {
//       const serviceId = req.query.serviceId as string;
//       const signature = req.headers['stripe-signature'] as string;
//       const secret = process.env.STRIPE_WEBHOOK_SECRET ?? '';

//       if (!serviceId || !signature) {
//         res.status(400).json({ status: 'failed', error: 'Missing serviceId or Stripe-Signature header' });
//         return;
//       }

//       // Look up credentials for this service
//       const configs = await db
//         .select()
//         .from(providerConfigs)
//         .innerJoin(services, eq(providerConfigs.serviceId, services.id))
//         .where(eq(providerConfigs.serviceId, serviceId))
//         .limit(1);

//       if (!configs[0]) {
//         res.status(400).json({ status: 'failed', error: 'Service or provider config not found' });
//         return;
//       }

//       const rawCreds = JSON.parse(configs[0].provider_configs.credentialsEncrypted as string);
//       const credentials = {
//         apiKey: rawCreds['STRIPE_SECRET_KEY'] ?? rawCreds['apiKey'],
//       };

//       const result = await handleIncomingWebhookEvent({
//         provider: 'stripe',
//         rawBody: req.body as Buffer,
//         signature,
//         secret,
//         credentials,
//       });

//       if (result.status === 'failed') {
//         // Return 400 so Stripe retries (except signature mismatch → 401)
//         const isAuthError = result.error?.includes('signature');
//         res.status(isAuthError ? 401 : 400).json(result);
//         return;
//       }

//       res.status(200).json(result);
//     } catch (err) {
//       next(err);
//     }
//   };

// export const post_events_razorpay_handler5 = async (req: any,  res: any,  next: any) => {
//     try {
//       const serviceId = req.query.serviceId as string;
//       const signature = req.headers['x-razorpay-signature'] as string;
//       const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';

//       if (!serviceId || !signature) {
//         res.status(400).json({
//           status: 'failed',
//           error: 'Missing serviceId or X-Razorpay-Signature header',
//         });
//         return;
//       }

//       const configs = await db
//         .select()
//         .from(providerConfigs)
//         .innerJoin(services, eq(providerConfigs.serviceId, services.id))
//         .where(eq(providerConfigs.serviceId, serviceId))
//         .limit(1);

//       if (!configs[0]) {
//         res.status(400).json({ status: 'failed', error: 'Service or provider config not found' });
//         return;
//       }

//       const rawCreds = JSON.parse(configs[0].provider_configs.credentialsEncrypted as string);
//       const credentials = {
//         apiKey: rawCreds['RAZORPAY_KEY_ID'],
//         apiSecret: rawCreds['RAZORPAY_KEY_SECRET'],
//       };

//       const result = await handleIncomingWebhookEvent({
//         provider: 'razorpay',
//         rawBody: req.body as Buffer,
//         signature,
//         secret,
//         credentials,
//       });

//       if (result.status === 'failed') {
//         const isAuthError = result.error?.includes('signature');
//         res.status(isAuthError ? 401 : 400).json(result);
//         return;
//       }

//       res.status(200).json(result);
//     } catch (err) {
//       next(err);
//     }
//   };

// export const get_events_handler6 = async (_req: ApiKeyRequest,  res: any,  next: any) => {
//   try {
//     const provider = _req.query.provider as 'stripe' | 'razorpay' | undefined;
//     const processedParam = _req.query.processed;
//     const processed =
//       processedParam === 'true' ? true : processedParam === 'false' ? false : undefined;
//     const limit = _req.query.limit ? parseInt(_req.query.limit as string, 10) : 50;

//     const result = await listWebhookEvents({ provider, processed, limit });
//     if (result.status === 'failed') {
//       res.status(400).json(result);
//       return;
//     }

//     res.status(200).json(result);
//   } catch (err) {
//     next(err);
//   }
// };
