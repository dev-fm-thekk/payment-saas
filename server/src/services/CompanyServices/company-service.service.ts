import db from "../../../db";
import type { CompanyServiceType, CreateServiceType } from "../../../utils/schema";
import logger from "../logging/logging.service";
import { services as ServicesTable } from "../../../db/schema";

export async function createService(service: CompanyServiceType): Promise<CreateServiceType> {
    try {
        await db.insert(ServicesTable).values(service)
        return {
            service: 'company-services',
            status: 'success'
        }
    } catch(err) {
        let message = `ServiceError: Unable to create user. Here is the log\n${err}` 
        logger.error(message)
        return {
            service: 'company-services',
            status: 'failed',
            error: JSON.stringify(err)
        }
    }
}