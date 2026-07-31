import { eq } from "drizzle-orm"
import db from "../../../db"
import { users, refreshTokens } from "../../../db/schema"
import logger from "../../services/logging/logging.service";
import type { ServiceReturnType, UpdateServiceType } from "../../../utils/schema"
import {
    hashPassword,
    verifyPassword,
    generateAccessToken,
    generateRandomToken,
    hashToken
} from "../../../utils/hashing"

type UserCredential = {
    email: string,
    password: string
}

export async function checkUserExists(mail: string): Promise<boolean> {
    let result = await db.select({ id: users.id }).from(users).where(eq(users.email, mail))
    if (result.length === 0) return false;
    return true;
}

export async function updateCredential(credential: UserCredential, userId: string): Promise<UpdateServiceType> {
    try {
        let passwordHash = await hashPassword(credential.password);
        await db.update(users)
            .set({ email: credential.email, passwordHash: passwordHash })
            .where(eq(users.id, userId))
        return {
            service: 'credential',
            status: 'success',
        }
    } catch(err) {
        let message = `CredentialError: Log\n${err}`
        logger.error(message)
        return {
            service: 'credential',
            status: 'failed',
            error: JSON.stringify(err)
        }
    }
}

export async function login(credential: UserCredential, userAgent?: string, ipAddress?: string): Promise<ServiceReturnType> {
    const { email, password } = credential;
    
    try {
        let emailExists = await checkUserExists(email);
        if (!emailExists) throw new Error("email doesn't exists")
        
        let userResult = await db.select({
            id: users.id,
            email: users.email,
            passwordHash: users.passwordHash,
            name: users.name,
            role: users.role
        }).from(users).where(eq(users.email, email))
        
        const user = userResult[0];
        if (!user) throw new Error("user doesn't exists");

        let checkPwd = await verifyPassword(password, user.passwordHash)
        if (!checkPwd) throw new Error("incorrect password")

        let accessToken = generateAccessToken({ id: user.id, role: user.role });
        let rawRefreshToken = generateRandomToken();
        let tokenHash = hashToken(rawRefreshToken);
        
        // Refresh token expires in 7 days
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        
        await db.insert(refreshTokens).values({
            userId: user.id,
            tokenHash: tokenHash,
            expiresAt: expiresAt,
            revoked: false,
            userAgent: userAgent || null,
            ipAddress: ipAddress || null
        });

        return {
            service: 'auth',
            type: 'login',
            status: 'success',
            payload: {
                accessToken,
                refreshToken: rawRefreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        }
    } catch(err) {
        let message = `[AuthError]: ${err instanceof Error ? err.message : 'login failed'}`;
        logger.error(message)
        return {
            service: 'auth',
            type: 'login',
            status: 'failed',
            error: message
        }
    }
}

export async function logout(refreshTokenVal: string): Promise<ServiceReturnType> {
    try {
        let tokenHash = hashToken(refreshTokenVal);
        
        await db.update(refreshTokens)
            .set({ revoked: true })
            .where(eq(refreshTokens.tokenHash, tokenHash));

        return {
            service: 'auth',
            type: 'logout',
            status: 'success',
            payload: { message: "logged out successfully" }
        }
    } catch(err) {
        let message = `[AuthError]: ${err instanceof Error ? err.message : 'logout failed'}`;
        logger.error(message)
        return {
            service: 'auth',
            type: 'logout',
            status: 'failed',
            error: message
        }
    }
}

export async function refreshToken(refreshTokenVal: string, userAgent?: string, ipAddress?: string): Promise<ServiceReturnType> {
    try {
        let tokenHash = hashToken(refreshTokenVal);
        
        let tokenResult = await db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
        const storedToken = tokenResult[0];
        if (!storedToken) {
            throw new Error("invalid refresh token");
        }
        if (storedToken.revoked) {
            throw new Error("token has been revoked");
        }
        
        if (storedToken.expiresAt < new Date()) {
            throw new Error("token has expired");
        }
        
        let userResult = await db.select({
            id: users.id,
            email: users.email,
            role: users.role,
            name: users.name
        }).from(users).where(eq(users.id, storedToken.userId));
        
        const user = userResult[0];
        if (!user) {
            throw new Error("user not found");
        }
        
        let newAccessToken = generateAccessToken({ id: user.id, role: user.role });
        
        let newRawRefreshToken = generateRandomToken();
        let newHash = hashToken(newRawRefreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        
        await db.update(refreshTokens)
            .set({ revoked: true })
            .where(eq(refreshTokens.id, storedToken.id));
            
        await db.insert(refreshTokens).values({
            userId: user.id,
            tokenHash: newHash,
            expiresAt: expiresAt,
            revoked: false,
            userAgent: userAgent || storedToken.userAgent || null,
            ipAddress: ipAddress || storedToken.ipAddress || null
        });
        
        return {
            service: 'auth',
            type: 'refresh',
            status: 'success',
            payload: {
                accessToken: newAccessToken,
                refreshToken: newRawRefreshToken
            }
        }
    } catch(err) {
        let message = `[AuthError]: ${err instanceof Error ? err.message : 'refresh token failed'}`;
        logger.error(message)
        return {
            service: 'auth',
            type: 'refresh',
            status: 'failed',
            error: message
        }
    }
}
