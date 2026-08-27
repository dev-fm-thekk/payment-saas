import crypto from "crypto";
import db from "../../../db";
import { clients, companies, invoices } from "../../../db/schema";
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

type CreateInvoice = Omit<
  Invoice,
  "id" | "invoiceNumber" | "updatedAt" | "createdAt"
>;

function generateInvoiceNumber(prefix: string) {
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();

  let invNumber = `${prefix}-${random}`;

  return invNumber;
}

export const createInvoice = async (input: CreateInvoice) => {
  let client = await db
    .select({ name: clients.name })
    .from(clients)
    .where(eq(clients.id, input.clientId))
    .limit(1);

  if (client.length < 0) return "CLIENT_NOT_FOUND";

  let clientName = client[0]?.name as string;

  let invoiceNumber = generateInvoiceNumber(clientName);

  let insertData = {
    ...input,
    invoiceNumber,
    dueDate: new Date(input.dueDate),
  };

  let response = await db.insert(invoices).values(insertData).returning();

  if (!response || response.length < 1)
    throw new Error("DB Error: Failed inserting row to invoice table");

  return response;
};
