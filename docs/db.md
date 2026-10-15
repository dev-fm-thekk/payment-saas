# Database Design — Payment SDK

## Overview

The database is **PostgreSQL** (hosted on NeonDB, accessed via the `@neondatabase/serverless` driver). Schema is managed with **Drizzle ORM** and versioned via **drizzle-kit** migrations.

All primary keys are **UUID v4** (`uuid().defaultRandom()`). Timestamps use `now()` defaults. Sensitive data (passwords, API credentials) is never stored in plain text.

---

## Entity-Relationship Diagram

```mermaid
erDiagram
    users {
        uuid id PK
        text email
        text password_hash
        text name
        text role
        bool is_verified
        timestamptz created_at
        timestamptz updated_at
    }

    companies {
        uuid id PK
        text name
        uuid user_id FK
        timestamptz created_at
    }

    services {
        uuid id PK
        uuid company_id FK
        text name
        text currency
        timestamptz created_at
    }

    clients {
        uuid id PK
        text name
        text email
        uuid service_id FK
        timestamp created_at
        timestamp updated_at
    }

    providers {
        uuid id PK
        uuid company_id FK
        text type
        jsonb credentials
        timestamptz created_at
        timestamptz updated_at
    }

    payment_links {
        uuid id PK
        uuid company_id FK
        text provider
        text provider_link_id
        uuid invoice_id
        text url
        text status
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    invoices {
        uuid id PK
        text invoice_number
        text title
        text description
        uuid client_id FK
        int amount_minor
        text currency
        text status
        uuid payment_link_id FK
        timestamp due_date
        timestamp paid_at
        timestamp created_at
        timestamp updated_at
    }

    refresh_tokens {
        uuid id PK
        uuid user_id FK
        text token_hash
        timestamptz expires_at
        bool revoked
        text user_agent
        text ip_address
        timestamptz created_at
    }

    webhook_endpoints {
        uuid id PK
        uuid company_id FK
        text provider
        text url
        timestamp created_at
    }

    webhook_events {
        uuid id PK
        uuid webhook_endpoint_id FK
        jsonb payload
        timestamp received_at
    }

    notifications {
        uuid id PK
        uuid user_id FK
        text to
        text title
        text subject
        text body
        text status
        timestamp created_at
    }

    users ||--o{ companies : "owns"
    users ||--o{ refresh_tokens : "has"
    users ||--o{ notifications : "receives"
    companies ||--o{ services : "offers"
    companies ||--o{ providers : "configures"
    companies ||--o{ payment_links : "creates"
    companies ||--o{ webhook_endpoints : "registers"
    services ||--o{ clients : "has"
    clients ||--o{ invoices : "billed via"
    invoices }o--o| payment_links : "linked to"
    webhook_endpoints ||--o{ webhook_events : "receives"
```

---

## Tables

### `users`

Stores registered platform users (the business operators, not payers).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default random | |
| `email` | `text` | NOT NULL, UNIQUE | Unique index on `lower(email)` |
| `password_hash` | `text` | NOT NULL | bcrypt hash, never plain text |
| `name` | `text` | NOT NULL | |
| `role` | `text` | NOT NULL, default `'user'` | `'user'` or `'admin'` |
| `is_verified` | `boolean` | NOT NULL, default `false` | Email verification flag |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | |

**Indexes:**
- `users_email_lower_idx` — `btree` on `lower(email)` (case-insensitive uniqueness)
- `users_email_key` — unique on `email`

---

### `companies`

A tenant in the system. Each user can own one or more companies.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default random | |
| `name` | `text` | NOT NULL | |
| `user_id` | `uuid` | FK → `users.id` ON DELETE CASCADE | Owner reference |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

---

### `services`

The product or service offerings a company provides. Clients are associated to a service.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default random | |
| `company_id` | `uuid` | NOT NULL, FK → `companies.id` ON DELETE CASCADE | |
| `name` | `text` | NOT NULL | |
| `currency` | `text` | NOT NULL | ISO 4217 code (e.g. `INR`, `USD`) |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

**Indexes:**
- `idx_services_company_id` — btree on `company_id`

---

### `clients`

End-customers of a company. Linked to a specific service.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default random | |
| `name` | `text` | NOT NULL | |
| `email` | `text` | nullable, UNIQUE | Used for invoice notifications |
| `service_id` | `uuid` | FK → `services.id` ON DELETE RESTRICT | |
| `created_at` | `timestamp` | default `now()` | |
| `updated_at` | `timestamp` | default `now()` | |

