import db from "@db";
import { providers } from "@schema";
import { eq, and } from "drizzle-orm";

export type ProviderType = "razorpay" | "stripe" | "paypal";

type Provider = {
  id: string;
  companyId: string;
  type: ProviderType;
  credentials: Record<string, unknown>;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type CreateProvider = Pick<Provider, "companyId" | "type" | "credentials">;
type UpdateProvider = Partial<Pick<Provider, "credentials">>;

export const createProvider = async (input: CreateProvider): Promise<Array<any>> => {
  const response = await db
    .insert(providers)
    .values(input)
    .returning();
  if (response.length < 1)
    throw new Error("DB Error: Unable to create provider, db insert error");
  return response;
};

export const getProviderById = async (id: string) => {
  const [provider] = await db.select().from(providers).where(eq(providers.id, id));
  return provider ?? null;
};

export const listProvidersByCompany = async (companyId: string) => {
  return db.select().from(providers).where(eq(providers.companyId, companyId));
};

export const getProviderByCompanyAndType = async (companyId: string, type: string) => {
  const [provider] = await db
    .select()
    .from(providers)
    .where(and(eq(providers.companyId, companyId), eq(providers.type, type)));
  return provider ?? null;
};

export const updateProviderById = async (id: string, input: UpdateProvider) => {
  const [updated] = await db
    .update(providers)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(providers.id, id))
    .returning();
  return updated ?? null;
};

export const deleteProviderById = async (id: string) => {
  const [deleted] = await db
    .delete(providers)
    .where(eq(providers.id, id))
    .returning();
  return deleted ?? null;
};
