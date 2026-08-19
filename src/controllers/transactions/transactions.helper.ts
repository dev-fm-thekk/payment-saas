import type {
  ListTransactionsRequestType,
} from "../../../utils/schema";
import logger from "../../services/logging/logging.service";
import z from "zod"
import { resolveAdapter } from "../../../utils/sdk.utils";

export async function listTransactions(
  input: ListTransactionsRequestType,
  companyId: string,
) {
  try {
    const resolved = await resolveAdapter(input.serviceId!, companyId);
    if (resolved!.error || !resolved!.data) {
      return { status: "failed" as const, error: resolved!.error };
    }
    const { adapter } = resolved!.data;

    const { transactions: transactionsTable } = await import("../../../db/schema");
    const { eq } = await import("drizzle-orm");
    const db = (await import("../../../db")).default;
    const transactions = await db.select().from(transactionsTable).where(eq(transactionsTable.companyId, companyId)).limit(input.limit || 50);

    return { status: "success" as const, data: transactions };
  } catch (err) {
    logger.error(err);
    return {
      status: "failed" as const,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

const fetchTransactionSchema = z.object({
  serviceId: z.string(),
  companyId: z.string(),
  transactionId: z.string(),
  fields: z.any()
})

type fetchTransactionType = z.infer<typeof fetchTransactionSchema>

export async function fetchTransaction(input: fetchTransactionType) {
  try {
    const { serviceId, companyId, fields } = input;
    const resolved = await resolveAdapter(serviceId, companyId);
    
    if (resolved!.error || !resolved!.data) {
      return { status: "failed" as const, error: resolved!.error };
    }
    const { adapter } = resolved!.data;

    const { transactions: transactionsTable } = await import("../../../db/schema");
    const { eq } = await import("drizzle-orm");
    const db = (await import("../../../db")).default;
    const [response] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, input.transactionId));
    if (!response) throw new Error("Transaction not found");

    if (!fields) return { status: 'success', data: response };
    const filtered = Object.fromEntries(
      Object.entries(response).filter(([key]) => fields.includes(key))
    );

    return { status: 'success' as  const, data: filtered}
  } catch(err) {
    logger.error(err);
    return {
      status: "failed" as const,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}