**Constraints:**
- `client_email_key` — unique on `email`

> [!NOTE]
> `ON DELETE RESTRICT` on `service_id` means a service cannot be deleted if it still has clients.

---

### `providers`

Stores payment gateway credentials per company. One provider per gateway type per company.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default random | |
| `company_id` | `uuid` | NOT NULL, FK → `companies.id` ON DELETE CASCADE | |
| `type` | `text` | NOT NULL | `'razorpay'` \| `'stripe'` \| `'paypal'` |
| `credentials` | `jsonb` | NOT NULL | `{ apiKey, apiSecret? }` — encrypted at rest by Neon |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | |

**Constraints:**
- `company_provider_type_key` — unique on `(company_id, type)`
- `providers_type_check` — check `type IN ('razorpay', 'stripe', 'paypal')`

**Indexes:**
- `idx_providers_company_id` — btree on `company_id`

**Credentials shape by provider:**

| Provider | Keys |
|----------|------|
| Razorpay | `{ keyId, keySecret }` |
| Stripe | `{ apiKey }` |
| PayPal | `{ clientId, clientSecret }` |

> [!CAUTION]
> Credentials are stored in `jsonb`. Ensure Neon column-level encryption or a secrets manager is used in production before storing real API keys.

---

### `payment_links`

Records of payment links generated via a provider API.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default random | Internal ID |
| `company_id` | `uuid` | NOT NULL, FK → `companies.id` ON DELETE CASCADE | |
| `provider` | `text` | NOT NULL | Which gateway generated this link |
| `provider_link_id` | `text` | nullable | Provider's own ID (e.g. `plink_xxx`) |
| `invoice_id` | `uuid` | nullable | Back-reference to linked invoice |
| `url` | `text` | NOT NULL | Shareable payment URL |
| `status` | `text` | NOT NULL, default `'active'` | `'active'` \| `'expired'` \| `'consumed'` |
| `expires_at` | `timestamp` | nullable | Link expiry |
| `created_at` | `timestamp` | default `now()` | |
| `updated_at` | `timestamp` | default `now()` | |

**Constraints:**
- `payment_links_status_check` — check `status IN ('active', 'expired', 'consumed')`

**Indexes:**
- `idx_payment_links_company_id` — btree on `company_id`
- `idx_payment_links_provider_link_id` — btree on `provider_link_id`

---

### `invoices`

Financial invoices issued by a company to a client.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default random | |
| `invoice_number` | `text` | NOT NULL, UNIQUE | Human-readable reference |
| `title` | `text` | NOT NULL | |
| `description` | `text` | NOT NULL | |
| `client_id` | `uuid` | FK → `clients.id` ON DELETE RESTRICT | |
| `amount_minor` | `integer` | NOT NULL | Amount in smallest currency unit (paise/cents) |
| `currency` | `text` | NOT NULL | ISO 4217 |
| `status` | `text` | NOT NULL, default `'draft'` | See lifecycle below |
| `payment_link_id` | `uuid` | nullable | FK to `payment_links.id` (soft ref) |
| `due_date` | `timestamp` | nullable | |
| `paid_at` | `timestamp` | nullable | Set when status = `paid` |
| `created_at` | `timestamp` | default `now()` | |
| `updated_at` | `timestamp` | default `now()` | |

**Constraints:**
- `invoice_invoice_number_key` — unique on `invoice_number`
- `invoice_status_check` — check `status IN ('draft', 'pending', 'paid', 'failed', 'expired')`

**Indexes:**
- `idx_invoice_client_id` — btree on `client_id`
- `idx_invoice_status` — btree on `status`

**Invoice Status Lifecycle:**
```mermaid
stateDiagram-v2
    [*] --> draft
    draft --> pending
    pending --> paid
    pending --> failed
    pending --> expired
    paid --> [*]
    failed --> [*]
    expired --> [*]
```

> [!NOTE]
> `amount_minor` stores amounts in the **smallest currency unit** (paise for INR, cents for USD). Always divide by 100 before displaying to users.

---

### `refresh_tokens`

