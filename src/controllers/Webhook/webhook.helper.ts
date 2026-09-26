import crypto from "crypto";
import db from "@db";
import { companies, webhookEndpoints, webhookEvents, invoices, paymentLinks } from "@schema";
import { and, eq } from "drizzle-orm";
import { resolveAdapter } from "@lib/adapter.factory";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateWebhookInput = {
  /** ID of the row in the providers table used to resolve adapter credentials */
  providerId: string;
  companyId: string;
  /** Webhook events to subscribe to, e.g. ["payment.captured", "refund.created"] */
  events: string[];
  alert_email?: string;
};

type WebhookEvents = {
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
  const { adapter, provider } = await resolveAdapter(input.providerId, input.companyId);

  const { url: localUrl, secret } = generateLocalWebhookUrl(
    provider.type,
    input.companyId,
    baseUrl,
  );

  // Register the webhook on the provider side using resolved adapter
  const providerResponse = await adapter.createWebhook({
    url: localUrl,
    events: input.events,
    secret,
    alert_email: input.alert_email,
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
    throw new Error(
      "DB Error: unable to insert values in webhook_endpoints table",
    );
  return { record, providerResponse };
};

export const processWebhookPaymentCompletion = async (
  payload: any,
  provider: string,
) => {
  try {
    let invoiceId: string | null = null;
    let paymentLinkId: string | null = null;
    let localPaymentLinkId: string | null = null;
    let isSuccessEvent = false;

    const normalizedProvider = (provider || "").toUpperCase();

    if (normalizedProvider === "RAZORPAY") {
      const event = payload?.event;
      if (
        event === "payment_link.paid" ||
        event === "payment.captured" ||
        event === "order.paid" ||
        event === "invoice.paid"
      ) {
        isSuccessEvent = true;
      }

      const pLinkEntity = payload?.payload?.payment_link?.entity;
      const paymentEntity = payload?.payload?.payment?.entity;

      if (pLinkEntity?.id) {
        paymentLinkId = pLinkEntity.id;
      }

      const notes = pLinkEntity?.notes || paymentEntity?.notes;
      if (notes) {
        invoiceId = notes.invoiceId || notes.invoice_id || null;
        localPaymentLinkId = notes.paymentLinkId || null;
      }

      console.log("Webhookk update test, Invoice id: ",invoiceId)
    } else if (normalizedProvider === "STRIPE") {
      const eventType = payload?.type;
      if (
        eventType === "checkout.session.completed" ||
        eventType === "payment_intent.succeeded" ||
        eventType === "charge.succeeded"
      ) {
        isSuccessEvent = true;
      }

      const sessionObj = payload?.data?.object;
      if (sessionObj?.payment_link) {
        paymentLinkId = sessionObj.payment_link;
      }

      const metadata = sessionObj?.metadata;
      if (metadata) {
        invoiceId = metadata.invoiceId || metadata.invoice_id || null;
        localPaymentLinkId = metadata.paymentLinkId || null;
      }
      if (!invoiceId && sessionObj?.client_reference_id) {
        invoiceId = sessionObj.client_reference_id;
      }
    } else {
      const eventType = payload?.event || payload?.type;
      if (
        typeof eventType === "string" &&
        (eventType.includes("paid") ||
          eventType.includes("captured") ||
          eventType.includes("succeeded") ||
          eventType.includes("completed"))
      ) {
        isSuccessEvent = true;
      }
      invoiceId =
        payload?.metadata?.invoiceId ||
        payload?.invoiceId ||
        payload?.invoice_id ||
        null;
      localPaymentLinkId = payload?.metadata?.paymentLinkId || null;
      paymentLinkId = payload?.paymentLinkId || payload?.payment_link_id || null;
    }

    if (!isSuccessEvent) return null;

    let targetInvoice = null;

    // 1. Direct lookup by invoiceId extracted from webhook payload metadata.
    if (invoiceId) {
      const found = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoiceId))
        .limit(1);
      if (found.length > 0) targetInvoice = found[0];
    }

    // 2. Direct lookup by localPaymentLinkId (our local UUID) extracted from metadata.
    if (!targetInvoice && localPaymentLinkId) {
      const foundLink = await db
        .select({ id: paymentLinks.id, invoiceId: paymentLinks.invoiceId })
        .from(paymentLinks)
        .where(eq(paymentLinks.id, localPaymentLinkId))
        .limit(1);
        
      if (foundLink.length > 0) {
        const localLink = foundLink[0]!;
        if (localLink.invoiceId) {
          const found = await db
            .select()
            .from(invoices)
            .where(eq(invoices.id, localLink.invoiceId))
            .limit(1);
          if (found.length > 0) targetInvoice = found[0];
        }
        
        if (!targetInvoice) {
          const found = await db
            .select()
            .from(invoices)
            .where(eq(invoices.paymentLinkId, localLink.id))
            .limit(1);
          if (found.length > 0) targetInvoice = found[0];
        }
      }
    }

    // 3. Look up the local payment_links record via the provider's own link ID,
    //    then follow its invoiceId (backfilled at invoice-creation time).
    //    This is the primary path when the invoice was created after the link.
    if (!targetInvoice && paymentLinkId) {
      const foundLink = await db
        .select({ id: paymentLinks.id, invoiceId: paymentLinks.invoiceId })
        .from(paymentLinks)
        .where(eq(paymentLinks.providerLinkId, paymentLinkId))
        .limit(1);

      if (foundLink.length > 0) {
        const localLink = foundLink[0]!;

        if (localLink.invoiceId) {
          // Fast path: invoiceId already backfilled on the link record.
          const found = await db
            .select()
            .from(invoices)
            .where(eq(invoices.id, localLink.invoiceId))
            .limit(1);
          if (found.length > 0) targetInvoice = found[0];
        }

        if (!targetInvoice) {
          // Slower fallback: search by local payment_link UUID on the invoice.
          const found = await db
            .select()
            .from(invoices)
            .where(eq(invoices.paymentLinkId, localLink.id))
            .limit(1);
          if (found.length > 0) targetInvoice = found[0];
        }
      }
    }

    if (targetInvoice) {
      const now = new Date();
      await db
        .update(invoices)
        .set({
          status: "paid",
          paidAt: now,
          updatedAt: now,
        })
        .where(eq(invoices.id, targetInvoice.id));

      if (targetInvoice.paymentLinkId) {
        await db
          .update(paymentLinks)
          .set({ status: "consumed" })
          .where(eq(paymentLinks.id, targetInvoice.paymentLinkId));
      }

      console.log(
        `[Webhook Processor] Invoice ${targetInvoice.id} (${targetInvoice.invoiceNumber}) marked as 'paid'`,
      );
      return targetInvoice.id;
    }
  } catch (err) {
    console.error("[Webhook Processor] Error processing payment completion:", err);
  }

  return null;
};

