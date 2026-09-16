import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@utils/hashing';
import db from '@db';
import { companies } from '@schema';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
    user?: { id: string; role: string };
    /** Populated by authenticate() from the user's owned company, if one exists. */
    companyId?: string;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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

    // Attach companyId so that controllers that require it (payment-link, invoice,
    // webhook management) work with JWT auth without needing a separate API key.
    try {
        const [company] = await db
            .select({ id: companies.id })
            .from(companies)
            .where(eq(companies.userId, payload.id))
            .limit(1);

        if (company) {
            (req as any).companyId = company.id;
        }
    } catch {
        // Non-fatal — some routes don't need companyId (e.g. pure user routes).
        // Controllers that require it will handle the missing value themselves.
    }

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
