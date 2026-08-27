import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
	companies: {
		user: r.one.users({
			from: r.companies.userId,
			to: r.users.id
		}),
		services: r.many.services(),
	},
	clients: {
		service: r.one.services({
			from: r.clients.serviceId,
			to: r.services.id
		}),
		invoices: r.many.invoices(),
	},
	services: {
		clients: r.many.clients(),
		company: r.one.companies({
			from: r.services.companyId,
			to: r.companies.id
		}),
	},
	users: {
		companies: r.many.companies(),
		refreshTokens: r.many.refreshTokens(),
	},
	invoices: {
		client: r.one.clients({
			from: r.invoices.clientId,
			to: r.clients.id
		}),
		paymentLink: r.one.paymentLinks({
			from: r.invoices.paymentLinkId,
			to: r.paymentLinks.id
		}),
	},
	paymentLinks: {
		company: r.one.companies({
			from: r.paymentLinks.companyId,
			to: r.companies.id
		}),
	},
	refreshTokens: {
		user: r.one.users({
			from: r.refreshTokens.userId,
			to: r.users.id
		}),
	},
	webhookEndpoints: {
		company: r.one.companies({
			from: r.webhookEndpoints.companyId,
			to: r.companies.id
		}),
		events: r.many.webhookEvents(),
	},
	webhookEvents: {
		endpoint: r.one.webhookEndpoints({
			from: r.webhookEvents.webhookEndpointId,
			to: r.webhookEndpoints.id
		}),
	},
}));
