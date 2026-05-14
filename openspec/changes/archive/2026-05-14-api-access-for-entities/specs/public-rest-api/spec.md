## ADDED Requirements

### Requirement: List endpoint for each entity
The system SHALL provide `GET /api/v1/{entity}` endpoints for: `invoices`, `customers`, `repairs`, `products`, `returns`, `wanted`. Each endpoint SHALL return a paginated JSON response reusing the same fetch functions used by the UI (`lib/data.ts`).

#### Scenario: Successful list request
- **WHEN** an authenticated request is made to `GET /api/v1/customers?page=1&limit=20`
- **THEN** the system returns `200 OK` with `{ data: [...], total: N, page: 1, limit: 20 }`

#### Scenario: Default pagination applied
- **WHEN** an authenticated request omits `page` and `limit` parameters
- **THEN** the system defaults to `page=1` and `limit=20`

#### Scenario: Search parameter supported
- **WHEN** an authenticated request includes `?search=smith`
- **THEN** the system applies the same search logic as the UI (token-based regex on indexed fields) and returns matching results

#### Scenario: All six entities available
- **WHEN** authenticated requests are made to each of `/api/v1/invoices`, `/api/v1/customers`, `/api/v1/repairs`, `/api/v1/products`, `/api/v1/returns`, `/api/v1/wanted`
- **THEN** each returns `200 OK` with data scoped to the authenticated tenant

### Requirement: Individual item endpoint for each entity
The system SHALL provide `GET /api/v1/{entity}/{id}` endpoints that return a single resource by its MongoDB `_id`.

#### Scenario: Existing item returned
- **WHEN** an authenticated request is made to `GET /api/v1/customers/{validId}`
- **THEN** the system returns `200 OK` with the full resource document

#### Scenario: Item not found returns 404
- **WHEN** an authenticated request is made for an ID that does not exist in the tenant's data
- **THEN** the system returns `404 Not Found` with `{ "error": "Not found" }`

#### Scenario: Invalid ObjectId returns 400
- **WHEN** an authenticated request is made with a malformed (non-ObjectId) ID
- **THEN** the system returns `400 Bad Request` with `{ "error": "Invalid ID" }`

### Requirement: Consistent JSON response envelope
All `/api/v1/` list responses SHALL use a consistent envelope: `{ data: T[], total: number, page: number, limit: number }`. All single-item responses SHALL return the resource object directly. All error responses SHALL use `{ error: string }`.

#### Scenario: Error response shape
- **WHEN** any `/api/v1/` route returns a non-2xx status
- **THEN** the body is `{ "error": "<human-readable message>" }` with an appropriate HTTP status code

#### Scenario: List response shape
- **WHEN** a list endpoint returns successfully
- **THEN** the body includes `data` (array), `total` (integer), `page` (integer), `limit` (integer)

### Requirement: Non-authenticated routes unaffected
The system SHALL NOT modify authentication behavior for any existing routes outside `/api/v1/`. Existing UI-facing routes SHALL continue to use session-based auth.

#### Scenario: Existing routes unaffected
- **WHEN** a request is made to any route outside `/api/v1/` (e.g., `/api/products`)
- **THEN** the existing session-based auth behavior applies unchanged
