import db from "../../../db";
import type { UserType, CreateServiceType } from "../../../utils/schema";
import logger from "../logging/logging.service";
import { users as UserTable } from "../../../db/schema";
import { hashPassword } from "../../../utils/hashing";

type CreateUserInput = Omit<UserType, "id" | "createdAt" | "updatedAt" | "isVerified">;

export async function createUser(user: CreateUserInput): Promise<CreateServiceType> {
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
        let message = `UserError: Unable to create user. Here is the log\n${err}` 
        logger.error(message)
        return {
            service: 'user',
            status: 'failed',
            error: err instanceof Error ? err.message : String(err)
        }
    }
}