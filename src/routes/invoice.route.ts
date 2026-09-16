import { Router } from "express";
import { authenticate } from "@middlewares/auth.middleware";
import {
  createInvoiceController,
  getInvoiceController,
  listInvoicesController,
  updateInvoiceController,
  deleteInvoiceController,
  notifyInvoiceController,
} from "@controllers/Invoice/invoice.controller";

const router = Router();

/*
 * POST /
 * Payload: title, description, clientId, amount, currency, status, paymentLinkId, dueDate
 * Status Codes: 201 (Created), 400 (Bad Request), 404 (Client Not Found), 500 (Internal Server Error)
 * Returns: Created invoice on success
 */
router.post("/", authenticate, createInvoiceController);

/*
 * GET /client/:clientId
 * Params: clientId (uuid)
 * Status Codes: 200 (Success), 500 (Internal Server Error)
 * Returns: List of invoices for the given client
 */
router.get("/client/:clientId", authenticate, listInvoicesController);

/*
 * GET /:id
 * Params: id (uuid)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Invoice details on success
 */
router.get("/:id", authenticate, getInvoiceController);

/*
 * PATCH /:id
 * Params: id (uuid)
 * Payload: Partial invoice fields (title, description, amount, currency, status, paymentLinkId, dueDate)
 * Status Codes: 200 (Success), 400 (Bad Request), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Updated invoice on success
 */
router.patch("/:id", authenticate, updateInvoiceController);

/*
 * DELETE /:id
 * Params: id (uuid)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Deleted invoice record on success
 */
router.delete("/:id", authenticate, deleteInvoiceController);

/*
 * POST /notify/:id
 * Params: id (uuid)
 * Status Codes: 200 (Success), 400 (Bad Request), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Updated invoice record on success
 */
router.post("/notify/:id", authenticate, notifyInvoiceController);

export default router;
