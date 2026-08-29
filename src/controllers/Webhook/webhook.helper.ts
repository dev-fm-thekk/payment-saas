import crypto from "crypto";
import db from "../../../db";
import { companies, webhookEndpoints, webhookEvents } from "../../../db/schema";
import { and, eq } from "drizzle-orm";

type WebhookEndpoint = {
  id: string;
  companyId: string;
  provider: string;
  url: string;
  createdAt: string;
};

type CreateWebhookEndpoint = Omit<WebhookEndpoint, "id" | "createdAt" | "url">;

type WebhookEvents = {
  payload: any;
  received_at: string;
  webhookEndpoint: string;
};

function generateWebhookUrl(
  provider: string,
  companyId: string,
  baseUrl: string,
): string {
  let uniqueSecret = crypto.randomBytes(16).toString("hex");

  let url = `${baseUrl}/webhook/${companyId}/${provider}/${uniqueSecret}`;

  return url;
}

export const createWebhook = async (
  input: CreateWebhookEndpoint,
  baseUrl: string,
) => {
  let { provider, companyId } = input;
  let url = generateWebhookUrl(provider, companyId, baseUrl);
  let insertData = {
    ...input,
    url,
  };
  let response = await db
    .insert(webhookEndpoints)
    .values(insertData)
    .returning();
  if (response.length < 1)
    throw new Error(
      "DB Error: unable to insert values in webhook_endpoints table",
    );
  return response;
};

export const handleWebhook = async (input: WebhookEvents) => {
  let webhookEndpoint = await db
    .select({ id: webhookEndpoints.id })
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.url, input.webhookEndpoint))
    .limit(1);

  if (webhookEndpoint.length < 1) return "WEBHOOK_ENDPOINT_NOT_FOUND";

  let webhookEndpointId = webhookEndpoint[0]?.id as string;

  let insertData = {
    payload: input.payload,
    received_at: input.received_at,
    webhookEndpointId: webhookEndpointId,
  };
  let response = await db.insert(webhookEvents).values(insertData).returning();
  if (response.length < 1)
    throw new Error("DB Error: unable to insert value in webhook_events table");

  return response;
};

export const checkCompanyExists = async (
  companyId: string,
): Promise<boolean> => {
  let company = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.id, companyId));

  if (company.length < 1) return false;

  return true;
};

export const checkProviderExists = async (
  provider: string,
): Promise<Boolean> => {
  const providers = ["razorpay", "stripe", "paypal", "upi"];

  if (providers.includes(provider)) return true;

  return false;
};

export const fetchWebhookEndpoints = async (
  companyId: string,
  provider: string,
) => {
  let webhooks = await db
    .select()
    .from(webhookEndpoints)
    .where(
      and(
        eq(webhookEndpoints.companyId, companyId),
        eq(webhookEndpoints.provider, provider),
      ),
    );

  return webhooks;
};

type NormalizedLogs = {
  event: string;
  status: string;
  amount: number | null;
  currency: string;
  timestamp: string;
};

function normalizeRazorpayPayload(log: any): NormalizedLogs {
  const payment = log?.payload?.payment?.entity;

  return {
    event: log?.event ?? "N/A",
    amount: payment?.amount ?? null,
    currency: payment?.currency ?? "N/A",
    timestamp: log?.created_at ?? "N/A",
    status: payment?.status ?? "N/A",
  };
}

function normalizeLogBody(logs: any, provider: string): NormalizedLogs {
  if (provider === "RAZORPAY") return normalizeRazorpayPayload(logs);
  return { event: "N/A", status: "N/A", amount: null, currency: "N/A", timestamp: "N/A" };
}

export const fetchWebhookEvents = async (webhookEndpointId: string) => {
  const events = await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.webhookEndpointId, webhookEndpointId));

  /*
    normalizing log payload from native providers;
  */

  // Fetch the provider once — all events share the same webhookEndpointId.
  const endpointResponse = await db
    .select({ provider: webhookEndpoints.provider })
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.id, webhookEndpointId))
    .limit(1);
  const provider = endpointResponse[0]?.provider ?? "";

  const logs = await Promise.all(
    events.map((item) => {
      const normalizedLogs = normalizeLogBody(item.payload, provider.toUpperCase());
      return { ...item, payload: normalizedLogs };
    }),
  );

  return logs;
};
