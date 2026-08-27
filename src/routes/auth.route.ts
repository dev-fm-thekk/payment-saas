import { Router } from 'express';
import { loginController, logoutController, refreshTokenController } from '../controllers/Auth/auth.controller';
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

export default router;
