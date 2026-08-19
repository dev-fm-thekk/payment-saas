import type { Request, Response, NextFunction } from 'express';
import logger from '../../services/logging/logging.service';
import { type AuthRequest } from '../../middlewares/auth.middleware';
import db from '../../../db';
import { apiKeys, companies } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { CreateAPIKeySchema, validateSchema } from '../../../utils/schema';
import { generateRandomToken, hashToken } from '../../../utils/hashing';
import { login, logout, refreshToken } from './auth.helper';


const cookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const loginController = async (req: Request,  res: Response,  next: NextFunction) => {
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
        console.log(err);
        next(err);
    }
};

export const logoutController = async (req: any,  res: any,  next: any) => {
    try {
        const token = req.cookies.refreshToken;
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
};

export const refreshTokenController = async (req: any,  res: any,  next: any) => {
    try {
        const token = req.cookies.refreshToken;
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
};

export const apiKeyController = async (req:AuthRequest,  res: any) => {
    try {
        const { id, role } = req!.user!;

        console.log(req.user);
        const {data, error} = validateSchema(CreateAPIKeySchema, req.body);
        
        if (error) return res.status(400).send('companyId not found');
        const token = generateRandomToken();
        data.keyHash = hashToken(token);

        if (error) return res.status(400).send({ error: error })
        const company = await db.select().from(companies).where(eq(companies.userId, id))
        if (company.length === 0) return res.status(400).send({ error: "company doesn't exists "});
        
        console.log(data);
        await db.insert(apiKeys).values(data)
        return res.status(201).send({
            service: 'api-key-service',
            operation: 'create',
            payload: {
                api_key: token
            }
        })
    } catch(err) {
        logger.error(err);
        console.log(err);
        return res.status(500).send("internal server error")
    }
};
