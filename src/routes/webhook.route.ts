import { Router } from 'express';
import { createWebhookController, webhookHandler, getWebhookEndpoints, getWebhookEventLogs } from '../controllers/Webhook/webhook.controller';
import { authenticate } from '../middlewares/auth.middleware';

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

/*
 * POST /:companyId/:provider/
 * Params: companyId (string), provider (string)
 * Status Codes: 200 (selected), 404 (Not Found), 500 (Internal Server Error), 400 bad request
 * Returns: list of webhook endpoints
 */

router.get('/:companyId/:provider/', authenticate, getWebhookEndpoints);

/*
 * POST /event/logs/:webhookId
 * Params: webhookId(string)
 * Status Codes: 200 (selected), 404 (Not Found), 500 (Internal Server Error), 400 bad request
 * Returns: webhook event logs
 */

router.get('/event/logs/:webhookEndpointId', authenticate, getWebhookEventLogs);

export default router;

