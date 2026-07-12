# PayHub — Product Design Document

## 1. Overview

PayHub is a multi-tenant SaaS platform that gives companies a unified API layer over multiple payment providers (Stripe, Razorpay, etc.). This document defines the page structure, layout, components, and interaction patterns for the web app.

**Design language reference:** Supabase-style dashboard (organization switcher, card-grid project list, clean sidebar nav, monospace for keys/IDs).

**Assumed stack:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, PostgreSQL/Supabase backend.

---

## 2. Design Principles

1. **Multi-tenant first** — every dashboard screen is scoped to a company; switching context should never require a full page reload.
2. **Progressive disclosure** — landing page sells the product in one screen; dashboard reveals complexity as the user drills down (company → services → providers).
3. **Consistency with dev tooling** — API keys, IDs, and webhook payloads use monospace and are always copy-able and maskable.
4. **Safe by default** — destructive actions (revoke key, delete provider) always require confirmation and show blast radius.
5. **Empty states matter** — new companies/services should teach the user what to do next, not just show blank grids.

---

## 3. Design Tokens

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#0B0D10` (dark) / `#FAFAFA` (light) | App background |
| `--color-surface` | `#141619` / `#FFFFFF` | Cards, panels |
| `--color-border` | `#242830` / `#E5E7EB` | Dividers, card borders |
| `--color-primary` | `#4F7CFF` | CTAs, links, active states |
| `--color-success` | `#2ECC71` | Active service/key status |
| `--color-warning` | `#F5A623` | Expiring key, degraded provider |
| `--color-danger` | `#E5484D` | Revoke, delete, failed webhook |
| `--font-sans` | Inter | UI text |
| `--font-mono` | JetBrains Mono | API keys, IDs, code snippets |
| Radius | `8px` (cards), `6px` (buttons/inputs) | |
| Grid gutter | `24px` desktop / `16px` mobile | |

---

