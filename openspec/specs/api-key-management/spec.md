## ADDED Requirements

### Requirement: User can generate an API key
An authenticated user SHALL be able to generate a new API key for their tenant. The system SHALL display the raw key exactly once at creation time and MUST NOT store or re-display it afterward. Each key SHALL have a human-readable name/label provided by the user. The system SHALL store only the SHA-256 hash of the raw key.

#### Scenario: Successful key generation
- **WHEN** a logged-in user submits the "Create API Key" form with a non-empty label
- **THEN** the system generates a cryptographically random 32-byte key, encodes it as hex, stores the SHA-256 hash in the ApiKey collection with the tenant's `tenantId`, and returns the raw key to the client exactly once

#### Scenario: Raw key shown only once
- **WHEN** the key creation response is dismissed or the page is refreshed
- **THEN** the raw key is no longer retrievable from the UI or API

#### Scenario: Empty label rejected
- **WHEN** a user submits the form with a blank label
- **THEN** the system returns a validation error and does not create a key

### Requirement: User can list their API keys
An authenticated user SHALL be able to see all active API keys for their tenant. The list SHALL show the key label, creation date, and last-used date (if any). The list SHALL NOT show the raw key or its hash.

#### Scenario: Keys listed for tenant
- **WHEN** a logged-in user navigates to the API keys settings page
- **THEN** only API keys belonging to that user's tenant are shown

#### Scenario: Empty state
- **WHEN** no API keys have been created
- **THEN** the page shows an empty state message prompting the user to create their first key

### Requirement: User can revoke an API key
An authenticated user SHALL be able to revoke (delete) any API key belonging to their tenant. Revoked keys SHALL immediately become invalid for API requests.

#### Scenario: Successful revocation
- **WHEN** a user confirms deletion of a key
- **THEN** the ApiKey document is deleted and subsequent API requests using that key return 401

#### Scenario: Cannot revoke another tenant's key
- **WHEN** a user attempts to delete a key ID that belongs to a different tenant
- **THEN** the system returns a 404 (does not confirm or deny the key exists)
