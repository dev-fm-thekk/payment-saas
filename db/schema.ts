import { pgTable, uuid, text, timestamp, jsonb, boolean, integer, index, uniqueIndex, foreignKey, primaryKey, unique, check } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const clients = pgTable("clients", {
	id: uuid().defaultRandom().primaryKey(),
	name: text().notNull(),
	email: text(),
	service_id: uuid().references(() => services.id, { onDelete: "restrict" }),
	createdAt: timestamp("created_at").default(sql`now()`),
	updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => [
	unique("client_email_key").on(table.email),
]);

export const companies = pgTable("companies", {
	id: uuid().defaultRandom().primaryKey(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
});

export const invoices = pgTable("invoices", {
	id: uuid().defaultRandom().primaryKey(),
	invoiceNumber: text("invoice_number").notNull(),
	title: text().notNull(),
	description: text().notNull(),
	clientId: uuid("client_id").references(() => clients.id, { onDelete: "restrict" } ),
	amount: integer("amount_minor").notNull(),
	currency: text().notNull(),
	status: text().default("draft").notNull(),
	paymentLinkId: uuid("payment_link_id"),
	dueDate: timestamp("due_date"),
	paidAt: timestamp("paid_at"),
	createdAt: timestamp("created_at").default(sql`now()`),
	updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => [
	index("idx_invoice_client_id").using("btree", table.clientId.asc().nullsLast()),
	index("idx_invoice_status").using("btree", table.status.asc().nullsLast()),
	unique("invoice_invoice_number_key").on(table.invoiceNumber),
	check("invoice_status_check", sql`(status = ANY (ARRAY['draft'::text, 'pending'::text, 'paid'::text, 'failed'::text, 'expired'::text]))`),
]);

export const paymentLinks = pgTable("payment_links", {
	id: uuid().defaultRandom().primaryKey(),
	companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
	provider: text().notNull(),
	/** The provider's own payment-link ID (e.g. Razorpay `plink_xxx`, Stripe `plink_xxx`). */
	providerLinkId: text("provider_link_id"),
	/** Back-reference to the invoice that was created for this payment link (filled after invoice creation). */
	invoiceId: uuid("invoice_id"),
	url: text().notNull(),
	status: text().default("active").notNull(),
	expiresAt: timestamp("expires_at"),
	createdAt: timestamp("created_at").default(sql`now()`),
	updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => [
	index("idx_payment_links_company_id").using("btree", table.companyId.asc().nullsLast()),
	index("idx_payment_links_provider_link_id").using("btree", table.providerLinkId.asc().nullsLast()),
	check("payment_links_status_check", sql`(status = ANY (ARRAY['active'::text, 'expired'::text, 'consumed'::text]))`),
]);

export const refreshTokens = pgTable("refresh_tokens", {
	id: uuid().defaultRandom().primaryKey(),
	userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	tokenHash: text("token_hash").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	revoked: boolean().default(false).notNull(),
	userAgent: text("user_agent"),
	ipAddress: text("ip_address"),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
}, (table) => [
	index("refresh_tokens_token_hash_idx").using("btree", table.tokenHash.asc().nullsLast()),
	index("refresh_tokens_user_id_idx").using("btree", table.userId.asc().nullsLast()),
	unique("refresh_tokens_token_hash_key").on(table.tokenHash),
]);

export const services = pgTable("services", {
	id: uuid().defaultRandom().primaryKey(),
	companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" } ),
	name: text().notNull(),
	currency: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
}, (table) => [
	index("idx_services_company_id").using("btree", table.companyId.asc().nullsLast()),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey(),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	name: text().notNull(),
	role: text().default("user").notNull(),
	isVerified: boolean("is_verified").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
}, (table) => [
	uniqueIndex("users_email_lower_idx").using("btree", sql`lower(email)`),
	unique("users_email_key").on(table.email),
]);

export const webhookEndpoints = pgTable("webhook_endpoints", {
	id: uuid().defaultRandom().primaryKey(),
	companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
	provider: text().notNull(),
	url: text().notNull(),
	createdAt: timestamp("created_at").default(sql`now()`),
});

export const webhookEvents = pgTable("webhook_events", {
	id: uuid().defaultRandom().primaryKey(),
	webhookEndpointId: uuid("webhook_endpoint_id").notNull().references(() => webhookEndpoints.id, { onDelete: "cascade" }),
	payload: jsonb().notNull(),
	receivedAt: timestamp("received_at").default(sql`now()`),
});

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey(),
	userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
	to: text().notNull(),
	title: text().notNull(),
	subject: text().notNull(),
	body: text().notNull(),
	status: text().default("pending").notNull(),
	createdAt: timestamp("created_at").default(sql`now()`),
}, (table) => [
	check("notifications_status_check", sql`(status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text]))`),
]);

export const providers = pgTable("providers", {
	id: uuid().defaultRandom().primaryKey(),
	companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
	type: text().notNull(),
	credentials: jsonb().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
}, (table) => [
	index("idx_providers_company_id").using("btree", table.companyId.asc().nullsLast()),
	unique("company_provider_type_key").on(table.companyId, table.type),
	check("providers_type_check", sql`(type = ANY (ARRAY['razorpay'::text, 'stripe'::text, 'paypal'::text]))`),
]);
