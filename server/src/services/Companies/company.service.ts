import db from "../../../db";
import type { CompanyType, CreateServiceType } from "../../../utils/schema";
import logger from "../logging/logging.service";
import { companies as CompanyTable } from "../../../db/schema";

export async function createCompany(company: CompanyType): Promise<CreateServiceType> {
    try {
        await db.insert(CompanyTable).values(company)
        return {
            service: 'company',
            status: 'failed'
        }
    } catch(err) {
        let message = `CompanyError: Unable to create user. Here is the log\n${err}` 
        logger.error(message)
        return {
            service: 'company',
            status: 'failed',
            error: JSON.stringify(err)
        }
    }
}