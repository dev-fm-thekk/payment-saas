import { Router } from 'express';
import { login, logout, refreshToken } from '../../services/Auth/auth.service';

const router = Router();

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

function getRefreshToken(req: any): string | undefined {
    // Extract from body, custom header, or manual cookie parse
    if (req.body?.refreshToken) {
        return req.body.refreshToken;
    }
    const authHeader = req.headers['x-refresh-token'];
    if (typeof authHeader === 'string') {
        return authHeader;
    }
    const rawCookie = req.headers.cookie;
    if (rawCookie) {
        const match = rawCookie.match(/(?:^|; )refreshToken=([^;]*)/);
        if (match) {
            return decodeURIComponent(match[1]);
        }
    }
    return undefined;
}

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ status: 'failed', error: 'Email and password are required' });
            return;
        }

        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip || req.socket?.remoteAddress;

        const result = await login({ email, password }, userAgent, ipAddress);

        if (result.status === 'success') {
            const { accessToken, refreshToken: rawRefreshToken, user } = result.payload;
            res.cookie('refreshToken', rawRefreshToken, cookieOptions);
            res.status(200).json({
                status: 'success',
                accessToken,
                refreshToken: rawRefreshToken,
                user
            });
        } else {
            res.status(401).json({ status: 'failed', error: result.error });
        }
    } catch (err) {
        next(err);
    }
});

router.post('/logout', async (req, res, next) => {
    try {
        const token = getRefreshToken(req);
        if (!token) {
            res.status(400).json({ status: 'failed', error: 'Refresh token is required' });
            return;
        }

        const result = await logout(token);

        if (result.status === 'success') {
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
            res.status(200).json({ status: 'success', message: 'Logged out successfully' });
        } else {
            res.status(400).json({ status: 'failed', error: result.error });
        }
    } catch (err) {
        next(err);
    }
});

router.post('/refresh', async (req, res, next) => {
    try {
        const token = getRefreshToken(req);
        if (!token) {
            res.status(400).json({ status: 'failed', error: 'Refresh token is required' });
            return;
        }

        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip || req.socket?.remoteAddress;

        const result = await refreshToken(token, userAgent, ipAddress);

        if (result.status === 'success') {
            const { accessToken, refreshToken: newRefreshToken } = result.payload;
            res.cookie('refreshToken', newRefreshToken, cookieOptions);
            res.status(200).json({
                status: 'success',
                accessToken,
                refreshToken: newRefreshToken
            });
        } else {
            res.status(401).json({ status: 'failed', error: result.error });
        }
    } catch (err) {
        next(err);
    }
});

export default router;
