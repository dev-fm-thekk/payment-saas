# API Reference — Payment SDK

## Base URL

```
http://localhost:<PORT>/api/v1
```

An interactive Swagger UI is available at `/api-docs` when the server is running.

---

## Authentication

All routes except **User Registration**, **Login**, and **Webhook Inbound** require a valid JWT access token.

```
Authorization: Bearer <accessToken>
```

Refresh tokens are stored in an **HttpOnly cookie** (`refreshToken`). Include `credentials: true` in CORS-aware clients.

### Response Envelope

All responses follow this shape:

```json
{ "status": "success" | "failed", "data": <payload>, "error": <message> }
```

---

## Auth

### `POST /auth/login`

Authenticate a user and receive tokens.

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Response `200`**
```json
{
  "status": "success",
  "accessToken": "<jwt>",
  "refreshToken": "<token>",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```
Sets `refreshToken` HttpOnly cookie (7 days).

**Errors**

| Status | Condition |
|--------|-----------|
| `400` | Missing email or password |
| `401` | Invalid credentials |

---

### `POST /auth/refresh`

Exchange a valid refresh token cookie for a new access token.

**Request** — no body; reads `refreshToken` cookie automatically.

**Response `200`**
```json
{
  "status": "success",
  "accessToken": "<new_jwt>",
  "refreshToken": "<new_token>"
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| `400` | Cookie missing |
| `401` | Token invalid, expired, or revoked |

---

### `POST /auth/logout`

Revoke the current refresh token and clear the cookie.

**Request** — reads `refreshToken` cookie automatically.

**Response `200`**
```json
{ "status": "success", "message": "Logged out successfully" }
```

---

## Users

### `POST /user` — Public

Register a new user account.

**Request Body**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "strongpass"
}
```

