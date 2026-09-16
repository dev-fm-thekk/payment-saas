import { Router } from "express";
import { authenticate } from "@middlewares/auth.middleware";
import {
  createPaymentLinkController,
  getPaymentLinkController,
  listPaymentLinksController,
  updatePaymentLinkController,
  deletePaymentLinkController,
} from "@controllers/PaymentLink/payment-link.controller";

const router = Router();

/*
 * POST /
 * Payload: companyId (uuid), provider (string), url (string), expiresAt (string/date)
 * Status Codes: 201 (Created), 400 (Bad Request), 500 (Internal Server Error)
 * Returns: Created payment link on success
 */
router.post("/", authenticate, createPaymentLinkController);

/*
 * GET /company/:companyId
 * Params: companyId (uuid)
 * Status Codes: 200 (Success), 500 (Internal Server Error)
 * Returns: List of payment links for the given company
 */
router.get("/company/:companyId", authenticate, listPaymentLinksController);

/*
 * GET /:id
 * Params: id (uuid)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Payment link details on success
 */
router.get("/:id", authenticate, getPaymentLinkController);

/*
 * PATCH /:id
 * Params: id (uuid)
 * Payload: Partial fields (url, status, expiresAt)
 * Status Codes: 200 (Success), 400 (Bad Request), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Updated payment link on success
 */
router.patch("/:id", authenticate, updatePaymentLinkController);

/*
 * DELETE /:id
 * Params: id (uuid)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Deleted payment link record on success
 */
router.delete("/:id", authenticate, deletePaymentLinkController);

export default router;
