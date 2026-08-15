import { Router } from 'express';
import { authenticateApiKey } from '../middlewares/apikey.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { createClient, getClient, listClients, updateClient, deleteClient } from '../controllers/Client/client.controller';

const router = Router();

/*
 * POST /
 * Payload: Client creation data
 * Status Codes: 201 (Created), 400 (Bad Request), 500 (Internal Server Error)
 * Returns: Created client object on success
 */
router.post('/', authenticate, createClient);

/*
 * GET /:serviceId
 * Params: serviceId (string)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: List of clients for the service on success
 */
router.get('/:serviceId', authenticate, listClients);

/*
 * GET /details/:id
 * Params: id (string)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Client details on success
 */
router.get('/details/:id', authenticate, getClient);

/*
 * PATCH /:id
 * Params: id (string)
 * Payload: Client update data
 * Status Codes: 200 (Success), 400 (Bad Request), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Updated client object on success
 */
router.patch('/:id', authenticate, updateClient);

/*
 * DELETE /:id
 * Params: id (string)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Success message on success
 */
router.delete('/:id', authenticate, deleteClient);

export default router;
