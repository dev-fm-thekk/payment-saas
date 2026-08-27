import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { createPaymentLinkController } from '../controllers/PaymentLink/payment-link.controller.js';

const router = Router();

/**
 * @route POST /
 * @desc Creates a new payment link using the configured provider
 * @access API Key
 */
router.post('/', authenticate, createPaymentLinkController);

export default router;
