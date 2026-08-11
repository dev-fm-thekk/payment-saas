import { Router } from 'express';
import * as Controller from '../controllers/User/user.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/*
 * POST /register
 * Payload: User registration data (CreateUserInputSchema)
 * Status Codes: 201 (Created), 400 (Bad Request), 409 (Conflict)
 * Returns: Created user object on success, error message on failure
 */
router.post('/register', Controller.createUserController);

/*
 * GET /:id
 * Params: id (string)
 * Status Codes: 200 (Success), 401 (Unauthorized), 404 (Not Found)
 * Returns: { status, data: user } on success, error object on failure
 */
router.get('/:id', authenticate, Controller.getUserByIdController);

/*
 * PATCH /:id
 * Params: id (string)
 * Payload: Update user data (UpdateUserInputSchema)
 * Status Codes: 200 (Success), 400 (Bad Request), 403 (Forbidden), 404 (Not Found)
 * Returns: Updated user object on success, error message on failure
 */
router.patch('/:id', authenticate, Controller.updateUserController);

/*
 * DELETE /:id
 * Params: id (string)
 * Status Codes: 200 (Success), 400 (Bad Request), 403 (Forbidden), 404 (Not Found)
 * Returns: Success message on success, error message on failure
 */
router.delete('/:id', authenticate, Controller.deleteUserController);

export default router;
 