**Response `201`**
```json
{
  "status": "success",
  "payload": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "is_verified": false,
    "created_at": "2026-10-15T12:00:00Z"
  }
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| `400` | Validation failed |
| `409` | Email already registered |

---

### `GET /user` 🔒

Get the profile of the authenticated user.

**Response `200`**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

### `PATCH /user/:id` 🔒

Update user profile. Users can only update their own profile; admins can update anyone.

**Request Body** _(all optional)_
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Response `200`** — updated user object.

**Errors**

| Status | Condition |
|--------|-----------|
| `403` | Attempting to edit another user without admin role |
| `404` | User not found |

---

### `DELETE /user/:id` 🔒

Delete a user account. Self-delete or admin only.

**Response `200`** — deleted user object.

---

## Companies

### `POST /company` 🔒

Create a company for the authenticated user.

**Request Body**
```json
{ "name": "Acme Corp" }
```

**Response `201`**
```json
{
  "status": "success",
  "payload": {
    "id": "uuid",
    "name": "Acme Corp",
    "user_id": "uuid",
    "created_at": "..."
  }
}
```

---

### `GET /company` 🔒

List all companies owned by the authenticated user.

**Response `200`**
```json
{ "status": "success", "data": [ { "id": "uuid", "name": "Acme Corp", ... } ] }
```

---

### `GET /company/:id` 🔒

Get a specific company by ID.

**Response `200`** — company object. `404` if not found.

---

### `PATCH /company/:id` 🔒

Update company name.

**Request Body**
```json
{ "name": "New Name" }
```

---

### `DELETE /company/:id` 🔒

Delete a company (cascades to services, providers, payment links, webhooks).

---

## Services

### `POST /service` 🔒

Create a service for a company.

**Request Body**
```json
{
  "companyId": "uuid",
  "name": "Premium Plan",
  "currency": "INR"
}
```

**Response `201`** — created service object.

---

### `GET /service/company/:companyId` 🔒

List all services for a company.

---

### `GET /service/:id` 🔒

Get a specific service by ID.

---

### `PATCH /service/:id` 🔒

Update service name or currency.

---

### `DELETE /service/:id` 🔒

Delete a service. Will fail (`RESTRICT`) if clients are attached.

---

## Clients

### `POST /client` 🔒

Create a client (end-customer) under a service.

**Request Body**
```json
{
  "name": "Bob Smith",
  "email": "bob@client.com",
  "serviceId": "uuid"
}
```

**Response `201`**
```json
{ "status": "success", "payload": { "id": "uuid", "name": "Bob Smith", ... } }
```

---

### `GET /client/:id` 🔒

Get a client by ID.

---

### `GET /client/service/:serviceId` 🔒

List all clients under a service.

---

### `PATCH /client/:id` 🔒

Update client name and/or email.

**Request Body** _(all optional)_
```json
{ "name": "Robert Smith", "email": "robert@client.com" }
```

---

### `DELETE /client/:id` 🔒

Delete a client (will fail if they have linked invoices — RESTRICT).

---

## Providers

Manage payment gateway credentials per company. A company can have **at most one** provider of each type.

### `POST /provider` 🔒

Register a payment provider for a company.

**Request Body**
```json
{
  "companyId": "uuid",
  "type": "stripe",
  "credentials": {
    "apiKey": "sk_live_..."
  }
}
```

| Provider | `credentials` shape |
|----------|---------------------|
| `stripe` | `{ "apiKey": "sk_..." }` |
| `razorpay` | `{ "keyId": "rzp_...", "keySecret": "..." }` |
| `paypal` | `{ "clientId": "...", "clientSecret": "..." }` |

**Response `201`** — provider record (credentials included).

**Errors**

| Status | Condition |
|--------|-----------|
| `400` | Validation failed / invalid type |
| `409` | Provider of this type already exists for this company |

---

### `GET /provider/:id` 🔒

Get a provider by ID.

---

### `GET /provider/company/:companyId` 🔒

List all providers for a company.

---

### `PATCH /provider/:id` 🔒

Update provider credentials.

**Request Body**
```json
{
  "credentials": { "apiKey": "sk_live_new_key" }
}
```

---

### `DELETE /provider/:id` 🔒

Delete a provider record.

---

## Payment Links

### `POST /payment-link` 🔒

Create a payment link via a registered provider. The callback URL is auto-generated pointing to this server.

**Request Body**
```json
{
  "companyId": "uuid",
  "providerId": "uuid",
  "amount": 50000,
  "currency": "INR",
  "description": "Invoice #001",
  "upi_link": false
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `companyId` | `string` (UUID) | ✅ | Also accepts `company` as alias |
| `providerId` | `string` (UUID) | ✅ | Also accepts `provider` as alias |
| `amount` | `integer` | ✅ | In smallest currency unit (paise / cents) |
| `currency` | `string` | ✅ | ISO 4217 (e.g. `INR`, `USD`) |
| `description` | `string` | ❌ | |
| `upi_link` | `boolean` | ❌ | Razorpay only — creates UPI-only link |

**Response `201`**
```json
{
  "status": "success",
  "service": "payment-link | create",
  "data": {
    "id": "uuid",
    "company_id": "uuid",
    "provider": "razorpay",
    "provider_link_id": "plink_xxx",
    "url": "https://rzp.io/i/abc123",
    "status": "active",
    "created_at": "..."
  }
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| `400` | Missing companyId or providerId / validation failed |
| `404` | Provider not found |

---

### `GET /payment-link/:id` 🔒

Get a payment link record by internal UUID.

---

### `GET /payment-link/company/:companyId` 🔒

List all payment links for a company.

---

### `PATCH /payment-link/:id` 🔒

Update local payment link metadata (does not call the provider).

**Request Body** _(all optional)_
```json
{
  "url": "https://...",
  "status": "expired",
  "expiresAt": "2026-12-31T00:00:00Z"
}
```

`status` must be one of: `active` | `expired` | `consumed`.

---

### `DELETE /payment-link/:id` 🔒

Delete a payment link record from the local database.

---

### `GET /payment-link/callback` — Public

Internal callback URL set as the `after_completion` redirect for payment links. Called by the payment provider after a successful payment.

---

## Invoices

### `POST /invoice` 🔒

Create a new invoice in `draft` state.

**Request Body**
```json
{
  "title": "Web Design - October",
  "description": "Full website redesign project",
  "clientId": "uuid",
  "amount": "150000",
  "currency": "INR",
  "status": "draft",
  "dueDate": "2026-11-01",
  "paymentLinkId": "uuid"
}
```

> `amount` is sent as a string and parsed to integer (paise/cents).

**Response `201`**
```json
{
  "status": "success",
  "service": "invoice | create",
  "data": {
    "id": "uuid",
    "invoice_number": "INV-001",
    "title": "Web Design - October",
    "client_id": "uuid",
    "amount_minor": 150000,
    "currency": "INR",
    "status": "draft",
    "due_date": "2026-11-01T00:00:00Z",
    "created_at": "..."
  }
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| `400` | Validation failed |
| `404` | Client not found |

---

### `GET /invoice/:id` 🔒

Get a single invoice by ID.

**Response `200`** — invoice object. `404` if not found.

---

### `GET /invoice/client/:clientId` 🔒

List all invoices for a client. Supports optional status filter.

**Query Parameters**

| Param | Type | Notes |
|-------|------|-------|
| `status` | `string` | Filter by `draft`, `pending`, `paid`, `failed`, `expired` |

**Example:** `GET /invoice/client/uuid?status=pending`

---

### `PATCH /invoice/:id` 🔒

Update an invoice.

**Request Body** _(all optional)_
```json
{
  "title": "Updated Title",
  "description": "...",
  "amount": "200000",
  "currency": "USD",
  "status": "pending",
  "paymentLinkId": "uuid",
  "dueDate": "2026-12-01"
}
```

---

### `DELETE /invoice/:id` 🔒

Delete an invoice.

---

### `POST /invoice/notify/:id` 🔒

Send the invoice to the client's email via Courier.

**Response `200`**
```json
{ "status": "success", "service": "invoice | notify", "data": { ... } }
```

**Errors**

| Status | Condition |
|--------|-----------|
| `404` | Invoice not found |
| `404` | Client not found |
| `400` | Client has no email address |
| `500` | Email delivery failed |

---

## Webhooks

### `POST /webhook` 🔒

Register a webhook endpoint with a payment provider. The SDK auto-constructs the inbound URL.

**Request Body**
```json
{
  "providerId": "uuid",
  "companyId": "uuid",
  "events": ["payment.captured", "payment_link.paid"],
  "alert_email": "admin@company.com"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `providerId` | ✅ | UUID of the `providers` row |
| `companyId` | ✅ | UUID of the company |
| `events` | ✅ | Minimum 1 provider event name |
| `alert_email` | ❌ | Alert email for failed events |

**Response `201`**
```json
{
  "status": "success",
  "service": "webhook | create",
  "data": {
    "id": "uuid",
    "url": "http://yourserver/api/v1/webhook/companyId/stripe/secret",
    "provider": "stripe",
    "created_at": "..."
  }
}
```

---

### `POST /webhook/:companyId/:provider/:secret` — **Public**

Inbound webhook endpoint called by the payment provider. No authentication required.

- Matches the `webhook_endpoints` row by full URL.
- Persists the raw payload to `webhook_events`.

**Response `201`**
```json
{ "status": "success", "service": "webhook | handler", "data": { ... } }
```

**Errors**

| Status | Condition |
|--------|-----------|
| `404` | Endpoint URL not found in DB |

---

### `GET /webhook/:companyId/:provider` 🔒

List all registered webhook endpoints for a company + provider combination.

**Response `200`**
```json
{
  "status": "success",
  "service": "webhook | fetch",
  "data": [ { "id": "uuid", "url": "...", "provider": "stripe", ... } ]
}
```

---

### `GET /webhook/event/logs/:webhookEndpointId` 🔒

Retrieve event logs for a specific webhook endpoint.

**Response `200`**
```json
{
  "status": "success",
  "service": "webhook | logs",
  "data": [
    {
      "id": "uuid",
      "webhook_endpoint_id": "uuid",
      "payload": { ... },
      "received_at": "..."
    }
  ]
}
```

---

## Transactions

> [!NOTE]
> The transactions module is reserved for future implementation.

`GET /transaction`, `POST /transaction`, etc. — endpoints are registered but controllers are not yet implemented.

---

## Error Codes & HTTP Status Map

| HTTP Status | Meaning |
|-------------|---------|
| `200` | Success (GET, PATCH, DELETE, some POST) |
| `201` | Created |
| `400` | Validation error / bad input |
| `401` | Missing or invalid auth token |
| `403` | Insufficient role / permissions |
| `404` | Resource not found |
| `409` | Conflict (duplicate resource) |
| `500` | Internal server error |

### PaymentError Codes (from core SDK)

| Code | Meaning | Retryable |
|------|---------|-----------|
| `AUTHENTICATION_ERROR` | Invalid API credentials | ❌ |
| `INVALID_REQUEST` | Malformed request to provider | ❌ |
| `CARD_DECLINED` | Card was declined | ❌ |
| `INSUFFICIENT_FUNDS` | Insufficient balance | ❌ |
| `RATE_LIMIT` | Provider rate limit hit | ✅ |
| `PROVIDER_ERROR` | Generic provider error | ✅ |
| `NETWORK_ERROR` | Connection to provider failed | ✅ |

---

## Route Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/login` | Public | Login |
| `POST` | `/auth/refresh` | Cookie | Refresh access token |
| `POST` | `/auth/logout` | Cookie | Logout |
| `POST` | `/user` | Public | Register |
| `GET` | `/user` | 🔒 | Get own profile |
| `PATCH` | `/user/:id` | 🔒 | Update user |
| `DELETE` | `/user/:id` | 🔒 | Delete user |
| `POST` | `/company` | 🔒 | Create company |
| `GET` | `/company` | 🔒 | List own companies |
| `GET` | `/company/:id` | 🔒 | Get company |
| `PATCH` | `/company/:id` | 🔒 | Update company |
| `DELETE` | `/company/:id` | 🔒 | Delete company |
| `POST` | `/service` | 🔒 | Create service |
| `GET` | `/service/company/:companyId` | 🔒 | List services |
| `GET` | `/service/:id` | 🔒 | Get service |
| `PATCH` | `/service/:id` | 🔒 | Update service |
| `DELETE` | `/service/:id` | 🔒 | Delete service |
| `POST` | `/client` | 🔒 | Create client |
| `GET` | `/client/:id` | 🔒 | Get client |
| `GET` | `/client/service/:serviceId` | 🔒 | List clients |
| `PATCH` | `/client/:id` | 🔒 | Update client |
| `DELETE` | `/client/:id` | 🔒 | Delete client |
| `POST` | `/provider` | 🔒 | Register provider |
| `GET` | `/provider/:id` | 🔒 | Get provider |
| `GET` | `/provider/company/:companyId` | 🔒 | List providers |
| `PATCH` | `/provider/:id` | 🔒 | Update credentials |
| `DELETE` | `/provider/:id` | 🔒 | Delete provider |
| `POST` | `/payment-link` | 🔒 | Create payment link |
| `GET` | `/payment-link/:id` | 🔒 | Get payment link |
| `GET` | `/payment-link/company/:companyId` | 🔒 | List payment links |
| `PATCH` | `/payment-link/:id` | 🔒 | Update payment link |
| `DELETE` | `/payment-link/:id` | 🔒 | Delete payment link |
| `GET` | `/payment-link/callback` | Public | Payment callback |
| `POST` | `/invoice` | 🔒 | Create invoice |
| `GET` | `/invoice/:id` | 🔒 | Get invoice |
| `GET` | `/invoice/client/:clientId` | 🔒 | List invoices |
| `PATCH` | `/invoice/:id` | 🔒 | Update invoice |
| `DELETE` | `/invoice/:id` | 🔒 | Delete invoice |
| `POST` | `/invoice/notify/:id` | 🔒 | Email invoice to client |
| `POST` | `/webhook` | 🔒 | Register webhook |
| `POST` | `/webhook/:companyId/:provider/:secret` | Public | Inbound event |
| `GET` | `/webhook/:companyId/:provider` | 🔒 | List endpoints |
| `GET` | `/webhook/event/logs/:webhookEndpointId` | 🔒 | Event logs |

---

## Health Check

```
GET /                    → 200 "Server is running !"
GET /api/v1/health       → 200 "Server api-v1 is running !"
```