## 4. Route Map

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/dashboard` | Company-scoped home (breadcrumb switcher + services grid) |
| `/dashboard/companies` | Grid list of all companies user belongs to |
| `/dashboard/company/:id/services` | List of services under a company |
| `/dashboard/services/:id` | Service detail + provider config overview |
| `/dashboard/services/:id/providers` | Detailed provider list — edit/delete |
| `/dashboard/company/:id/api-keys` | API key management |
| `/dashboard/api-docs` | API reference & integration guide |

---

## 5. Page-by-Page Specs

### 5.1 `/` — Landing Page

**Layout:** Single-column, full-bleed hero, marketing sections below fold.

- **Nav bar:** Logo (left), links (Docs, Pricing, Blog — optional), CTA button (right): `Login` if signed out, `Dashboard` if signed in.
- **Hero section:**
  - Eyebrow tag: "Unified Payments API"
  - H1: value prop (e.g., "One API. Every payment provider.")
  - Subheading: 1–2 lines explaining Stripe + Razorpay abstraction
  - Primary CTA button: `Go to Dashboard` (signed in) or `Get Started` → signup (signed out)
  - Secondary CTA: `View Docs` (ghost button) → `/dashboard/api-docs` or public docs
  - Visual: code snippet card showing a single PayHub API call routing to two providers
- **Below fold (optional, can stub for v1):** logos/social proof, feature grid (3–4 cards: Multi-provider, Webhooks unified, Secure key vault, Multi-tenant orgs), how-it-works steps, final CTA banner.
- **Footer:** minimal — links, copyright.

**States:** signed-out vs signed-in nav/CTA swap is the only dynamic logic on this page.

---

### 5.2 `/dashboard` — Company Home

**Layout:** Sidebar + top breadcrumb bar + main grid.

- **Top bar:**
  - **Breadcrumb / company switcher** (Supabase-style dropdown pill): shows current company name + avatar/initials, click opens dropdown listing all companies (searchable if >5) with a "View all companies" link to `/dashboard/companies` and a "+ New company" action at the bottom.
  - Right side: user avatar menu (profile, theme toggle, logout).
- **Sidebar (persistent across all `/dashboard/*` routes):**
  - Home
  - Services
  - API Keys
  - API Docs
  - Settings (optional)
- **Main content — Services grid for the active company:**
  - Grid of cards (3 columns desktop, 1 column mobile), one per service.
  - Each card: service name, provider badges (Stripe/Razorpay icons), status dot (active/degraded/inactive), last transaction timestamp, mini stat (e.g., requests today).
  - Clicking a card → `/dashboard/services/:id`.
  - "+ New service" card as the last grid item (dashed border, plus icon).
- **Empty state:** if company has zero services — centered illustration + "Create your first service" CTA.

---

### 5.3 `/dashboard/companies` — Companies Grid

**Layout:** Same sidebar shell is optional here (can be a top-level page without company-scoped sidebar, since no company is selected yet) — recommend keeping the sidebar but only showing "Companies" + "API Docs" until a company is selected.

- **Header:** "Companies" title + "+ New Company" button (top right).
- **Search/filter bar:** search by name, sort (recently active / alphabetical).
- **Grid of company cards** (Supabase org-card style):
  - Company logo/initials avatar
  - Company name
  - Plan/tier badge (if applicable)
  - Member count, service count
  - Role badge for current user (Owner/Admin/Member)
  - Entire card clickable → `/dashboard` scoped to that company (sets active company context) → then naturally to `/dashboard/company/:id/services`.
- **Empty state:** "Create your first company" with brief onboarding copy.
- **New Company flow:** modal or slide-over — name, slug, optional logo upload.

---

### 5.4 `/dashboard/company/:id/services` — Services List (per company)

Effectively the same grid component as 5.2's main content, but explicitly scoped and reachable directly by URL/id (used when navigating from the companies grid rather than the switcher).

- Breadcrumb: `Companies / {Company Name} / Services`
- Same service card grid as `/dashboard`.
- Filter/sort bar: by status (active/inactive/degraded), by provider.
- "+ New Service" opens a modal: service name, description, initial provider(s) to attach.

---

### 5.5 `/dashboard/services/:id` — Service Detail

**Layout:** Header + tabbed or sectioned body.

- **Header:**
  - Breadcrumb: `Companies / {Company} / Services / {Service Name}`
  - Service name (editable inline), status toggle (active/paused), status dot.
  - Action buttons: `Edit`, `Delete Service` (danger, requires confirm dialog with typed service name).
- **Overview section (cards):**
  - Connected providers summary (chips: Stripe ✓ configured, Razorpay ⚠ needs webhook secret) → link to Providers tab.
  - Key metrics: requests (24h/7d), success rate, last webhook received.
  - Recent activity/log table (last 10 transactions/events) with status, provider, amount, timestamp.
- **Config section:**
  - Default currency, routing rule (e.g., "Stripe primary, Razorpay fallback"), webhook endpoint URL (copyable), environment (test/live) toggle.
- **Tabs or anchor nav within page:** Overview | Providers | Logs | Settings
  - "Providers" tab links out to full page `/dashboard/services/:id/providers` for detailed management (or can be embedded — recommend linking to keep this page scannable).

---

### 5.6 `/dashboard/services/:id/providers` — Providers Detail

**Layout:** Breadcrumb + list/table of providers with expandable rows or per-provider cards.

- **Breadcrumb:** `Companies / {Company} / Services / {Service} / Providers`
- **Header:** "+ Add Provider" button → modal to select provider type (Stripe/Razorpay) and enter credentials.
- **Provider list** — one row/card per connected provider:
  - Provider logo + name
  - Status badge (Connected / Needs attention / Disabled)
  - Masked credential preview (e.g., `sk_live_••••••4f2a`)
  - Priority/order control (drag handle, for fallback routing)
  - Last used timestamp
  - Row actions: `Edit`, `Test connection`, `Disable`, `Delete` (kebab menu)
- **Edit provider (slide-over/modal):**
  - Form fields per provider type (API key, secret key, webhook signing secret)
  - "Reveal" toggle (requires re-auth or short-lived confirm) before showing full secret
  - `Save` / `Test Connection` (calls a sandbox ping) / `Cancel`
- **Delete provider:** confirm dialog — warn if it's the only active provider for the service, block or warn accordingly.
- **Empty state:** "No providers connected yet — add Stripe or Razorpay to start processing payments."

---

### 5.7 `/dashboard/company/:id/api-keys` — API Key Management

**Layout:** Breadcrumb + table, Supabase-style key management.

- **Breadcrumb:** `Companies / {Company} / API Keys`
- **Header:** "+ Generate New Key" button.
- **Environment toggle:** Test / Live (keys are scoped per environment; live keys have extra confirm friction).
- **Keys table:**
  | Name | Key (masked) | Scope | Created | Last used | Status | Actions |
  - Masked key with `Copy` icon (copies full key only immediately after generation — never again after that).
  - Scope badges (read-only / full access / webhook-only, if scoped keys are supported).
  - Status: Active / Revoked (revoked rows greyed out, kept for audit trail).
  - Row actions: `Rename`, `Revoke` (danger, confirm dialog), and for expiring keys a `Rotate` action.
- **Generate New Key modal:**
  - Name/label input, scope selector, expiration (never / 30d / 90d / custom).
  - On submit: **one-time reveal screen** showing the full secret with a copy button and a clear warning: "This key won't be shown again."
- **Revoke flow:** confirm dialog stating which services/integrations may break; requires typing key name or clicking a "I understand" checkbox.
- **Empty state:** "No API keys yet — generate one to start integrating."

---

### 5.8 `/dashboard/api-docs` — API Documentation

**Layout:** Two/three-column docs layout (left nav of endpoints, center content, optional right-side "on this page" anchor nav).

- **Left sidebar:** grouped endpoint list — Authentication, Payments (Create, Get, Refund), Webhooks, Providers, Companies, API Keys.
- **Center content per endpoint:**
  - Method + path (e.g., `POST /v1/payments`)
  - Description
  - Request parameters table (name, type, required, description)
  - Response schema/example (code block, monospace)
  - Error codes table
- **Right rail:** language tabs for code samples (cURL, Node.js, Python) with copy button; auto-injects the user's own test API key if logged in (masked by default, "Show key" toggle).
- **Top of page:** Getting Started guide — auth header format, base URL, environment (test vs live), rate limits.
- **Search bar** at top of the docs sidebar to filter endpoints.

---

## 6. Shared Components

| Component | Used in | Notes |
|---|---|---|
| `CompanySwitcher` | Top bar, all `/dashboard/*` | Dropdown, searchable, shows role per company |
| `Sidebar` | All `/dashboard/*` | Collapsible on mobile → bottom nav or hamburger drawer |
| `Breadcrumb` | All nested dashboard pages | Auto-generated from route segments, last segment editable where relevant (service name) |
| `EntityCard` | Companies grid, Services grid | Variant prop controls icon/badges shown |
| `StatusBadge` | Services, Providers, Keys | Color-coded: green/amber/red/grey |
| `MaskedSecret` | Providers, API Keys | Shows last 4 chars, copy button, reveal-once pattern |
| `ConfirmDangerDialog` | Delete/Revoke actions everywhere | Requires typed confirmation for high-risk actions (delete company/service) |
| `DataTable` | API Keys, Logs, Providers | Sortable columns, row actions via kebab menu |
| `EmptyState` | Every list/grid page | Icon + short copy + primary CTA |
| `CodeBlock` | API Docs, Landing hero | Syntax highlighted, copy button, language switcher |

---

## 7. Navigation & Context Rules

- Active company is stored in a global context (e.g., URL param or cookie) so refreshing any `/dashboard/*` page retains the selected company.
- Switching company via `CompanySwitcher` navigates to the equivalent scoped route (e.g., staying on "Services" but changing company id) rather than always resetting to `/dashboard`.
- Breadcrumbs are always clickable back to any ancestor level.

## 8. Responsive Behavior

- Sidebar collapses to icon-only rail ≥768px, hidden behind hamburger drawer <768px.
- Grids: 3-col → 2-col (tablet) → 1-col (mobile).
- Tables (API Keys, Providers, Logs) convert to stacked cards on mobile with the same row actions in a kebab menu.

## 9. Open Questions / Future Considerations

- Role-based permissions per company (Owner/Admin/Member) — which actions are gated?
- Audit log page for revoked keys / deleted providers?
- Billing/usage page (likely `/dashboard/company/:id/billing`) — not in current scope but should reserve nav slot.