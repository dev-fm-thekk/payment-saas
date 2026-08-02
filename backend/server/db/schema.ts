import { pgTable, uuid, text, timestamp, jsonb, boolean, integer, index, uniqueIndex, foreignKey, primaryKey, unique, check } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const apiKeys = pgTable("api_keys", {
	id: uuid().defaultRandom().primaryKey(),
	companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" } ),
	keyHash: text("key_hash").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
}, (table) => [
	index("idx_api_keys_company_id").using("btree", table.companyId.asc().nullsLast()),
	unique("api_keys_key_hash_key").on(table.keyHash),]);

export const client = pgTable("client", {
	id: uuid().defaultRandom().primaryKey(),
	name: text().notNull(),
	email: text(),
	serviceId: uuid("service_id").references(() => services.id),
	createdAt: timestamp("created_at").default(sql`now()`),
	updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => [
	unique("client_email_key").on(table.email),]);

export const companies = pgTable("companies", {
	id: uuid().defaultRandom().primaryKey(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
});

export const invoice = pgTable("invoice", {
	id: uuid().defaultRandom().primaryKey(),
	invoiceNumber: text("invoice_number").notNull(),
	title: text().notNull(),
	description: text().notNull(),
	clientId: uuid("client_id").references(() => client.id, { onDelete: "restrict" } ),
	amountMinor: integer("amount_minor").notNull(),
	currency: text().notNull(),
	status: text().default("draft").notNull(),
	dueDate: timestamp("due_date"),
	paidAt: timestamp("paid_at"),
	createdAt: timestamp("created_at").default(sql`now()`),
	updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => [
	index("idx_invoice_client_id").using("btree", table.clientId.asc().nullsLast()),
	index("idx_invoice_status").using("btree", table.status.asc().nullsLast()),
	unique("invoice_invoice_number_key").on(table.invoiceNumber),check("invoice_status_check", sql`(status = ANY (ARRAY['draft'::text, 'sent'::text, 'pending'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text]))`),]);

export const paymentLink = pgTable("payment_link", {
	id: uuid().defaultRandom().primaryKey(),
	invoiceId: uuid("invoice_id").notNull().references(() => invoice.id, { onDelete: "cascade" } ),
	linkUrl: text("link_url").notNull(),
	provider: text().notNull(),
	providerRef: text("provider_ref"),
	expiresAt: timestamp("expires_at"),
	createdAt: timestamp("created_at").default(sql`now()`),
	updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => [
	index("idx_payment_link_invoice_id").using("btree", table.invoiceId.asc().nullsLast()),
	index("idx_payment_link_provider_ref").using("btree", table.providerRef.asc().nullsLast()),
]);

export const providerConfigs = pgTable("provider_configs", {
	id: uuid().defaultRandom().primaryKey(),
	serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" } ),
	provider: text().notNull(),
	credentialsEncrypted: jsonb("credentials_encrypted").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
}, (table) => [
	index("idx_provider_configs_service_id").using("btree", table.serviceId.asc().nullsLast()),
	unique("provider_configs_service_id_provider_key").on(table.serviceId, table.provider),check("provider_configs_provider_check", sql`(provider = ANY (ARRAY['stripe'::text, 'razorpay'::text]))`),]);

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
	unique("refresh_tokens_token_hash_key").on(table.tokenHash),]);

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
	unique("users_email_key").on(table.email),]);

export const webhookEvents = pgTable("webhook_events", {
	id: uuid().defaultRandom().primaryKey(),
	provider: text().notNull(),
	eventType: text("event_type").notNull(),
	payload: jsonb().notNull(),
	processed: boolean().default(false).notNull(),
	receivedAt: timestamp("received_at", { withTimezone: true }).default(sql`now()`).notNull(),
}, (table) => [
	index("idx_webhook_events_processed").using("btree", table.processed.asc().nullsLast()),
	index("idx_webhook_events_provider").using("btree", table.provider.asc().nullsLast()),
check("webhook_events_provider_check", sql`(provider = ANY (ARRAY['stripe'::text, 'razorpay'::text]))`),]);
