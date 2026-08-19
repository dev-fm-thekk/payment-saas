import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../../utils/hashing';

export interface AuthRequest extends Request {
    user?: { id: string; role: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ status: 'failed', error: 'Missing or malformed authorization header' });
        return;
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    if (!payload) {
        res.status(401).json({ status: 'failed', error: 'Invalid or expired access token' });
        return;
    }

    req.user = payload;
    next();
}

export function requireRole(...roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ status: 'failed', error: 'Insufficient permissions' });
            return;
        }
        next();
    };
}
