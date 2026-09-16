import { Router } from "express";
import { authenticate } from "@middlewares/auth.middleware";
import {
  createProviderController,
  getProviderController,
  listProvidersController,
  updateProviderController,
  deleteProviderController,
} from "@controllers/Provider/provider.controller";

const router = Router();

/*
 * POST /
 * Payload: companyId (uuid), type (razorpay | stripe | paypal), credentials (object)
 * Status Codes: 201 (Created), 400 (Bad Request), 409 (Conflict – provider already exists), 500 (Internal Server Error)
 * Returns: Created provider on success
 */
router.post("/", authenticate, createProviderController);

/*
 * GET /company/:companyId
 * Params: companyId (uuid)
 * Status Codes: 200 (Success), 500 (Internal Server Error)
 * Returns: List of all providers for the given company
 */
router.get("/company/:companyId", authenticate, listProvidersController);

/*
 * GET /:id
 * Params: id (uuid)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Provider details on success
 */
router.get("/:id", authenticate, getProviderController);

/*
 * PATCH /:id
 * Params: id (uuid)
 * Payload: credentials (object)
 * Status Codes: 200 (Success), 400 (Bad Request), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Updated provider on success
 */
router.patch("/:id", authenticate, updateProviderController);

/*
 * DELETE /:id
 * Params: id (uuid)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Deleted provider record on success
 */
router.delete("/:id", authenticate, deleteProviderController);

export default router;
