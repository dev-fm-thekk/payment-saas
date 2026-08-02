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
    const resolved = await resolveAdapter(input.serviceId, companyId);
    if (resolved!.error || !resolved!.data) {
      return { status: "failed" as const, error: resolved!.error };
    }
    const { adapter } = resolved!.data;

    const transactions = await adapter.listTransactions({
      from: input.from,
      to: input.to,
      status: input.status,
      limit: input.limit,
      cursor: input.cursor,
    });

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

    console.log(fields);
    if (resolved!.error || !resolved!.data) {
      return { status: "failed" as const, error: resolved!.error };
    }
    const { adapter } = resolved!.data;

    let response = await adapter.getTransaction(input.transactionId)

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