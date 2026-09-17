import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import {
  checkCompanyExists,
  createWebhook,
  fetchWebhookEndpoints,
  fetchWebhookEvents,
  handleWebhook,
} from "./webhook.helper.js";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CreateWebhookSchema = z.object({
  /** ID of the row in the providers table used to resolve adapter credentials */
  providerId: z.string().uuid("providerId must be a valid UUID"),
  companyId: z.string().uuid("companyId must be a valid UUID"),
  /** Provider event names to subscribe to */
  events: z.array(z.string()).min(1, "At least one event is required"),
  alert_email: z.string().email().optional(),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

/*
 * POST /webhook
 * Registers a new webhook on the payment provider and creates a local endpoint record.
 */
export const createWebhookController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { data, error } = CreateWebhookSchema.safeParse(req.body);

  if (error) {
    res.status(400).json({ status: "failed", service: "webhook | create", error: error.issues });
    return;
  }

  const host = req.get("host");
  const protocol = req.protocol;
  const baseUrl = `${protocol}://${host}/api/v1`;

  try {
    const response = await createWebhook(data, baseUrl);
    res.status(201).json({ status: "success", service: "webhook | create", data: response });
  } catch (err: any) {
    if (err?.statusCode) {
      res.status(err.statusCode).json({ status: "failed", service: "webhook | create", error: err.message });
      return;
    }
    next(err);
  }
};

/*
 * POST /webhook/:companyId/:provider/:secret
 * Receives inbound webhook events from the payment provider.
 * No auth required — this URL is called by the provider.
 */
export const webhookHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { protocol, originalUrl } = req;
  const host = req.get("host");
  const webhookEndpoint = `${protocol}://${host}${originalUrl}`;

  try {
    console.log(`[Webhook] Received payload for endpoint: ${webhookEndpoint}`);

    const response = await handleWebhook({
      payload: req.body,
      received_at: new Date().toISOString(),
      webhookEndpoint,
    });

    if (response === "WEBHOOK_ENDPOINT_NOT_FOUND") {
      console.error(`[Webhook] Endpoint not found for URL: ${webhookEndpoint}`);
      res.status(404).json({
        status: "failed",
        service: "webhook | handler",
        error: "Webhook endpoint not found",
      });
      return;
    }

    res.status(201).json({ status: "success", service: "webhook | handler", data: response });
  } catch (err) {
    next(err);
  }
};

/*
 * GET /webhook/:companyId/:provider
 * Lists all webhook endpoints for a given company + provider.
 */
export const getWebhookEndpoints = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const companyId  = req.params.companyId as string;
  const provider = req.params.provider as string;

  const companyExists = await checkCompanyExists(companyId);
  if (!companyExists) {
    res.status(404).json({ status: "failed", service: "webhook | fetch", error: "Company not found" });
    return;
  }

  try {
    const response = await fetchWebhookEndpoints(companyId, provider);
    res.status(200).json({ status: "success", service: "webhook | fetch", data: response });
  } catch (err) {
    next(err);
  }
};

/*
 * GET /webhook/event/logs/:webhookEndpointId
 * Returns normalised event logs for a specific webhook endpoint.
 */
export const getWebhookEventLogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const webhookEndpointId  = req.params.webhookEndpointId as string;

  try {
    const response = await fetchWebhookEvents(webhookEndpointId);
    res.status(200).json({ status: "success", service: "webhook | logs", data: response });
  } catch (err) {
    next(err);
  }
};
