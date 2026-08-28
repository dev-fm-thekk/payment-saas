import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { createPaymentLinkController } from '../controllers/PaymentLink/payment-link.controller.js';

const router = Router();

/*
 * POST /
 * Payload: companyId (string), provider (string), url (string), expiresAt (string/date)
 * Status Codes: 201 (Created), 400 (Bad Request), 500 (Internal Server Error)
 * Returns: Created payment link on success
 */
router.post('/', authenticate, createPaymentLinkController);

export default router;
