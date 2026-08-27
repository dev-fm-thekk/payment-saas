import { Router } from 'express';
import { createWebhookController, webhookHandler } from '../controllers/Webhook/webhook.controller';

const router = Router();

router.post('/', createWebhookController);
router.post('/:companyId/:provider/:secret', webhookHandler);

export default router;

