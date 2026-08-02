import { Router } from 'express';
import * as Controller from '../controllers/Webhook/webhook.controller';
import express from 'express';
import { authenticateApiKey } from '../middlewares/apikey.middleware';
const router = Router();

router.post('/', authenticateApiKey, Controller.createWebHookController);
router.get('/:webhookId', authenticateApiKey, Controller.getWebHookController);
router.patch('/:webhookId', authenticateApiKey, Controller.updateWebHookController);
router.delete('/:webhookId', authenticateApiKey, Controller.deleteWebhookController);

export default router;
