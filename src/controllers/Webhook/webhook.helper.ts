import crypto from "crypto";
import db from "../../../db/index.js";
import { companies, webhookEndpoints, webhookEvents } from "../../../db/schema.js";
import { and, eq } from "drizzle-orm";
import { resolveAdapter } from "../../lib/adapter.factory.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateWebhookInput = {
  /** ID of the row in the providers table */
  providerId: string;
  companyId: string;
  /** Webhook events to subscribe to, e.g. ["payment.captured", "refund.created"] */
  events: string[];
  alert_email?: string;
  /** Razorpay: sub-account ID */
  accountId?: string;
};

type WebhookEventInput = {
  payload: any;
  received_at: string;
  webhookEndpoint: string;
};

// ─── Internal helpers ────────────────────────────────────────────────────────

function generateLocalWebhookUrl(
  providerType: string,
  companyId: string,
  baseUrl: string,
): { url: string; secret: string } {
  const secret = crypto.randomBytes(16).toString("hex");
  const url = `${baseUrl}/webhook/${companyId}/${providerType}/${secret}`;
  return { url, secret };
}

// ─── Exported helpers ─────────────────────────────────────────────────────────

/**
 * Creates a webhook on the payment provider (via the adapter) and registers
 * the local endpoint URL in the webhook_endpoints table.
 *
 * Flow:
 *  1. Resolve the adapter from providerId.
 *  2. Build a unique local receive URL (/api/v1/webhook/:companyId/:provider/:secret).
 *  3. Register that URL on the provider side via adapter.createWebhook().
 *  4. Persist the local endpoint record.
 */
export const createWebhook = async (
  input: CreateWebhookInput,
  baseUrl: string,
) => {
  const { adapter, provider } = await resolveAdapter(input.providerId);

  const { url: localUrl, secret } = generateLocalWebhookUrl(
    provider.type,
    input.companyId,
    baseUrl,
  );

  // Register the webhook on the provider side
  const providerResponse = await adapter.createWebhook({
    url: localUrl,
    events: input.events,
    secret,
    alert_email: input.alert_email,
    accountId: input.accountId,
  });

  // Persist the local endpoint record
  const [record] = await db
    .insert(webhookEndpoints)
    .values({
      companyId: input.companyId,
      provider: provider.type,
      url: localUrl,
    })
    .returning();

  if (!record)
    throw new Error("DB Error: unable to insert values in webhook_endpoints table");

  return { record, providerResponse };
};

/**
 * Receives an inbound webhook event (from the provider hitting our local URL),
 * matches it to the endpoint record, and stores the raw payload.
 */
export const handleWebhook = async (input: WebhookEventInput) => {
  const [endpoint] = await db
    .select({ id: webhookEndpoints.id })
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.url, input.webhookEndpoint))
    .limit(1);

  if (!endpoint) return "WEBHOOK_ENDPOINT_NOT_FOUND";

  const [event] = await db
    .insert(webhookEvents)
    .values({
      payload: input.payload,
      webhookEndpointId: endpoint.id,
    })
    .returning();

  if (!event)
    throw new Error("DB Error: unable to insert value in webhook_events table");

  return event;
};

export const checkCompanyExists = async (companyId: string): Promise<boolean> => {
  const [company] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  return !!company;
};

export const fetchWebhookEndpoints = async (companyId: string, provider: string) => {
  return db
    .select()
    .from(webhookEndpoints)
    .where(
      and(
        eq(webhookEndpoints.companyId, companyId),
        eq(webhookEndpoints.provider, provider),
      ),
    );
};

// ─── Normalisation ───────────────────────────────────────────────────────────

type NormalizedLog = {
  event: string;
  status: string;
  amount: number | null;
  currency: string;
  timestamp: string;
};

function normalizeRazorpayPayload(log: any): NormalizedLog {
  const payment = log?.payload?.payment?.entity;
  return {
    event: log?.event ?? "N/A",
    amount: payment?.amount ?? null,
    currency: payment?.currency ?? "N/A",
    timestamp: log?.created_at ?? "N/A",
    status: payment?.status ?? "N/A",
  };
}

function normalizeLogBody(logs: any, provider: string): NormalizedLog {
  if (provider === "RAZORPAY") return normalizeRazorpayPayload(logs);
  return { event: "N/A", status: "N/A", amount: null, currency: "N/A", timestamp: "N/A" };
}

export const fetchWebhookEvents = async (webhookEndpointId: string) => {
  const events = await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.webhookEndpointId, webhookEndpointId));

  const [endpointRow] = await db
    .select({ provider: webhookEndpoints.provider })
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.id, webhookEndpointId))
    .limit(1);

  const provider = endpointRow?.provider ?? "";

  return events.map((item) => ({
    ...item,
    payload: normalizeLogBody(item.payload, provider.toUpperCase()),
  }));
};
