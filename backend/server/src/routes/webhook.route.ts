import { Router } from 'express';
import * as Controller from '../controllers/Webhook/webhook.controller';
import express from 'express';
import { authenticateApiKey } from '../middlewares/apikey.middleware';
const router = Router();

/*
 * POST /
 * Payload: Webhook creation data
 * Status Codes: 201 (Created), 400 (Bad Request), 500 (Internal Server Error)
 * Returns: Created webhook object on success
 */
router.post('/', authenticateApiKey, Controller.createWebHookController);

/*
 * GET /:webhookId
 * Params: webhookId (string)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Webhook details on success
 */
router.get('/:webhookId', authenticateApiKey, Controller.getWebHookController);

/*
 * PATCH /:webhookId
 * Params: webhookId (string)
 * Payload: Webhook update data
 * Status Codes: 200 (Success), 400 (Bad Request), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Updated webhook object on success
 */
router.patch('/:webhookId', authenticateApiKey, Controller.updateWebHookController);

/*
 * DELETE /:webhookId
 * Params: webhookId (string)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Success message on success
 */
router.delete('/:webhookId', authenticateApiKey, Controller.deleteWebhookController);

export default router;
