import db from "../../../db";
import { paymentLinks } from "../../../db/schema";

type PaymentLink = {
    id: string,
    companyId: string,
    provider: string,
    url: string,
    status: string,
    createdAt: Date | string,
    expiresAt: Date | string
};

type CreatePaymentLink = Omit<PaymentLink, "id" | "createdAt" | "status">

export const createPaymentLink = async (input: CreatePaymentLink): Promise<Array<any>> => {
    let insertData = {
        ...input,
        status: "active",
        expiresAt: typeof input.expiresAt === "string" ? new Date(input.expiresAt) : input.expiresAt
    }
    const response = await db.insert(paymentLinks).values(insertData).returning()
    if (response.length < 1) throw new Error('DB Error: Unable to create payment link, db insert error');
    return response;
}