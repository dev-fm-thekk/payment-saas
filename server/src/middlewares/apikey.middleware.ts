import type { Request, Response, NextFunction } from 'express';
import db from '../../db';
import { eq } from 'drizzle-orm';
import { apiKeys } from '../../db/schema';
import { hashToken } from '../../utils/hashing';

export interface ApiKeyRequest extends Request {
    companyId?: string;
}

/**
 * Authenticates requests using a raw API key sent in the `x-api-key` header.
 * The key is SHA-256 hashed and compared against stored hashes in the apiKeys table.
 */
export async function authenticateApiKey(
    req: ApiKeyRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    const rawKey = req.headers['x-api-key'];
    if (!rawKey || typeof rawKey !== 'string') {
        res.status(401).json({ status: 'failed', error: 'Missing x-api-key header' });
        return;
    }

    const keyHash = hashToken(rawKey);

    const result = await db
        .select({ companyId: apiKeys.companyId })
        .from(apiKeys)
        .where(eq(apiKeys.keyHash, keyHash))
        .limit(1);

    if (!result[0]) {
        res.status(401).json({ status: 'failed', error: 'Invalid API key' });
        return;
    }

    req.companyId = result[0].companyId;
    next();
}
