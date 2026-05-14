## Why

Customers and integrators need programmatic access to Faktura data to build custom workflows, sync with external systems, and automate reporting—without using the web UI. Adding a REST API with API key authentication enables this while reusing existing business logic to keep the codebase DRY.

## What Changes

- New API key management: users can generate, view, and revoke API keys scoped to their tenant
- New REST API endpoints under `/api/v1/` for all main entities: GET list and GET by ID
- API key middleware that authenticates requests and injects tenant context
- Shared service layer extracted from existing actions so both the UI and API use the same data-access logic

## Capabilities

### New Capabilities

- `api-key-management`: Create, list, and revoke API keys tied to a tenant; keys are hashed before storage
- `public-rest-api`: Read-only REST endpoints (`GET /api/v1/invoices`, `/api/v1/customers`, `/api/v1/repairs`, `/api/v1/products`, `/api/v1/returns`, `/api/v1/wanted`) returning paginated JSON; individual item fetch by ID
- `api-authentication`: Bearer token middleware that validates API keys, resolves tenantId, and enforces tenant isolation on all `/api/v1/` routes

### Modified Capabilities

## Impact

- **New models**: `ApiKey` Mongoose/Zod schema (`lib/models/apiKey.ts`)
- **New routes**: `app/api/v1/[entity]/route.ts` files for each entity (invoices, customers, repairs, products, returns, wanted)
- **New middleware**: `lib/apiAuth.ts` for Bearer token validation
- **Refactored**: Existing query logic in `lib/actions/` lifted into reusable service functions so both Server Actions and the new API routes call the same layer
- **New UI**: API key management page under the dashboard settings
- **Dependencies**: No new external dependencies required
