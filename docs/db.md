And the raw Mermaid if you want to paste it into docs or Notion:

```mermaid
erDiagram

  TENANTS {
    uuid id PK
    string name
    string slug
    string api_key_hash
    string plan
    timestamp created_at
    timestamp updated_at
  }

  CREDENTIALS {
    uuid id PK
    uuid tenant_id FK
    string provider
    string key_type
    string environment
    text encrypted_dek
    text ciphertext
    string kms_key_id
    string status
    timestamp rotated_at
    timestamp created_at
  }

  ROUTING_RULES {
    uuid id PK
    uuid tenant_id FK
    string currency
    string region
    string provider
    int priority
    jsonb conditions
    bool is_active
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
    string error_class
    jsonb metadata
    timestamp created_at
    timestamp updated_at
  }

  PAYMENT_ATTEMPTS {
    uuid id PK
    uuid payment_id FK
    string provider
    string provider_txn_id
    string status
    int attempt_number
    jsonb provider_request
    jsonb provider_response
    int latency_ms
    timestamp created_at
  }

  REFUNDS {
    uuid id PK
    uuid payment_id FK
    uuid tenant_id FK
    bigint amount
    string currency
    string status
    string provider_refund_id
    timestamp created_at
    timestamp updated_at
  }

  WEBHOOKS {
    uuid id PK
    uuid tenant_id FK
    string provider
    string event_type
    string unified_event_type
    jsonb raw_payload
    jsonb normalized_payload
    string status
    int retry_count
    timestamp received_at
    timestamp processed_at
  }

  DISPUTES {
    uuid id PK
    uuid payment_id FK
    uuid tenant_id FK
    string provider_dispute_id
    string reason
    string status
    bigint amount
    string currency
    timestamp due_by
    jsonb evidence
    timestamp created_at
    timestamp updated_at
  }

  AUDIT_LOG {
    uuid id PK
    uuid tenant_id FK
    string event_type
    string actor
    string resource_type
    uuid resource_id
    jsonb context
    string ip_address
    timestamp created_at
  }

  SETTLEMENTS {
    uuid id PK
    uuid tenant_id FK
    string provider
    string settlement_id
    bigint gross_amount
    bigint fee_amount
    bigint net_amount
    string currency
    string status
    date settlement_date
    timestamp created_at
  }

  TENANTS ||--o{ CREDENTIALS : "has"
  TENANTS ||--o{ ROUTING_RULES : "configures"
  TENANTS ||--o{ PAYMENTS : "owns"
  TENANTS ||--o{ WEBHOOKS : "receives"
  TENANTS ||--o{ AUDIT_LOG : "generates"
  TENANTS ||--o{ SETTLEMENTS : "receives"
  PAYMENTS ||--o{ PAYMENT_ATTEMPTS : "has"
  PAYMENTS ||--o{ REFUNDS : "has"
  PAYMENTS ||--o| DISPUTES : "may have"
```

A few design decisions worth calling out:

`PAYMENTS` vs `PAYMENT_ATTEMPTS` is the most important split. A single payment can have multiple attempts — first try fails on Stripe, auto-retried on Razorpay. The `PAYMENTS` table holds the canonical outcome; `PAYMENT_ATTEMPTS` holds every provider call with the raw request/response for debugging and reconciliation. Never collapse these into one table.

`amount` is stored as `bigint` in the smallest currency unit (paise, cents) — never a float. Floating point money is a class of bugs you never want to debug in production.

`WEBHOOKS` stores both `raw_payload` and `normalized_payload` — the raw because you need it for signature verification and audit; the normalized because downstream services should never have to re-parse provider-specific formats.

`CREDENTIALS` never stores plaintext — only `encrypted_dek` and `ciphertext` as discussed in the vault architecture. The `kms_key_id` field lets you track which KMS key version was used for each row, enabling key rotation without a big-bang re-encryption.

`AUDIT_LOG` should be in a separate Postgres instance with no `DELETE` or `UPDATE` grants — append-only enforced at the infrastructure level, not just application logic.

Want the indexes and partitioning strategy for this schema next, or the API spec?