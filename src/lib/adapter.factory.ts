import db from "@db";
import { providers } from "@schema";
import { eq, and } from "drizzle-orm";
import { RazorpayAdapter } from "@core/adapters/razorpay.adapter";
import { StripeAdapter } from "@core/adapters/stripe.adapter";
import type { BasePaymentProvider } from "@core/base";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Fetches the provider row by ID (or by type and companyId) and constructs the appropriate adapter.
 * Throws if the provider is not found or the type is unsupported.
 */
export async function resolveAdapter(providerId: string, companyId?: string): Promise<{
  adapter: BasePaymentProvider;
  provider: typeof providers.$inferSelect;
}> {
  let query;
  if (UUID_REGEX.test(providerId)) {
    query = db.select().from(providers).where(eq(providers.id, providerId)).limit(1);
  } else if (companyId) {
    query = db.select().from(providers).where(and(eq(providers.type, providerId), eq(providers.companyId, companyId))).limit(1);
  } else {
    throw new Error(`Invalid providerId "${providerId}" (not a UUID) and no companyId provided`);
  }

  const [provider] = await query;

  console.log(provider);
  if (!provider) {
    const err = new Error(`Provider "${providerId}" not found`);
    (err as any).statusCode = 404;
    throw err;
  }

  const creds = provider.credentials as Record<string, string>;

  let adapter: BasePaymentProvider;

  switch (provider.type) {
    case "razorpay":
      adapter = new RazorpayAdapter({
        apiKey: creds.keyId!,
        apiSecret: creds.keySecret!,
      });
      break;
    case "stripe":
      adapter = new StripeAdapter({ apiKey: creds.apiKey! });
      break;
    default: {
      const err = new Error(`Unsupported provider type: "${provider.type}"`);
      (err as any).statusCode = 400;
      throw err;
    }
  }

  return { adapter, provider };
}
