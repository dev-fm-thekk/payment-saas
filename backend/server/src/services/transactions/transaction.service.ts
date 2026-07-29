import db from "../../../db";
import { eq, and } from "drizzle-orm";
import {
  providerConfigs,
  services,
} from "../../../db/schema";
import { ProviderFactory, ProviderName } from "@payment-sdk/core";
import type {
  ListTransactionsRequestType,
} from "../../../utils/schema";
import logger from "../logging/logging.service";
import z from "zod";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolves the active provider config for a given serviceId, validates that the
 * service belongs to the calling company, then decrypts the raw credentials and
 * returns an initialised adapter.
 */
async function resolveAdapter(serviceId: string, companyId: string) {
  // Validate that the service belongs to this company
  try {
    const svc = await db
      .select({ id: services.id, currency: services.currency })
      .from(services)
      .where(and(eq(services.id, serviceId), eq(services.companyId, companyId)))
      .limit(1);

    if (!svc[0]) {
      return {
        error: "Service not found or does not belong to your company",
        data: null,
      };
    }

    // Fetch the first active provider config for this service
    const configs = await db
      .select()
      .from(providerConfigs)
      .where(eq(providerConfigs.serviceId, serviceId))
      .limit(1);

    if (!configs[0]) {
      return { error: "No provider configured for this service", data: null };
    }

    const config = configs[0];

    // credentialsEncrypted stores the raw credentials JSON (apiKey, apiSecret, etc.)

    const typeCredentials = config.credentialsEncrypted as string;
    const credentials = JSON.parse(typeCredentials) 

    let mappedCredentials: any = {};
    if (config.provider === 'stripe') {
        mappedCredentials = {
            apiKey: credentials.secretKey || credentials.apiKey || credentials.STRIPE_SECRET_KEY,
        };
    } else if (config.provider === 'razorpay') {
        mappedCredentials = {
            apiKey: credentials.keyId || credentials.apiKey || credentials.RAZORPAY_KEY_ID,
            apiSecret: credentials.keySecret || credentials.apiSecret || credentials.RAZORPAY_KEY_SECRET,
        };
    }

    const providerName =
      config.provider === "stripe"
        ? ProviderName.STRIPE
        : ProviderName.RAZORPAY;

    const adapter = ProviderFactory.create({
      provider: providerName,
      credentials: mappedCredentials
    });

    return {
      error: null,
      data: { adapter, provider: config.provider, service: svc[0] },
    };
  } catch (err: any) {
    console.error(err);
    return { error: err.message || String(err), data: null };
  }
}

// ─── List Transactions ───────────────────────────────────────────────────────

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
})

type fetchTransactionType = z.infer<typeof fetchTransactionSchema>

export async function fetchTransaction(input: fetchTransactionType) {
  try {
    const { serviceId, companyId } = input;
    const resolved = await resolveAdapter(serviceId, companyId);

    if (resolved!.error || !resolved!.data) {
      return { status: "failed" as const, error: resolved!.error };
    }
    const { adapter } = resolved!.data;

    let response = await adapter.getTransaction(input.transactionId)
    return { status: 'success' as  const, data: response}
  } catch(err) {
    logger.error(err);
    return {
      status: "failed" as const,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}