import { Router } from 'express';
import { loginController, logoutController, refreshTokenController, apiKeyController } from '../controllers/Auth/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/*
 * POST /login
 * Payload: email (string), password (string)
 * Status Codes: 200 (Success), 400 (Bad Request), 401 (Unauthorized)
 * Returns: { status, accessToken, refreshToken, user } on success, { status, error } on failure
 */
router.post('/login', loginController);

/*
 * POST /logout
 * Cookies: refreshToken
 * Status Codes: 200 (Success), 400 (Bad Request)
 * Returns: { status, message } on success, { status, error } on failure
 */
router.post('/logout', logoutController);

/*
 * POST /refresh
 * Cookies: refreshToken
 * Status Codes: 200 (Success), 400 (Bad Request), 401 (Unauthorized)
 * Returns: { status, accessToken, refreshToken } on success, { status, error } on failure
 */
router.post('/refresh', refreshTokenController);

/*
 * POST /api-key
 * Header: Authorization (Bearer token)
 * Status Codes: 201 (Created), 400 (Bad Request), 500 (Internal Server Error)
 * Returns: { service, operation, payload: { api_key } } on success, error message on failure
 */
router.post('/api-key', authenticate, apiKeyController);

export default router;
