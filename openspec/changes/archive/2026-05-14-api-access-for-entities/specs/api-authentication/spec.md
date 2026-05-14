## ADDED Requirements

### Requirement: API requests authenticated via Bearer token
All requests to `/api/v1/` routes SHALL be authenticated by providing the API key as a Bearer token in the `Authorization` header. The system SHALL hash the incoming token and look it up in the ApiKey collection. If found, the system SHALL resolve the `tenantId` and make it available to downstream handlers.

#### Scenario: Valid API key accepted
- **WHEN** a request to `/api/v1/` includes `Authorization: Bearer <valid-key>`
- **THEN** the middleware locates the matching ApiKey document, sets `x-tenant-id` to the key's tenantId, and allows the request to proceed

#### Scenario: Missing Authorization header rejected
- **WHEN** a request to `/api/v1/` has no `Authorization` header
- **THEN** the system returns `401 Unauthorized` with `{ "error": "API key required" }`

#### Scenario: Invalid or revoked key rejected
- **WHEN** a request to `/api/v1/` includes a Bearer token that does not match any active ApiKey
- **THEN** the system returns `401 Unauthorized` with `{ "error": "Invalid API key" }`

#### Scenario: Malformed Authorization header rejected
- **WHEN** a request includes an `Authorization` header that does not start with `Bearer `
- **THEN** the system returns `401 Unauthorized` with `{ "error": "API key required" }`

### Requirement: Tenant isolation enforced for all API routes
The system SHALL ensure that every API response contains only data belonging to the tenant associated with the provided API key. A key for tenant A SHALL never return data belonging to tenant B.

#### Scenario: Data scoped to key's tenant
- **WHEN** tenant A's API key is used to call `GET /api/v1/customers`
- **THEN** the response contains only customers where `tenantId` matches tenant A

#### Scenario: Cross-tenant access prevented
- **WHEN** a valid API key is used to request a specific resource by ID that belongs to a different tenant
- **THEN** the system returns `404 Not Found`

### Requirement: Last-used timestamp updated on successful authentication
The system SHALL update the `lastUsedAt` field on the ApiKey document each time a request is successfully authenticated.

#### Scenario: Timestamp updated on use
- **WHEN** a valid API key authenticates a request
- **THEN** the `lastUsedAt` field on the corresponding ApiKey document is updated to the current UTC time