export const handleWebhook = async (input: WebhookEvents) => {
  let webhookEndpoint = await db
    .select({ id: webhookEndpoints.id, provider: webhookEndpoints.provider })
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.url, input.webhookEndpoint))
    .limit(1);

  if (webhookEndpoint.length < 1) return "WEBHOOK_ENDPOINT_NOT_FOUND";

  let webhookEndpointId = webhookEndpoint[0]?.id as string;
  let provider = webhookEndpoint[0]?.provider as string;

  let insertData = {
    payload: input.payload,
    received_at: input.received_at,
    webhookEndpointId: webhookEndpointId,
  };
  let response = await db.insert(webhookEvents).values(insertData).returning();
  if (response.length < 1)
    throw new Error("DB Error: unable to insert value in webhook_events table");

  await processWebhookPaymentCompletion(input.payload, provider);

  return response;
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

function normalizeStripePayload(log: any): NormalizedLog {
  const obj = log?.data?.object;
  return {
    event: log?.type ?? "N/A",
    amount: obj?.amount_total ?? obj?.amount ?? null,
    currency: obj?.currency?.toUpperCase() ?? "N/A",
    timestamp: log?.created ? new Date(log.created * 1000).toISOString() : "N/A",
    status: obj?.payment_status ?? obj?.status ?? "N/A",
  };
}

function normalizeLogBody(logs: any, provider: string): NormalizedLog {
  if (provider === "RAZORPAY") return normalizeRazorpayPayload(logs);
  if (provider === "STRIPE") return normalizeStripePayload(logs);
  return {
    event: logs?.event ?? logs?.type ?? "N/A",
    status: logs?.status ?? "N/A",
    amount: logs?.amount ?? null,
    currency: logs?.currency ?? "N/A",
    timestamp: logs?.timestamp ?? "N/A",
  };
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
