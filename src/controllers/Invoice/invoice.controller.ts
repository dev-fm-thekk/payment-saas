import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import {
  createInvoice,
  getInvoiceById,
  listInvoicesByClient,
  updateInvoiceById,
  deleteInvoiceById,
} from "./invoice.helper";

const CreateInvoiceSchema = z.object({
  title: z.string(),
  description: z.string(),
  clientId: z.string().uuid(),
  amount: z.string().transform((v) => parseInt(v, 10)),
  currency: z.string(),
  status: z.string().default("draft"),
  paymentLinkId: z.string().uuid().optional(),
  dueDate: z.string(),
});

const UpdateInvoiceSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  amount: z
    .string()
    .transform((v) => parseInt(v, 10))
    .optional(),
  currency: z.string().optional(),
  status: z.string().optional(),
  paymentLinkId: z.string().uuid().optional(),
  dueDate: z.string().optional(),
});

/*
 * POST /
 * Create a new invoice
 */
export const createInvoiceController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { data, error } = CreateInvoiceSchema.safeParse(req.body);
    if (error) {
      res.status(400).json({ status: "failed", service: "invoice | create", error: error.issues });
      return;
    }

    const response = await createInvoice(data as any);

    if (response === "CLIENT_NOT_FOUND") {
      res.status(404).json({ status: "failed", service: "invoice | create", error: "Client not found" });
      return;
    }

    res.status(201).json({ status: "success", service: "invoice | create", data: response });
  } catch (err) {
    next(err);
  }
};

/*
 * GET /:id
 * Fetch a single invoice by ID
 */
export const getInvoiceController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const invoice = await getInvoiceById(id);

    if (!invoice) {
      res.status(404).json({ status: "failed", service: "invoice | get", error: "Invoice not found" });
      return;
    }

    res.status(200).json({ status: "success", service: "invoice | get", data: invoice });
  } catch (err) {
    next(err);
  }
};

/*
 * GET /client/:clientId
 * List all invoices for a client
 */
export const listInvoicesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const clientId  = req.params.clientId as string;
    const invoiceList = await listInvoicesByClient(clientId);
    res.status(200).json({ status: "success", service: "invoice | list", data: invoiceList });
  } catch (err) {
    next(err);
  }
};

/*
 * PATCH /:id
 * Update an invoice by ID
 */
export const updateInvoiceController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id  = req.params.id as string;
    const { data, error } = UpdateInvoiceSchema.safeParse(req.body);
    if (error) {
      res.status(400).json({ status: "failed", service: "invoice | update", error: error.issues });
      return;
    }

    const updated = await updateInvoiceById(id, data as any);

    if (!updated) {
      res.status(404).json({ status: "failed", service: "invoice | update", error: "Invoice not found" });
      return;
    }

    res.status(200).json({ status: "success", service: "invoice | update", data: updated });
  } catch (err) {
    next(err);
  }
};

/*
 * DELETE /:id
 * Delete an invoice by ID
 */
export const deleteInvoiceController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const deleted = await deleteInvoiceById(id);

    if (!deleted) {
      res.status(404).json({ status: "failed", service: "invoice | delete", error: "Invoice not found" });
      return;
    }

    res.status(200).json({ status: "success", service: "invoice | delete", data: deleted });
  } catch (err) {
    next(err);
  }
};