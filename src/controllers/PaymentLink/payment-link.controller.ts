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

const CreatePaymentLinkSchema = z.object({
  provider: z.string().optional(),
  providerId: z.string().optional(),
  company: z.string().optional(),
  companyId: z.string().optional(),
  amount: z.number().int().positive(),
  currency: z.string(),
  upi_link: z.boolean().optional(),
  description: z.string().optional(),
});

const UpdatePaymentLinkSchema = z.object({
  url: z.string().url().optional(),
  status: z.enum(["active", "expired", "consumed"]).optional(),
  expiresAt: z.string().or(z.date()).optional(),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

/*
 * POST /payment-link
 * Essential fields: provider, company (or companyId), currency, amount, upi_link, description.
 * callback_url, callback_method, and metadata are internalized.
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

    const companyId = data.companyId || data.company;
    const providerId = data.providerId || data.provider;

    if (!companyId || !providerId) {
      res.status(400).json({
        status: "failed",
        service: "payment-link | create",
        error: "Both provider (or providerId) and company (or companyId) are required.",
      });
      return;
    }

    const host = req.get("host") || "localhost";
    const protocol = req.protocol || "http";
    const defaultCallbackUrl = `${protocol}://${host}/api/v1/payment-link/callback`;

    // Internalized callback and metadata
    const linkRequest: any = {
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      upi_link: data.upi_link ?? false,
      callback_url: defaultCallbackUrl,
      callback_method: "get",
      metadata: {
        companyId,
        provider: providerId,
        created_at: new Date().toISOString(),
      },
    };

    const response = await createPaymentLink({
      providerId,
      companyId,
      linkRequest,
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