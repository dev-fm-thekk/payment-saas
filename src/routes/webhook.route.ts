import { Router } from 'express';
import * as Controller from '../controllers/Webhook/webhook.controller';
import fs from 'fs/promises';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
/*
 * POST /
 * Payload: Webhook creation data
 * Status Codes: 201 (Created), 400 (Bad Request), 500 (Internal Server Error)
 * Returns: Created webhook object on success
 */
router.post('/', authenticate, Controller.createWebHookController);

/*
 * GET /:webhookId
 * Params: webhookId (string)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Webhook details on success
 */
router.get('/:webhookId', authenticate, Controller.getWebHookController);

/*
 * PATCH /:webhookId
 * Params: webhookId (string)
 * Payload: Webhook update data
 * Status Codes: 200 (Success), 400 (Bad Request), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Updated webhook object on success
 */
router.patch('/:webhookId', authenticate, Controller.updateWebHookController);

/*
 * DELETE /:webhookId
 * Params: webhookId (string)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Success message on success
 */
router.delete('/:webhookId', authenticate, Controller.deleteWebhookController);


router.post('/test', async (req, res) => {
    const response = JSON.stringify(req.body, null, 4);
    console.log(response);
    await fs.writeFile('/temp/logs.json', response);
})

export default router;
