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
 */
export const createPaymentLink = async (input: CreatePaymentLinkInput) => {
  const { adapter, provider } = await resolveAdapter(input.providerId);

  // Call the provider API
  const providerResponse = await adapter.createPaymentLink(input.linkRequest);

  // Persist the result
  const insertData = {
    companyId: input.companyId,
    provider: provider.type,
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