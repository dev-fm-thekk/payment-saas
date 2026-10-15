# Payment SDK

A multi-tenant, provider-agnostic payment backend built with **Express**, **TypeScript**, and **Drizzle ORM**. It abstracts over Stripe, Razorpay, and PayPal behind a unified adapter interface — letting you create payment links, manage invoices, register webhooks, and track payment events through a single REST API.

---

## Documentation

| Doc | Description |
|-----|-------------|
| [System Design](docs/system-design.md) | Architecture overview, module breakdown, request lifecycle, auth flow, adapter pattern, multi-tenancy, webhook ingestion |
| [Database Design](docs/db.md) | ERD, full table reference, indexes, relations, migrations |
| [API Reference](docs/api.md) | All endpoints with request/response shapes, error codes, and a complete route summary |

Interactive Swagger UI is available at [`/api-docs`](http://localhost:3000/api-docs) when the server is running.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun (dev) |
| Framework | Express 5 |
| Language | TypeScript 5 |
| Database | PostgreSQL (NeonDB) |
| ORM | Drizzle ORM + drizzle-kit |
| Auth | JWT + bcrypt (rotating refresh tokens) |
| Payments | Stripe SDK · Razorpay SDK |
| Notifications | Courier (`@trycourier/courier`) |
| Logging | Winston |
| Validation | Zod 4 |
| Testing | Vitest + Supertest |

---

## Prerequisites

- **[Bun](https://bun.sh)** ≥ 1.3 — `curl -fsSL https://bun.sh/install | bash`
- **PostgreSQL** database — a free [Neon](https://neon.tech) project works out of the box
- **Stripe** and/or **Razorpay** account(s) for API keys
- **[Courier](https://app.courier.com)** account for email notifications (optional but needed for `POST /invoice/notify`)

---

## Local Setup

### 1. Clone & install

```bash
git clone <repo-url>
cd payment-sdk
bun install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
# ── Server ────────────────────────────────────────────
PORT=3000

# ── Database ──────────────────────────────────────────
# NeonDB connection string (or any PostgreSQL URL)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# ── Auth ──────────────────────────────────────────────
# Any long random string — used to sign JWTs
ACCESS_TOKEN_SECRET=your-super-secret-key-here

# ── Notifications ─────────────────────────────────────
# From https://app.courier.com → Settings → API Keys
COURIER_API_KEY=pk_prod_...

# Optional: ID of a stored Courier template for invoices.
# If omitted, the SDK builds the email content inline.
COURIER_INVOICE_TEMPLATE_ID=

# ── Email (legacy nodemailer fallback) ────────────────
GOOGLE_APP_PASSWORD=your-google-app-password
```

> [!IMPORTANT]
> Never commit `.env` to version control. A `.gitignore` entry for `.env` is strongly recommended.

### 3. Run database migrations

```bash
# Generate SQL from the Drizzle schema (only needed when schema changes)
bun run drizzle-kit generate

# Apply all pending migrations to your database
bun run drizzle-kit migrate
```

> [!TIP]
> Run `bun run drizzle-kit studio` to open Drizzle Studio — a browser-based GUI for inspecting and editing your database tables.

### 4. Start the development server

```bash
bun run dev
```

The server starts with hot-reload enabled (`--watch`). You should see:

```
Server successfully running on port 3000
```

| Endpoint | URL |
|----------|-----|
| Health check | http://localhost:3000/api/v1/health |
| Swagger UI | http://localhost:3000/api-docs |
| API base | http://localhost:3000/api/v1 |

---

## Quick Start (API walkthrough)

### 1. Register a user

```bash
curl -X POST http://localhost:3000/api/v1/user \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe", "email": "jane@example.com", "password": "strongpass"}'
```

### 2. Log in and get a token

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "jane@example.com", "password": "strongpass"}'
```

Copy the `accessToken` from the response. Use it as `Bearer <token>` in the `Authorization` header for all subsequent requests.

### 3. Create a company

```bash
curl -X POST http://localhost:3000/api/v1/company \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp"}'
```

### 4. Register a payment provider

```bash
# Razorpay
curl -X POST http://localhost:3000/api/v1/provider \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "<company-uuid>",
    "type": "razorpay",
    "credentials": { "keyId": "rzp_test_...", "keySecret": "..." }
  }'

# Stripe
curl -X POST http://localhost:3000/api/v1/provider \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "<company-uuid>",
    "type": "stripe",
    "credentials": { "apiKey": "sk_test_..." }
  }'
```

### 5. Create a payment link

```bash
curl -X POST http://localhost:3000/api/v1/payment-link \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "<company-uuid>",
    "providerId": "<provider-uuid>",
    "amount": 50000,
    "currency": "INR",
    "description": "Invoice #001"
  }'
```

> `amount` is in the **smallest currency unit** — paise for INR, cents for USD.

---

## Project Structure

```
payment-sdk/
├── core/               # Provider-agnostic SDK layer
│   ├── base.ts         # Abstract class + PaymentError
│   ├── types.ts        # Shared DTOs and enums
│   └── adapters/       # Stripe, Razorpay, PayPal implementations
├── db/
│   ├── schema.ts       # Drizzle table definitions
│   ├── relations.ts    # Relational mappings
│   └── index.ts        # DB client singleton
├── drizzle/            # Generated migration SQL files
├── src/
│   ├── app.ts          # Express app + route mounting
│   ├── server.ts       # HTTP server bootstrap
│   ├── controllers/    # Request handlers (one dir per domain)
│   ├── routes/         # Express Router definitions
│   ├── middlewares/    # Auth middleware (JWT verify + companyId resolve)
│   ├── lib/            # Adapter factory (resolveAdapter)
│   └── services/       # Logging (Winston) + Notifications (Courier)
├── configs/config.ts   # Centralised env access
├── utils/              # Hashing, Zod schemas, SDK utilities
└── docs/
    ├── system-design.md
    ├── db.md
    └── api.md
```

---

## Running Tests

```bash
bun run vitest
```

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `bun run dev` | Start with hot-reload |
| Tests | `bun run vitest` | Run Vitest test suite |
| Generate migration | `bun run drizzle-kit generate` | Diff schema → SQL |
| Apply migrations | `bun run drizzle-kit migrate` | Push migrations to DB |
| DB Studio | `bun run drizzle-kit studio` | Open Drizzle Studio GUI |
