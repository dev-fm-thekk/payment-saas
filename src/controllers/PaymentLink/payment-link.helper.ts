import { randomUUID } from "crypto";
import db from "@db";
import { paymentLinks } from "@schema";
import { eq } from "drizzle-orm";
import { resolveAdapter } from "@lib/adapter.factory";
import type { CreatePaymentLinkRequest } from "@core/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreatePaymentLinkInput = {
  /** ID of the provider row (from the providers table) */
  providerId: string;
  companyId: string;
  /** Full CreatePaymentLinkRequest forwarded to the adapter */
  linkRequest: CreatePaymentLinkRequest;
  expiresAt?: string | Date;
};

type UpdatePaymentLink = Partial<{
  url: string;
  status: "active" | "expired" | "consumed";
  expiresAt: string | Date;
}>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Calls the provider adapter to create a payment link, then persists the
 * resulting URL and metadata in the payment_links table.
 *
 * The local UUID is generated *before* the provider call and injected into
 * `metadata.paymentLinkId` so the provider echoes it back in every webhook
 * event. This lets the webhook resolve the invoice via a direct local-UUID
 * lookup — no provider link ID mapping needed.
 */
export const createPaymentLink = async (input: CreatePaymentLinkInput) => {
  const { adapter, provider } = await resolveAdapter(input.providerId);

  // Generate the local UUID upfront so it can travel with the payment link
  // through the provider and come back on every webhook event.
  const localId = randomUUID();

  // Inject the local UUID into the provider metadata so the webhook can
  // identify this exact DB record without any extra mapping step.
  const enrichedLinkRequest: CreatePaymentLinkRequest = {
    ...input.linkRequest,
    metadata: {
      ...input.linkRequest.metadata,
      paymentLinkId: localId,
    },
  };

  // Call the provider API with the enriched request
  const providerResponse = await adapter.createPaymentLink(enrichedLinkRequest);

  // Persist with the pre-generated UUID so the local record ID matches
  // what was sent to the provider in metadata.
  const insertData = {
    id: localId,
    companyId: input.companyId,
    provider: provider.type,
    providerLinkId: (providerResponse as any).id ?? null,
    url: providerResponse.url,
    status: "active" as const,
    expiresAt: input.expiresAt
      ? typeof input.expiresAt === "string"
        ? new Date(input.expiresAt)
        : input.expiresAt
      : undefined,
  };

  const [record] = await db.insert(paymentLinks).values(insertData).returning();
  if (!record) throw new Error("DB Error: Unable to create payment link record");

  return { record, providerResponse };
};

export const getPaymentLinkById = async (id: string) => {
  const [link] = await db.select().from(paymentLinks).where(eq(paymentLinks.id, id));
  return link ?? null;
};

export const listPaymentLinksByCompany = async (companyId: string) => {
  return db.select().from(paymentLinks).where(eq(paymentLinks.companyId, companyId));
};

export const updatePaymentLinkById = async (id: string, input: UpdatePaymentLink) => {
  const updateData: Record<string, unknown> = { ...input };
  if (input.expiresAt)
    updateData.expiresAt =
      typeof input.expiresAt === "string" ? new Date(input.expiresAt) : input.expiresAt;

  const [updated] = await db
    .update(paymentLinks)
    .set(updateData)
    .where(eq(paymentLinks.id, id))
    .returning();

  return updated ?? null;
};

export const deletePaymentLinkById = async (id: string) => {
  const [deleted] = await db
    .delete(paymentLinks)
    .where(eq(paymentLinks.id, id))
    .returning();

  return deleted ?? null;
};