import bcrypt from 'bcrypt';
import type { AccessPayloadType } from './schema';
import jwt from 'jsonwebtoken';
import vars from '../configs/config';
import crypto from 'crypto';

export const hashPassword = async (password: string) => {
    let hash = await bcrypt.hash(password, 12)
    return hash;
}

export const verifyPassword = async (primary: string, secondary: string) => {
    let result = await bcrypt.compare(primary, secondary)
    return result;
}

export const generateAccessToken = (payload: AccessPayloadType): string => {
    const accessToken = jwt.sign(payload, vars.ACCESS_TOKEN_SECRET!, {
        expiresIn: "15min"
    })
    return accessToken;
}

export const hashToken = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex');
}

export const generateRandomToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
}

export const verifyAccessToken = (token: string): AccessPayloadType | null => {
    try {
        const decoded = jwt.verify(token, vars.ACCESS_TOKEN_SECRET!) as AccessPayloadType;
        return decoded;
    } catch (err) {
        return null;
    }
}