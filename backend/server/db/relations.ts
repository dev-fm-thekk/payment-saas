import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
	apiKeys: {
		company: r.one.companies({
			from: r.apiKeys.companyId,
			to: r.companies.id
		}),
	},
	companies: {
		apiKeys: r.many.apiKeys(),
		user: r.one.users({
			from: r.companies.userId,
			to: r.users.id
		}),
		services: r.many.services(),
	},
	client: {
		service: r.one.services({
			from: r.client.serviceId,
			to: r.services.id
		}),
		invoices: r.many.invoice(),
	},
	services: {
		clients: r.many.client(),
		providerConfigs: r.many.providerConfigs(),
		company: r.one.companies({
			from: r.services.companyId,
			to: r.companies.id
		}),
	},
	users: {
		companies: r.many.companies(),
		refreshTokens: r.many.refreshTokens(),
	},
	invoice: {
		client: r.one.client({
			from: r.invoice.clientId,
			to: r.client.id
		}),
		paymentLinks: r.many.paymentLink(),
	},
	paymentLink: {
		invoice: r.one.invoice({
			from: r.paymentLink.invoiceId,
			to: r.invoice.id
		}),
	},
	providerConfigs: {
		service: r.one.services({
			from: r.providerConfigs.serviceId,
			to: r.services.id
		}),
	},
	refreshTokens: {
		user: r.one.users({
			from: r.refreshTokens.userId,
			to: r.users.id
		}),
	},
}))