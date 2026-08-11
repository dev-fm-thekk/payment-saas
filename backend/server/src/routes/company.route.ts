import { Router } from 'express';
import * as Controller from '../controllers/Company/company.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/*
 * POST /
 * Payload: Company creation data
 * Status Codes: 201 (Created), 400 (Bad Request), 500 (Internal Server Error)
 * Returns: Created company object on success
 */
router.post('/',authenticate, Controller.createCompanyController);

/*
 * GET /
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Company details for the authenticated user on success
 */
router.get('/', authenticate, Controller.getCompanyByUserController);

/*
 * GET /:id
 * Params: id (string)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Company details on success
 */
router.get('/:id', authenticate, Controller.getCompanyByIdController);

/*
 * PATCH /:id
 * Params: id (string)
 * Payload: Company update data
 * Status Codes: 200 (Success), 400 (Bad Request), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Updated company object on success
 */
router.patch('/:id', authenticate, Controller.updateCompanyController);

/*
 * DELETE /:id
 * Params: id (string)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Success message on success
 */
router.delete('/:id', authenticate, Controller.deleteCompanyController);

export default router;
