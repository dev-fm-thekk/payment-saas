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
		services: r.many.services(),
	},
	orders: {
		service: r.one.services({
			from: r.orders.serviceId,
			to: r.services.id
		}),
		payments: r.many.payments(),
	},
	services: {
		orders: r.many.orders(),
		providerConfigs: r.many.providerConfigs(),
		company: r.one.companies({
			from: r.services.companyId,
			to: r.companies.id
		}),
	},
	payments: {
		order: r.one.orders({
			from: r.payments.orderId,
			to: r.orders.id
		}),
		refunds: r.many.refunds(),
	},
	providerConfigs: {
		service: r.one.services({
			from: r.providerConfigs.serviceId,
			to: r.services.id
		}),
	},
	refunds: {
		payment: r.one.payments({
			from: r.refunds.paymentId,
			to: r.payments.id
		}),
	},
}))