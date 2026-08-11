import { Router } from 'express';
import * as Controller from '../controllers/CompanyService/company-service.controller';
import { authenticate } from '../middlewares/auth.middleware';
const router = Router();

/*
 * POST /
 * Payload: Company service creation data
 * Status Codes: 201 (Created), 400 (Bad Request), 500 (Internal Server Error)
 * Returns: Created company service object on success
 */
router.post('/', authenticate, Controller.createServiceController);

/*
 * GET /company/:companyId
 * Params: companyId (string)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: List of services for the company on success
 */
router.get('/company/:companyId', authenticate, Controller.getServicesByCompanyController);

/*
 * GET /:id
 * Params: id (string)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Service details on success
 */
router.get('/:id', authenticate, Controller.getServiceByIdController);

/*
 * PATCH /:id
 * Params: id (string)
 * Payload: Service update data
 * Status Codes: 200 (Success), 400 (Bad Request), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Updated service object on success
 */
router.patch('/:id', authenticate, Controller.updateServiceController);

/*
 * DELETE /:id
 * Params: id (string)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Success message on success
 */
router.delete('/:id', authenticate, Controller.deleteServiceController);

export default router;
