import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import {
  createPaymentLink,
  getPaymentLinkById,
  listPaymentLinksByCompany,
  updatePaymentLinkById,
  deletePaymentLinkById,
} from "./payment-link.helper";

const CreatePaymentLinkSchema = z.object({
  companyId: z.string().uuid(),
  provider: z.string(),
  url: z.string().url(),
  expiresAt: z.string().or(z.date()),
});

const UpdatePaymentLinkSchema = z.object({
  url: z.string().url().optional(),
  status: z.enum(["active", "expired", "consumed"]).optional(),
  expiresAt: z.string().or(z.date()).optional(),
});

/*
 * POST /
 * Create a new payment link
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

    const response = await createPaymentLink(data);
    res.status(201).json({ status: "success", service: "payment-link | create", data: response });
  } catch (err) {
    next(err);
  }
};

/*
 * GET /:id
 * Fetch a single payment link by ID
 */
export const getPaymentLinkController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id  = req.params.id as string;
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
 * GET /company/:companyId
 * List all payment links for a company
 */
export const listPaymentLinksController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const companyId  = req.params.companyId as string;
    const links = await listPaymentLinksByCompany(companyId);
    res.status(200).json({ status: "success", service: "payment-link | list", data: links });
  } catch (err) {
    next(err);
  }
};

/*
 * PATCH /:id
 * Update a payment link by ID
 */
export const updatePaymentLinkController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id  = req.params.id as string;
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
 * DELETE /:id
 * Delete a payment link by ID
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