import db from "@db";
import { providers } from "@schema";
import { eq } from "drizzle-orm";
import { RazorpayAdapter } from "@core/adapters/razorpay.adapter";
import { StripeAdapter } from "@core/adapters/stripe.adapter";
import type { BasePaymentProvider } from "@core/base";

/**
 * Fetches the provider row by ID and constructs the appropriate adapter.
 * Throws if the provider is not found or the type is unsupported.
 */
export async function resolveAdapter(providerId: string): Promise<{
  adapter: BasePaymentProvider;
  provider: typeof providers.$inferSelect;
}> {
  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.id, providerId))
    .limit(1);

  if (!provider) {
    const err = new Error(`Provider with id "${providerId}" not found`);
    (err as any).statusCode = 404;
    throw err;
  }

  const creds = provider.credentials as Record<string, string>;

  let adapter: BasePaymentProvider;

  switch (provider.type) {
    case "razorpay":
      adapter = new RazorpayAdapter({
        apiKey: creds.apiKey!,
        apiSecret: creds.apiSecret!,
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
