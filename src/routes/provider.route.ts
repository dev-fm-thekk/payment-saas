import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as Controller from '../controllers/Provider/provider.controller';

const router = Router();

/*
 * POST /
 * Payload: Provider creation data
 * Status Codes: 201 (Created), 400 (Bad Request), 500 (Internal Server Error)
 * Returns: Created provider object on success
 */
router.post('/', authenticate, Controller.addProviderController);

/*
 * GET /service/:serviceId
 * Params: serviceId (string)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: List of providers for the service on success
 */
router.get('/service/:serviceId', authenticate, Controller.getProviderByServiceController);

/*
 * GET /:id
 * Params: id (string)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Provider details on success
 */
router.get('/:id', authenticate, Controller.getProviderByIdController);

/*
 * PATCH /:id
 * Params: id (string)
 * Payload: Provider update data
 * Status Codes: 200 (Success), 400 (Bad Request), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Updated provider object on success
 */
router.patch('/:id', authenticate, Controller.updateProviderController);

/*
 * DELETE /:id
 * Params: id (string)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Success message on success
 */
router.delete('/:id', authenticate, Controller.deleteProviderController);

export default router;
