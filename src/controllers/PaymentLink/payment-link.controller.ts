import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import {
  createPaymentLink,
  getPaymentLinkById,
  listPaymentLinksByCompany,
  updatePaymentLinkById,
  deletePaymentLinkById,
} from "./payment-link.helper.js";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CustomerSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  contact: z.string(),
});

const CreatePaymentLinkSchema = z.object({
  /** ID of the row in the providers table */
  providerId: z.string().uuid("providerId must be a valid UUID"),
  companyId: z.string().uuid("companyId must be a valid UUID"),
  /** Fields forwarded directly to the adapter */
  amount: z.number().int().positive(),
  currency: z.string(),
  description: z.string().optional(),
  callback_url: z.string().url(),
  callback_method: z.string().optional(),
  upi_link: z.boolean().optional(),
  metadata: z.record(z.string()).optional(),
  customer: CustomerSchema.optional(),
  expiresAt: z.string().or(z.date()).optional(),
});

const UpdatePaymentLinkSchema = z.object({
  url: z.string().url().optional(),
  status: z.enum(["active", "expired", "consumed"]).optional(),
  expiresAt: z.string().or(z.date()).optional(),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

/*
 * POST /payment-link
 * Calls the resolved provider adapter to create a real payment link, then
 * saves the resulting URL in the payment_links table.
 */
export const createPaymentLinkController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { data, error } = CreatePaymentLinkSchema.safeParse(req.body);
    if (error) {
      res.status(400).json({ status: "failed", service: "payment-link | create", error: error.issues });
      return;
    }

    const { providerId, companyId, expiresAt, ...linkRequest } = data;

    const response = await createPaymentLink({
      providerId,
      companyId,
      linkRequest,
      expiresAt,
    });

    res.status(201).json({ status: "success", service: "payment-link | create", data: response });
  } catch (err: any) {
    if (err?.statusCode) {
      res.status(err.statusCode).json({ status: "failed", service: "payment-link | create", error: err.message });
      return;
    }
    next(err);
  }
};

/*
 * GET /payment-link/:id
 * Fetch a single payment link record by ID.
 */
export const getPaymentLinkController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const link = await getPaymentLinkById(id);

    if (!link) {
      res.status(404).json({ status: "failed", service: "payment-link | get", error: "Payment link not found" });
      return;
    }

    res.status(200).json({ status: "success", service: "payment-link | get", data: link });
  } catch (err) {
    next(err);
  }
};

/*
 * GET /payment-link/company/:companyId
 * List all payment links for a company.
 */
export const listPaymentLinksController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const companyId = req.params.companyId as string;
    const links = await listPaymentLinksByCompany(companyId);
    res.status(200).json({ status: "success", service: "payment-link | list", data: links });
  } catch (err) {
    next(err);
  }
};

/*
 * PATCH /payment-link/:id
 * Update local metadata (url, status, expiresAt) for a payment link.
 */
export const updatePaymentLinkController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { data, error } = UpdatePaymentLinkSchema.safeParse(req.body);
    if (error) {
      res.status(400).json({ status: "failed", service: "payment-link | update", error: error.issues });
      return;
    }

    const updated = await updatePaymentLinkById(id, data);

    if (!updated) {
      res.status(404).json({ status: "failed", service: "payment-link | update", error: "Payment link not found" });
      return;
    }

    res.status(200).json({ status: "success", service: "payment-link | update", data: updated });
  } catch (err) {
    next(err);
  }
};

/*
 * DELETE /payment-link/:id
 * Delete a payment link record (local DB only).
 */
export const deletePaymentLinkController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const deleted = await deletePaymentLinkById(id);

    if (!deleted) {
      res.status(404).json({ status: "failed", service: "payment-link | delete", error: "Payment link not found" });
      return;
    }

    res.status(200).json({ status: "success", service: "payment-link | delete", data: deleted });
  } catch (err) {
    next(err);
  }
};