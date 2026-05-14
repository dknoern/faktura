## 1. ApiKey Data Model

- [x] 1.1 Create `lib/models/apiKey.ts` — Zod/Mongoose schema with fields: `label` (string), `keyHash` (string, indexed), `tenantId` (ObjectId ref Tenant), `createdAt` (Date), `lastUsedAt` (Date, optional)
- [x] 1.2 Export the Mongoose model and Zod type from `apiKey.ts`

## 2. API Key Generation Utility

- [x] 2.1 Create `lib/api-key-utils.ts` with `generateApiKey()` — returns `{ raw: string, hash: string }` using `crypto.randomBytes(32)` hex-encoded and SHA-256 hashed
- [x] 2.2 Add `hashApiKey(key: string): string` helper used by both generation and auth lookup

## 3. API Authentication Middleware

- [x] 3.1 Create `lib/apiAuth.ts` with `authenticateApiKey(request: NextRequest): Promise<{ tenantId: string } | NextResponse>` — extracts Bearer token, hashes it, looks up ApiKey, returns tenantId or 401 response
- [x] 3.2 Update `lastUsedAt` on the ApiKey document on each successful authentication
- [x] 3.3 Handle missing header, malformed header, and invalid/revoked key cases with appropriate 401 responses per spec

## 4. Public REST API Routes — List Endpoints

- [x] 4.1 Create `app/api/v1/customers/route.ts` — calls `fetchCustomers(page, limit, search)` from `lib/data.ts`, wraps result in `{ data, total, page, limit }` envelope
- [x] 4.2 Create `app/api/v1/invoices/route.ts` — calls `fetchInvoices(...)` from `lib/data.ts`
- [x] 4.3 Create `app/api/v1/repairs/route.ts` — calls `fetchRepairs(...)` from `lib/data.ts`
- [x] 4.4 Create `app/api/v1/products/route.ts` — calls `fetchProducts(...)` from `lib/data.ts`
- [x] 4.5 Create `app/api/v1/returns/route.ts` — calls fetch function for returns from `lib/data.ts`
- [x] 4.6 Create `app/api/v1/wanted/route.ts` — calls fetch function for wanted from `lib/data.ts`
- [x] 4.7 Each route handler: authenticate via `authenticateApiKey`, set `x-tenant-id` header on the request headers, call the fetch function, return JSON envelope; default `page=1`, `limit=20`

## 5. Public REST API Routes — Individual Item Endpoints

- [x] 5.1 Create `app/api/v1/customers/[id]/route.ts` — validate ObjectId, call `Customer.findOne({ _id, tenantId })`, return 404 if not found
- [x] 5.2 Create `app/api/v1/invoices/[id]/route.ts`
- [x] 5.3 Create `app/api/v1/repairs/[id]/route.ts`
- [x] 5.4 Create `app/api/v1/products/[id]/route.ts`
- [x] 5.5 Create `app/api/v1/returns/[id]/route.ts`
- [x] 5.6 Create `app/api/v1/wanted/[id]/route.ts`
- [x] 5.7 Add shared `isValidObjectId(id: string): boolean` helper in `lib/api-key-utils.ts` or `lib/utils.ts` and use it in all `[id]` routes

## 6. API Key Management — Server Actions

- [x] 6.1 Create `app/actions/api-key-actions.ts` with `createApiKey(label: string)` — generates key, stores hash+tenantId, returns raw key once
- [x] 6.2 Add `listApiKeys()` to `api-key-actions.ts` — returns all keys for current tenant (label, createdAt, lastUsedAt, id — no hash)
- [x] 6.3 Add `revokeApiKey(id: string)` to `api-key-actions.ts` — deletes key only if it belongs to current tenant (404 if not found or wrong tenant)

## 7. API Key Management UI

- [x] 7.1 Create `app/(dashboard)/settings/api-keys/page.tsx` — settings page listing API keys with a "Create Key" button
- [x] 7.2 Create `components/api-keys/api-keys-table.tsx` — table showing label, created date, last used date, revoke button
- [x] 7.3 Create `components/api-keys/create-api-key-dialog.tsx` — dialog with label input; on success shows the raw key in a copy-to-clipboard field with a warning that it won't be shown again
- [x] 7.4 Add a link to the API keys settings page in the dashboard navigation/settings area

## 8. Verification

- [ ] 8.1 Manually test: create a key, call `GET /api/v1/customers` with Bearer token, confirm tenant-scoped results
- [ ] 8.2 Manually test: revoke the key, confirm subsequent requests return 401
- [ ] 8.3 Manually test: request an ID belonging to a different tenant's data returns 404
- [ ] 8.4 Confirm existing UI routes (`/api/products`, `/api/customers`, etc.) are unaffected

