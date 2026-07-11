import { pgTable, uuid, text, numeric, timestamp, jsonb, boolean, index, uniqueIndex, foreignKey, primaryKey, unique, check } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const apiKeys = pgTable("api_keys", {
	id: uuid().defaultRandom().primaryKey(),
	companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" } ),
	keyHash: text("key_hash").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
}, (table) => [
	index("idx_api_keys_company_id").using("btree", table.companyId.asc().nullsLast()),
	unique("api_keys_key_hash_key").on(table.keyHash),]);

export const companies = pgTable("companies", {
	id: uuid().defaultRandom().primaryKey(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
});

export const orders = pgTable("orders", {
	id: uuid().defaultRandom().primaryKey(),
	serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" } ),
	amount: numeric({ precision: 12, scale: 2 }).notNull(),
	currency: text().notNull(),
	status: text().default("created").notNull(),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
}, (table) => [
	index("idx_orders_service_id").using("btree", table.serviceId.asc().nullsLast()),
	index("idx_orders_status").using("btree", table.status.asc().nullsLast()),
check("orders_amount_check", sql`(amount > (0)::numeric)`),check("orders_status_check", sql`(status = ANY (ARRAY['created'::text, 'paid'::text, 'failed'::text, 'refunded'::text, 'partially_refunded'::text]))`),]);

export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey(),
	orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" } ),
	provider: text().notNull(),
	providerPaymentId: text("provider_payment_id").notNull(),
	status: text().default("pending").notNull(),
	rawResponse: jsonb("raw_response"),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
}, (table) => [
	index("idx_payments_order_id").using("btree", table.orderId.asc().nullsLast()),
	index("idx_payments_status").using("btree", table.status.asc().nullsLast()),
	unique("payments_provider_provider_payment_id_key").on(table.provider, table.providerPaymentId),check("payments_provider_check", sql`(provider = ANY (ARRAY['stripe'::text, 'razorpay'::text]))`),check("payments_status_check", sql`(status = ANY (ARRAY['pending'::text, 'succeeded'::text, 'failed'::text]))`),]);

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

export const refunds = pgTable("refunds", {
	id: uuid().defaultRandom().primaryKey(),
	paymentId: uuid("payment_id").notNull().references(() => payments.id, { onDelete: "cascade" } ),
	providerRefundId: text("provider_refund_id").notNull(),
	amount: numeric({ precision: 12, scale: 2 }).notNull(),
	status: text().default("pending").notNull(),
	reason: text(),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
}, (table) => [
	index("idx_refunds_payment_id").using("btree", table.paymentId.asc().nullsLast()),
	index("idx_refunds_status").using("btree", table.status.asc().nullsLast()),
	unique("refunds_payment_id_provider_refund_id_key").on(table.paymentId, table.providerRefundId),check("refunds_amount_check", sql`(amount > (0)::numeric)`),check("refunds_status_check", sql`(status = ANY (ARRAY['pending'::text, 'succeeded'::text, 'failed'::text]))`),]);

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
