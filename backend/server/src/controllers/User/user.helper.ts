import db from "../../../db";
import { eq } from "drizzle-orm";
import type { CreateServiceType, UpdateServiceType, CreateUserInputType, UpdateUserInputType } from "../../../utils/schema";
import logger from "../../services/logging/logging.service";
import { users as UserTable } from "../../../db/schema";
import { hashPassword } from "../../../utils/hashing";

export async function createUser(user: CreateUserInputType): Promise<CreateServiceType> {
    try {
        const hashedPassword = await hashPassword(user.passwordHash);
        await db.insert(UserTable).values({
            ...user,
            passwordHash: hashedPassword
        });
        return {
            service: 'user',
            status: 'success',
        }
    } catch(err) {
        let message = `UserError: Unable to create user.\n${err}`
        logger.error(message)
        return {
            service: 'user',
            status: 'failed',
            error: err instanceof Error ? err.message : String(err)
        }
    }
}

export async function getUserById(userId: string): Promise<CreateServiceType & { payload?: any }> {
    try {
        const result = await db.select({
            id: UserTable.id,
            email: UserTable.email,
            name: UserTable.name,
            role: UserTable.role,
            isVerified: UserTable.isVerified,
            createdAt: UserTable.createdAt,
            updatedAt: UserTable.updatedAt,
        }).from(UserTable).where(eq(UserTable.id, userId));

        const user = result[0];
        if (!user) {
            return { service: 'user', status: 'failed', error: 'User not found' };
        }

        return { service: 'user', status: 'success', payload: user };
    } catch(err) {
        logger.error(err);
        return { service: 'user', status: 'failed', error: err instanceof Error ? err.message : String(err) };
    }
}

export async function updateUser(userId: string, data: UpdateUserInputType): Promise<UpdateServiceType> {
    try {
        const existing = await db.select({ id: UserTable.id }).from(UserTable).where(eq(UserTable.id, userId));
        if (!existing[0]) return { service: 'user', status: 'failed', error: 'User not found' };

        await db.update(UserTable)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(UserTable.id, userId));

        return { service: 'user', status: 'success' };
    } catch(err) {
        logger.error(err);
        return { service: 'user', status: 'failed', error: err instanceof Error ? err.message : String(err) };
    }
}

export async function deleteUser(userId: string): Promise<CreateServiceType> {
    try {
        const existing = await db.select({ id: UserTable.id }).from(UserTable).where(eq(UserTable.id, userId));
        if (!existing[0]) return { service: 'user', status: 'failed', error: 'User not found' };

        await db.delete(UserTable).where(eq(UserTable.id, userId));
        return { service: 'user', status: 'success' };
    } catch(err) {
        logger.error(err);
        return { service: 'user', status: 'failed', error: err instanceof Error ? err.message : String(err) };
    }
}