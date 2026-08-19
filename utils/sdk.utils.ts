import { and, eq } from "drizzle-orm";
import db from "../db";
import { providerConfigs, services } from "../db/schema";
import { ProviderName, StripeAdapter, RazorpayAdapter } from "../core";

/**
 * Resolves the active provider config for a given serviceId, validates that the
 * service belongs to the calling company, then decrypts the raw credentials and
 * returns an initialised adapter.
 */
export async function resolveAdapter(serviceId: string, companyId: string) {
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

    type credential = {
      apiKey: string,
      apiSecret: String
    }
    const credentials = config.credentialsEncrypted as credential;
    
    let mappedCredentials: any = {};
    if (config.provider === 'stripe') {
        mappedCredentials = {
            apiKey: credentials.apiKey
        };
    } else if (config.provider === 'razorpay') {
        mappedCredentials = {
            apiKey: credentials.apiKey,
            apiSecret: credentials.apiSecret
        };
    }

    const providerName =
      config.provider === "stripe"
        ? ProviderName.STRIPE
        : ProviderName.RAZORPAY;

    const adapter = providerName === ProviderName.STRIPE
      ? new StripeAdapter({ apiKey: mappedCredentials.apiKey })
      : new RazorpayAdapter({ apiKey: mappedCredentials.apiKey, apiSecret: mappedCredentials.apiSecret! });

    return {
      error: null,
      data: { adapter, provider: config.provider, service: svc[0] },
    };
  } catch (err: any) {
    console.error(err);
    return { error: err.message || String(err), data: null };
  }
}