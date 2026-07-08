Here's a lean MVP — only what you need to get first clients live and charging.One service, one database, three connectors. No Kafka, no Redis, no microservices. Now the schema:5 tables. That's the whole MVP data model. Here's the raw Mermaid:

```mermaid
erDiagram
  TENANTS {
    uuid id PK
    string name
    string api_key_hash
    timestamp created_at
  }
  CREDENTIALS {
    uuid id PK
    uuid tenant_id FK
    string provider
    string environment
    text ciphertext
    string status
    timestamp created_at
  }
  PAYMENTS {
    uuid id PK
    uuid tenant_id FK
    string provider
    string provider_txn_id
    bigint amount
    string currency
    string status
    string error_code
    jsonb metadata
    timestamp created_at
    timestamp updated_at
  }
  PAYMENT_ATTEMPTS {
    uuid id PK
    uuid payment_id FK
    string provider
    string status
    int attempt_number
    jsonb provider_response
    timestamp created_at
  }
  WEBHOOKS {
    uuid id PK
    uuid tenant_id FK
    string provider
    string event_type
    jsonb raw_payload
    string status
    timestamp received_at
  }

  TENANTS ||--o{ CREDENTIALS : "has"
  TENANTS ||--o{ PAYMENTS : "owns"
  PAYMENTS ||--o{ PAYMENT_ATTEMPTS : "has"
  TENANTS ||--o{ WEBHOOKS : "receives"
```

What's cut from the full design and why:

`ROUTING_RULES` — hardcode currency → provider in config for now. You don't need a DB-driven rule engine until you have clients with conflicting routing needs. `REFUNDS` — store refunds as a `metadata` field on `PAYMENTS` with `status: refunded` until a client actually asks for refund history. `DISPUTES` — handle manually via provider dashboards for your first 10 clients. `SETTLEMENTS` — query provider APIs directly for now; build reconciliation once you have clients asking "where's my money." `AUDIT_LOG` — Postgres's built-in `created_at` timestamps cover you for MVP; a separate audit table comes with your first enterprise client.

The one thing not to cut even at MVP: `PAYMENT_ATTEMPTS`. The moment you have retry/failover logic, you need this table or debugging failed payments becomes impossible.

For the credential vault at MVP — use AES-256-GCM with a master key in an environment variable (not hardcoded). It's not as robust as KMS but it's good enough to launch. Migrate to KMS before your first client who asks about your security posture.

Stack recommendation for MVP: Node.js (Fastify) or Python (FastAPI), Postgres on Railway or Supabase, deploy on Railway or Render. You can be live in under a week.