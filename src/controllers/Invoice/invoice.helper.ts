import crypto from "crypto";
import db from "@db";
import { clients, invoices } from "@schema";
import { and, eq } from "drizzle-orm";

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

export const listInvoicesByClient = async (clientId: string, status?: string) => {
  const conditions = [eq(invoices.clientId, clientId)];
  if (status) {
    conditions.push(eq(invoices.status, status));
  }
  return db.select().from(invoices).where(and(...conditions));
};

export const getCompletedInvoicesByClient = async (clientId: string) => {
  return listInvoicesByClient(clientId, "paid");
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

import { notifications, paymentLinks } from "@schema";
import { sendInvoiceNotification } from "@services/notification/index";

export const notifyInvoiceById = async (id: string, userId: string) => {
  const invoice = await getInvoiceById(id);
  if (!invoice) return "INVOICE_NOT_FOUND";

  const client = await db
    .select({ email: clients.email, name: clients.name })
    .from(clients)
    .where(eq(clients.id, invoice.clientId!))
    .limit(1);

  if (client.length === 0) return "CLIENT_NOT_FOUND";
  if (!client[0]!.email) return "CLIENT_EMAIL_NOT_FOUND";

  let paymentUrl = "";
  if (invoice.paymentLinkId) {
    const pLink = await db
      .select({ url: paymentLinks.url })
      .from(paymentLinks)
      .where(eq(paymentLinks.id, invoice.paymentLinkId))
      .limit(1);
    
    if (pLink.length > 0) {
      paymentUrl = pLink[0]!.url;
    }
  }

  const to = client[0]!.email;
  const subject = `Invoice ${invoice.invoiceNumber} from ${client[0]!.name}`;
  
  let body = `Hello ${client[0]!.name},\n\nYou have a new invoice (${invoice.invoiceNumber}) for the amount of ${invoice.currency} ${invoice.amount}.\nDue date: ${invoice.dueDate}\n`;
  if (paymentUrl) {
    body += `\nYou can pay your invoice here: ${paymentUrl}\n`;
  }
  body += `\nThank you!`;

  try {
    await sendInvoiceNotification(
      to,
      {
        clientName: client[0]!.name,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        paymentUrl,
      },
      `invoice-notif-${id}`,
    );
    
    // Log the notification
    await db.insert(notifications).values({
      to,
      userId,
      title: "Invoice Notification",
      subject,
      body,
      status: "sent",
    });

    // Update invoice status to pending
    const [updated] = await db
      .update(invoices)
      .set({ status: "pending", updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();

    return updated;
  } catch (err) {
    // Log failed notification
    await db.insert(notifications).values({
      to,
      userId,
      title: "Invoice Notification",
      subject,
      body,
      status: "failed",
    });
    return "EMAIL_FAILED";
  }
};


