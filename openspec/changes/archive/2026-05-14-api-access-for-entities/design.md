## Context

Faktura is a multi-tenant Next.js 15 app. Data access today happens through:
- **`lib/data.ts`** — central fetch functions (`fetchCustomers`, `fetchInvoices`, etc.) used by UI Server Components
- **`lib/actions/`** — Server Actions for mutations
- **`app/api/`** — Next.js Route Handlers used by the UI for client-side reads

All queries are tenant-scoped via `getTenantObjectId()` which reads the `x-tenant-id` request header injected by Auth0/NextAuth middleware.

The goal is to expose read-only REST endpoints that external callers can use with an API key, while reusing the existing `lib/data.ts` fetch functions so the query logic is not duplicated.

## Goals / Non-Goals

**Goals:**
- Read-only REST API (`GET` list + `GET` by ID) for: invoices, customers, repairs, products, returns, wanted
- API key model: generate, list, revoke — scoped per tenant
- Middleware that validates a Bearer token API key and synthesizes the `x-tenant-id` header so downstream code needs no changes
- Reuse existing `lib/data.ts` fetch functions from both UI code and API routes

**Non-Goals:**
- Write operations (POST/PUT/DELETE) via the public API
- Per-key permission scopes or rate limiting (future work)
- OAuth / JWT-based API auth (API keys are sufficient for the use case)
- Webhook delivery or push-based integrations

## Decisions

### Decision 1: Reuse `lib/data.ts` fetch functions directly

**Rationale:** `lib/data.ts` already has tenant-scoped, paginated fetch functions for all entities. Rather than duplicating query logic in new route handlers, the API routes call the same functions.

The only prerequisite is that these functions rely on `getTenantObjectId()`, which reads request headers. API routes run inside Next.js Route Handlers where `headers()` is available, so this works without modification — as long as the API auth middleware sets `x-tenant-id` before the handler runs.

**Alternative considered:** Extract query logic into a separate service layer (`lib/services/`). This is cleaner architecturally but is extra indirection for a read-only feature. We can refactor to a service layer later if write operations are added.

### Decision 2: API keys stored as hashed values (SHA-256)

**Rationale:** The raw key is shown to the user once at creation and never stored in plaintext. The database stores only the SHA-256 hash. On each request the incoming Bearer token is hashed and compared. This limits blast radius if the database is compromised.

**Alternative considered:** bcrypt hashing. Too slow for per-request verification (API keys are high-frequency). SHA-256 is appropriate here since API keys are already high-entropy random strings (not user passwords).

### Decision 3: API key middleware injects `x-tenant-id` header

**Rationale:** `getTenantObjectId()` in `lib/tenant-utils.ts` reads `x-tenant-id` from request headers. Rather than changing that function, the API key middleware resolves the tenantId from the ApiKey document and sets `x-tenant-id` before calling `next()`. This means zero changes to existing fetch functions.

**Alternative considered:** Pass tenantId as a function parameter. Would require touching every call site in `lib/data.ts` — higher diff, higher regression risk.

### Decision 4: API routes live under `/api/v1/` separate from existing `/api/` routes

**Rationale:** Existing routes are session-authenticated and used by the UI. Mixing them with API-key-authenticated routes risks confusion and auth conflicts. Versioning from the start (`/v1/`) allows a future `/v2/` without breaking existing integrations.

### Decision 5: `ApiKey` model stores tenantId as ObjectId reference

**Rationale:** Consistent with all other models. The middleware does a single `ApiKey.findOne({ keyHash })` lookup which returns the `tenantId` — then sets the header.

## Risks / Trade-offs

- **SHA-256 collision risk** → negligible for 256-bit random keys; non-issue in practice
- **`lib/data.ts` functions may not support all query params needed by API consumers** → initially expose the same `page`/`limit`/`search` params the UI uses; document them in the route
- **`getTenantObjectId()` reads from headers — header injection risk** → only the API key middleware (server-side) sets this header on `/api/v1/` routes; Next.js middleware runs before route handlers, so client cannot spoof it
- **`lib/data.ts` has no stable public contract** → changes to internal fetch functions could silently break API responses; mitigated by the spec scenarios acting as regression tests

## Migration Plan

1. Add `ApiKey` model and migration is additive (new collection)
2. Deploy API key management UI — users can start creating keys
3. Deploy `/api/v1/` routes — no impact on existing routes
4. No rollback complexity; new routes can be disabled by removing the files

## Open Questions

- Should list endpoints support cursor-based pagination in addition to offset (`page`/`limit`)? Current UI uses offset — keep consistent for now.
- Should API keys have an optional expiry date field? Low-cost to add at the model level even if not enforced initially.
