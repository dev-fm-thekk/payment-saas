import crypto from "crypto";
import db from "../../../db";
import { clients, invoices } from "../../../db/schema";
import { eq } from "drizzle-orm";

type Invoice = {
  id: string;
  invoiceNumber: string;
  title: string;
  description: string;
  clientId: string;
  amount: number;
  currency: string;
  status: string;
  paymentLinkId: string;
  dueDate: string;
  updatedAt: string;
  createdAt: string;
};

type CreateInvoice = Omit<Invoice, "id" | "invoiceNumber" | "updatedAt" | "createdAt">;

type UpdateInvoice = Partial<Pick<Invoice, "title" | "description" | "amount" | "currency" | "status" | "paymentLinkId" | "dueDate">>;

function generateInvoiceNumber(prefix: string) {
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${random}`;
}

export const createInvoice = async (input: CreateInvoice) => {
  const client = await db
    .select({ name: clients.name })
    .from(clients)
    .where(eq(clients.id, input.clientId))
    .limit(1);

  if (client.length < 1) return "CLIENT_NOT_FOUND";

  const clientName = client[0]!.name;
  const invoiceNumber = generateInvoiceNumber(clientName);

  const insertData = {
    ...input,
    invoiceNumber,
    dueDate: new Date(input.dueDate),
  };

  const response = await db.insert(invoices).values(insertData).returning();
  if (!response || response.length < 1)
    throw new Error("DB Error: Failed inserting row to invoice table");

  return response;
};

export const getInvoiceById = async (id: string) => {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, id));

  return invoice ?? null;
};

export const listInvoicesByClient = async (clientId: string) => {
  return db.select().from(invoices).where(eq(invoices.clientId, clientId));
};

export const updateInvoiceById = async (id: string, input: UpdateInvoice) => {
  const updateData: Record<string, unknown> = {
    ...input,
    updatedAt: new Date(),
  };

  if (input.dueDate) updateData.dueDate = new Date(input.dueDate);

  const [updated] = await db
    .update(invoices)
    .set(updateData)
    .where(eq(invoices.id, id))
    .returning();

  return updated ?? null;
};

export const deleteInvoiceById = async (id: string) => {
  const [deleted] = await db
    .delete(invoices)
    .where(eq(invoices.id, id))
    .returning();

  return deleted ?? null;
};