Tracks active refresh tokens for the rotating-refresh-token auth strategy.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default random | |
| `user_id` | `uuid` | NOT NULL, FK → `users.id` ON DELETE CASCADE | |
| `token_hash` | `text` | NOT NULL, UNIQUE | bcrypt hash of the raw token |
| `expires_at` | `timestamptz` | NOT NULL | 7 days from issuance |
| `revoked` | `boolean` | NOT NULL, default `false` | Set to true on logout/refresh |
| `user_agent` | `text` | nullable | Device identification |
| `ip_address` | `text` | nullable | Origin IP |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

**Indexes:**
- `refresh_tokens_token_hash_idx` — btree on `token_hash`
- `refresh_tokens_user_id_idx` — btree on `user_id`

---

### `webhook_endpoints`

Provider webhook endpoint registrations owned by a company.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default random | |
| `company_id` | `uuid` | NOT NULL, FK → `companies.id` ON DELETE CASCADE | |
| `provider` | `text` | NOT NULL | `'stripe'` \| `'razorpay'` \| `'paypal'` |
| `url` | `text` | NOT NULL | The public URL registered with the provider |
| `created_at` | `timestamp` | default `now()` | |

---

### `webhook_events`

Durable log of raw inbound webhook events.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default random | |
| `webhook_endpoint_id` | `uuid` | NOT NULL, FK → `webhook_endpoints.id` ON DELETE CASCADE | |
| `payload` | `jsonb` | NOT NULL | Full raw provider payload |
| `received_at` | `timestamp` | default `now()` | |

---

### `notifications`

Tracks outbound notification deliveries (email via Courier).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default random | |
| `user_id` | `uuid` | NOT NULL, FK → `users.id` ON DELETE CASCADE | Sending user (company owner) |
| `to` | `text` | NOT NULL | Recipient address |
| `title` | `text` | NOT NULL | |
| `subject` | `text` | NOT NULL | |
| `body` | `text` | NOT NULL | |
| `status` | `text` | NOT NULL, default `'pending'` | `'pending'` \| `'sent'` \| `'failed'` |
| `created_at` | `timestamp` | default `now()` | |

**Constraints:**
- `notifications_status_check` — check `status IN ('pending', 'sent', 'failed')`

---

## Relations Summary

| From | → | To | Type | Notes |
|------|---|----|------|-------|
| `companies` | → | `users` | many-to-one | `company.user_id` |
| `companies` | → | `services` | one-to-many | |
| `companies` | → | `providers` | one-to-many | max one per type |
| `companies` | → | `payment_links` | one-to-many | |
| `companies` | → | `webhook_endpoints` | one-to-many | |
| `services` | → | `clients` | one-to-many | |
| `clients` | → | `invoices` | one-to-many | |
| `invoices` | → | `payment_links` | many-to-one (optional) | |
| `users` | → | `refresh_tokens` | one-to-many | |
| `users` | → | `notifications` | one-to-many | |
| `webhook_endpoints` | → | `webhook_events` | one-to-many | |

---

## Migrations

Migrations are stored in `drizzle/` and generated by:

```bash
bun run drizzle-kit generate   # generate SQL from schema changes
bun run drizzle-kit migrate    # apply pending migrations
bun run drizzle-kit studio     # open Drizzle Studio GUI
```

### Applied Migrations

| Migration | Description |
|-----------|-------------|
| `20260926033356_add_provider_link_id_and_invoice_id_to_payment_links` | Added `provider_link_id` and `invoice_id` columns to `payment_links` |
| `20260926063633_add_updated_at_to_payment_links` | Added `updated_at` column to `payment_links` |

---

## Indexing Strategy

| Table | Index | Rationale |
|-------|-------|-----------|
| `users` | `lower(email)` | Case-insensitive login lookup |
| `invoices` | `client_id` | List invoices by client (common query) |
| `invoices` | `status` | Filter invoices by lifecycle state |
| `payment_links` | `company_id` | List links per company |
| `payment_links` | `provider_link_id` | Webhook event correlation |
| `refresh_tokens` | `token_hash` | Token validation on every refresh |
| `refresh_tokens` | `user_id` | Revoke all tokens for a user |
| `services` | `company_id` | List services per company |
| `providers` | `company_id` | List providers per company |

---

## Configuration

```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

The Drizzle client is initialised in `db/index.ts` using `@neondatabase/serverless` for HTTP-based connections (serverless-compatible) with the standard `pg` driver as fallback.
