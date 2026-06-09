## ADDED Requirements

### Requirement: Tenant AvaTax configuration

A tenant SHALL be able to store AvaTax credentials and a per-tenant `enabled` flag on their tenant record so the system can calculate tax on the tenant's behalf. The configuration MUST include AvaTax `username` (the value passed as the SDK's `withSecurity({ username })` — accepts either a portal username or numeric account id), `password` (the value passed as `withSecurity({ password })` — accepts either a portal password or a license key), `environment` (`sandbox` or `production`), the `enabled` flag, and an optional `companyCode` (defaulting to `DEFAULT` when blank, matching the prior hardcoded behavior). The password MUST be stored encrypted at rest using the same AES-256-GCM scheme that protects Stripe secrets, and MUST never be returned to the browser after it is saved. Only tenant administrators SHALL be able to view the settings UI or change these values.

#### Scenario: Admin saves AvaTax credentials
- **WHEN** a tenant admin enters a valid AvaTax username, password, and environment (with company code optional) on the AvaTax settings form and submits it
- **THEN** the password is encrypted and persisted on the tenant record, the `enabled` flag defaults to `true`, and subsequent loads of the form show a masked placeholder (e.g. `••••${last4}`) instead of the cleartext password.

#### Scenario: Admin omits company code
- **WHEN** a tenant admin saves AvaTax settings without entering a company code
- **THEN** the save succeeds, the stored `companyCode` is left unset, and subsequent AvaTax transactions are submitted with `companyCode: 'DEFAULT'`.

#### Scenario: Non-admin cannot see AvaTax settings
- **WHEN** a non-admin user navigates to the tenant settings page
- **THEN** the AvaTax section is not rendered and the underlying server actions reject any write attempt.

#### Scenario: Admin disables AvaTax without deleting credentials
- **WHEN** a tenant admin toggles AvaTax off
- **THEN** the stored credentials are retained but `enabled` is `false`, and no tax-calculation calls are made for new invoices until it is re-enabled.

#### Scenario: Admin clears AvaTax credentials
- **WHEN** a tenant admin clicks "Remove AvaTax credentials"
- **THEN** the encrypted password, username, and company code are cleared from the tenant record and `enabled` is set to `false`.

#### Scenario: Save form probes credentials
- **WHEN** a tenant admin saves new AvaTax credentials
- **THEN** the system invokes AvaTax's authenticated `ping()` endpoint with the supplied credentials before persisting them, and rejects the form submission with a clear error if AvaTax returns a non-2xx response or `authenticated: false`.

### Requirement: Tax calculation gated by tenant AvaTax flag

`calcTax` SHALL return `0` immediately, without calling AvaTax or applying any manual fallback (including the hardcoded Texas 8.25% rate), whenever the invoice's tenant does not have `avatax.enabled === true` AND a fully-configured `avatax` sub-document. When `avatax.enabled === true`, `calcTax` SHALL build an AvaTax client from the tenant's stored credentials and proceed with calculation as before, preserving the existing short-circuits: invoices marked `taxExempt`, missing `shipState`, `methodOfSale === 'Ebay'`, and `shipState === 'TX'` (manual 8.25%) MUST NOT result in an AvaTax SDK call. Tax calculation MUST NOT read from `process.env.AVATAX_*` for any value.

#### Scenario: AvaTax-disabled tenant saves an invoice
- **WHEN** `upsertInvoice` runs for a tenant whose `avatax.enabled` is missing or `false`
- **THEN** `calcTax` returns `0` without any AvaTax SDK call and the invoice is saved with `tax: 0`.

#### Scenario: AvaTax-enabled tenant in Texas
- **WHEN** `upsertInvoice` runs for an `avatax.enabled` tenant where the invoice's `shipState` is `TX`
- **THEN** the manual 8.25% rate is applied to the subtotal (no AvaTax SDK call is made).

#### Scenario: AvaTax-enabled tenant selling on eBay
- **WHEN** `upsertInvoice` runs for an `avatax.enabled` tenant on an invoice whose `methodOfSale` is `Ebay`
- **THEN** `calcTax` returns `0` without an AvaTax SDK call (eBay acts as marketplace facilitator).

#### Scenario: AvaTax-enabled tenant with tax-exempt invoice
- **WHEN** `upsertInvoice` runs for an `avatax.enabled` tenant on an invoice marked `taxExempt: true`
- **THEN** `calcTax` returns `0` without an AvaTax SDK call.

#### Scenario: AvaTax-enabled tenant with missing ship-to state
- **WHEN** `upsertInvoice` runs for an `avatax.enabled` tenant on an invoice with no `shipState`
- **THEN** `calcTax` returns `0` without an AvaTax SDK call (existing behavior preserved).

#### Scenario: AvaTax credentials missing despite enabled flag
- **WHEN** `upsertInvoice` runs for a tenant whose `avatax.enabled` is `true` but whose credential fields are not fully populated
- **THEN** `calcTax` returns `0`, the invoice is saved with `tax: 0`, and a structured warning is logged with the tenant id.

### Requirement: Tax-exempt UI gated by tenant AvaTax flag

The invoice form SHALL render the "Tax exempt" checkbox only when the current tenant has `avatax.enabled === true`. When AvaTax is disabled for the tenant, the checkbox MUST NOT appear and any existing `taxExempt` value on the invoice MUST be preserved silently (not flipped, not surfaced).

#### Scenario: Avatax-disabled tenant opens the invoice form
- **WHEN** an admin or salesperson loads the invoice create or edit form for a tenant whose `avatax.enabled` is `false`
- **THEN** the "Tax exempt" checkbox is absent from the form.

#### Scenario: Avatax-enabled tenant opens the invoice form
- **WHEN** an admin or salesperson loads the invoice create or edit form for a tenant whose `avatax.enabled` is `true`
- **THEN** the "Tax exempt" checkbox is rendered and toggles `taxExempt` as today.

### Requirement: AVATAX_* environment variables removed

After this change, the application MUST NOT read AvaTax credentials, environment, or company information from `process.env`. The keys `AVATAX_APP_NAME`, `AVATAX_APP_VERSION`, `AVATAX_ENVIRONMENT`, `AVATAX_MACHINE_NAME`, `AVATAX_USERNAME`, `AVATAX_PASSWORD` MUST be removed from `.env.example` and any documentation that referenced them MUST be updated.

#### Scenario: Grep finds no AVATAX_ env reads
- **WHEN** the codebase is searched for `process.env.AVATAX`
- **THEN** there are zero matches in non-archive paths.

#### Scenario: .env.example no longer mentions AvaTax
- **WHEN** the project's `.env.example` is read
- **THEN** none of the `AVATAX_*` keys appear in it.
