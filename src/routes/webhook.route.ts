import { Router } from 'express';
import { createWebhookController, webhookHandler } from '../controllers/Webhook/webhook.controller';

const router = Router();

/*
 * POST /
 * Payload: companyId (string), provider (string)
 * Status Codes: 201 (Created), 400 (Bad Request), 500 (Internal Server Error)
 * Returns: Created webhook endpoint details on success
 */
router.post('/', createWebhookController);

/*
 * POST /:companyId/:provider/:secret
 * Params: companyId (string), provider (string), secret (string)
 * Payload: Webhook event payload
 * Status Codes: 201 (Created), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Acknowledgment of webhook processing
 */
router.post('/:companyId/:provider/:secret', webhookHandler);

export default router;

