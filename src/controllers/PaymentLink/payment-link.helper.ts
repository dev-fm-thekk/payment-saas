import db from "../../../db";
import { paymentLinks } from "../../../db/schema";
import { eq } from "drizzle-orm";

type PaymentLink = {
  id: string;
  companyId: string;
  provider: string;
  url: string;
  status: string;
  createdAt: Date | string;
  expiresAt: Date | string;
};

type CreatePaymentLink = Omit<PaymentLink, "id" | "createdAt" | "status">;

type UpdatePaymentLink = Partial<Pick<PaymentLink, "url" | "status" | "expiresAt">>;

export const createPaymentLink = async (input: CreatePaymentLink): Promise<Array<any>> => {
  const insertData = {
    ...input,
    status: "active",
    expiresAt:
      typeof input.expiresAt === "string" ? new Date(input.expiresAt) : input.expiresAt,
  };
  const response = await db.insert(paymentLinks).values(insertData).returning();
  if (response.length < 1)
    throw new Error("DB Error: Unable to create payment link, db insert error");
  return response;
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