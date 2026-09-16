import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import {
  createProvider,
  getProviderById,
  listProvidersByCompany,
  getProviderByCompanyAndType,
  updateProviderById,
  deleteProviderById,
} from "./provider.helper.js";

const ProviderTypeEnum = z.enum(["razorpay", "stripe", "paypal"]);

const CreateProviderSchema = z.object({
  companyId: z.string().uuid(),
  type: ProviderTypeEnum,
  credentials: z.record(z.unknown()),
});

const UpdateProviderSchema = z.object({
  credentials: z.record(z.unknown()).optional(),
});

/*
 * POST /
 * Create a new provider for a company (one per provider type per company)
 */
export const createProviderController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { data, error } = CreateProviderSchema.safeParse(req.body);
    if (error) {
      res.status(400).json({ status: "failed", service: "provider | create", error: error.issues });
      return;
    }

    // Enforce uniqueness at the application level for a friendlier error message
    const existing = await getProviderByCompanyAndType(data.companyId, data.type);
    if (existing) {
      res.status(409).json({
        status: "failed",
        service: "provider | create",
        error: `A ${data.type} provider already exists for this company`,
      });
      return;
    }

    const response = await createProvider(data);
    res.status(201).json({ status: "success", service: "provider | create", data: response });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

/*
 * GET /:id
 * Fetch a single provider by ID
 */
export const getProviderController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const provider = await getProviderById(id);

    if (!provider) {
      res.status(404).json({ status: "failed", service: "provider | get", error: "Provider not found" });
      return;
    }

    res.status(200).json({ status: "success", service: "provider | get", data: provider });
  } catch (err) {
    next(err);
  }
};

/*
 * GET /company/:companyId
 * List all providers for a company
 */
export const listProvidersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const companyId = req.params.companyId as string;
    const data = await listProvidersByCompany(companyId);
    res.status(200).json({ status: "success", service: "provider | list", data });
  } catch (err) {
    next(err);
  }
};

/*
 * PATCH /:id
 * Update provider credentials by ID
 */
export const updateProviderController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { data, error } = UpdateProviderSchema.safeParse(req.body);
    if (error) {
      res.status(400).json({ status: "failed", service: "provider | update", error: error.issues });
      return;
    }

    const updated = await updateProviderById(id, data);
    if (!updated) {
      res.status(404).json({ status: "failed", service: "provider | update", error: "Provider not found" });
      return;
    }

    res.status(200).json({ status: "success", service: "provider | update", data: updated });
  } catch (err) {
    next(err);
  }
};

/*
 * DELETE /:id
 * Delete a provider by ID
 */
export const deleteProviderController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const deleted = await deleteProviderById(id);

    if (!deleted) {
      res.status(404).json({ status: "failed", service: "provider | delete", error: "Provider not found" });
      return;
    }

    res.status(200).json({ status: "success", service: "provider | delete", data: deleted });
  } catch (err) {
    next(err);
  }
};
