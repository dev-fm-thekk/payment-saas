import { Router } from 'express';
import { authenticateApiKey } from '../middlewares/apikey.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { createClient, getClient, listClients, updateClient, deleteClient } from '../controllers/Client/client.controller';

const router = Router();
router.use(authenticateApiKey);

router.post('/', authenticate, createClient);
router.get('/:serviceId', authenticate, listClients);
router.get('/details/:id', authenticate, getClient);
router.patch('/:id', authenticate, updateClient);
router.delete('/:id', authenticate, deleteClient);

export default router;
