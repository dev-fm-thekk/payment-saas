import { Router } from 'express';
import { authenticateApiKey } from '../middlewares/apikey.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { createInvoiceController, getInvoice, listInvoices, updateInvoice, deleteInvoice } from '../controllers/Invoice/invoice.controller';

const router = Router();
router.use(authenticateApiKey);

/*
 * POST /
 * Payload: Invoice creation data
 * Status Codes: 201 (Created), 400 (Bad Request), 500 (Internal Server Error)
 * Returns: Created invoice object on success
 */
router.post('/', authenticate, createInvoiceController);

/*
 * GET /:companyId/:serviceId/
 * Params: companyId (string), serviceId (string)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: List of invoices for the company and service on success
 */
router.get('/:companyId/:serviceId/', authenticate, listInvoices);

/*
 * GET /:id
 * Params: id (string)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Invoice details on success
 */
router.get('/:id', authenticate, getInvoice);

/*
 * PATCH /:id
 * Params: id (string)
 * Payload: Invoice update data
 * Status Codes: 200 (Success), 400 (Bad Request), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Updated invoice object on success
 */
router.patch('/:id', authenticate, updateInvoice);

/*
 * DELETE /:id
 * Params: id (string)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Success message on success
 */
router.delete('/:id', authenticate, deleteInvoice);

export default router;