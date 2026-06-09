## ADDED Requirements

### Requirement: Tenant Stripe configuration

A tenant SHALL be able to store Stripe credentials on their tenant record so that Faktura can act on the tenant's behalf when creating payment links. The configuration MUST include a Stripe secret (restricted) API key and an `enabled` flag. The secret key MUST be stored encrypted at rest and MUST never be returned to the browser after it is saved. Only tenant administrators (users with permission to edit tenant settings today) SHALL be able to view the settings UI or change these values.

#### Scenario: Admin saves a Stripe secret key
- **WHEN** a tenant admin enters a valid Stripe restricted key in the Stripe settings form and submits it
- **THEN** the key is encrypted and persisted on the tenant record, the `enabled` flag defaults to `true`, and subsequent loads of the form show a masked placeholder (e.g. `sk_••••1234`) instead of the cleartext key.

#### Scenario: Non-admin cannot see Stripe settings
- **WHEN** a non-admin user navigates to the tenant settings page
- **THEN** the Stripe section is not rendered and the underlying server action rejects any write attempt.

#### Scenario: Admin disables Stripe without deleting the key
- **WHEN** a tenant admin toggles Stripe off
- **THEN** the stored credentials are retained but `enabled` is `false`, and no payment links are created for new invoices until it is re-enabled.

#### Scenario: Admin clears Stripe credentials
- **WHEN** a tenant admin clicks "Remove Stripe credentials"
- **THEN** the encrypted key is removed from the tenant record and `enabled` is set to `false`.

### Requirement: Payment link creation on invoice save

When an invoice is created or updated through `upsertInvoice`, the system SHALL attempt to create a Stripe Payment Link if and only if (a) the tenant has Stripe `enabled` with a stored key, (b) the invoice total is greater than zero, (c) the invoice currency is supported by Stripe, and (d) the invoice does not already have a non-stale payment link for its current total. The link's amount MUST match the invoice total at the time of creation. The created link's URL, Stripe id, the amount it was created for, and the creation timestamp MUST be persisted on the invoice. When the invoice's line items each have a positive amount, sum to the invoice total exactly (in cents), and number 20 or fewer when tax/shipping are included as their own line items, the Stripe Payment Link SHALL be created with one Stripe line item per invoice line item (named after the invoice item, with SKU and serial number in Stripe product metadata) plus separate "Tax" and "Shipping" line items when those are non-zero; otherwise the Payment Link SHALL be created with a single "Invoice #N" line item for the full total so the customer-facing total still matches. Stripe failures MUST NOT cause the invoice save to fail.

#### Scenario: First save creates a payment link
- **WHEN** `upsertInvoice` saves a new invoice for a Stripe-enabled tenant with total $250.00
- **THEN** a Stripe Payment Link is created for $250.00, the resulting URL, id, amount, and timestamp are written to the invoice, and `upsertInvoice` still returns `{ success: true }`.

#### Scenario: Tenant has no Stripe configuration
- **WHEN** `upsertInvoice` saves an invoice for a tenant whose Stripe settings are absent or `enabled === false`
- **THEN** no Stripe call is made and the invoice is saved without a `stripePaymentLink` field.

#### Scenario: Invoice total is zero
- **WHEN** `upsertInvoice` saves an invoice whose total is `0`
- **THEN** no Stripe call is made and the invoice is saved without a `stripePaymentLink` field.

#### Scenario: Existing link still matches current total
- **WHEN** `upsertInvoice` updates an invoice that already has a `stripePaymentLink` whose `amount` equals the new total
- **THEN** the existing link is preserved and no new Stripe call is made.

#### Scenario: Invoice total changes on update
- **WHEN** `upsertInvoice` updates an invoice and the new total differs from the existing `stripePaymentLink.amount`
- **THEN** a new Stripe Payment Link is created for the new total and replaces the previous one on the invoice record, and the previous Stripe Payment Link is deactivated (`active: false`) on a best-effort basis so the old URL can no longer accept payments. A failure to deactivate the prior link MUST be logged but MUST NOT cause the new link to be discarded or the invoice save to fail.

#### Scenario: Invoice has detailed line items summing to total
- **WHEN** `upsertInvoice` saves an invoice with N line items (each amount > 0), N+up-to-2 (tax + shipping) ≤ 20, and the sum of all amounts in cents equals the invoice total in cents
- **THEN** the resulting Stripe Payment Link is created with one Stripe line item per invoice line item plus separate Tax/Shipping line items where applicable, with SKU and serial number captured in Stripe product metadata.

#### Scenario: Line items would not reconcile to total
- **WHEN** `upsertInvoice` saves an invoice where any line item has a non-positive amount, the number of items would exceed 20, or the line-item-cents sum does not equal the total-cents
- **THEN** the Stripe Payment Link falls back to a single line item named "Invoice #N" priced at the invoice total so the customer-facing total still matches exactly.

#### Scenario: Stripe API call fails
- **WHEN** the Stripe SDK throws or returns a non-2xx response during payment-link creation
- **THEN** the failure is logged with the invoice id and tenant id, the invoice is still saved successfully, and no `stripePaymentLink` is written (or the previous one is left untouched on update).

### Requirement: Payment link surfaced in invoice PDF

When the invoice PDF is rendered and the invoice has a `stripePaymentLink.url`, the PDF SHALL display a clearly-labelled "Pay online" block containing a clickable hyperlink to the Stripe payment URL. When no link is present, the PDF MUST render exactly as it does today (no empty block, no extra whitespace).

#### Scenario: PDF renders with payment link
- **WHEN** `generateInvoicePdfBuffer` runs for an invoice with a populated `stripePaymentLink.url`
- **THEN** the PDF contains a "Pay online" block with text like "Pay by credit card or ACH" and a clickable link to the URL, positioned near the totals.

#### Scenario: PDF renders without payment link
- **WHEN** `generateInvoicePdfBuffer` runs for an invoice with no `stripePaymentLink`
- **THEN** the PDF output is identical to the pre-change rendering of the same invoice.

### Requirement: Payment link included in the customer invoice email

When the `send-invoice` email endpoint sends an invoice and the invoice has a `stripePaymentLink.url`, the email body SHALL include the sentence: "You can pay by check, ACH, or credit card. For ACH or credit card you can use this payment link." where "payment link" is rendered as an anchor pointing at the Stripe URL. When no payment link exists, the email body MUST remain unchanged from current behavior.

#### Scenario: Email includes payment link
- **WHEN** the send-invoice endpoint sends an invoice whose `stripePaymentLink.url` is set
- **THEN** the rendered HTML body contains the new sentence with a clickable anchor whose `href` equals the Stripe URL, and the existing "Your invoice is attached" copy is preserved.

#### Scenario: Email without payment link is unchanged
- **WHEN** the send-invoice endpoint sends an invoice with no `stripePaymentLink`
- **THEN** the rendered HTML body is identical to the pre-change template (no payment-link paragraph).

### Requirement: Multi-tenant isolation of Stripe calls

Every Stripe API call MUST use the API key belonging to the invoice's tenant. The system MUST NOT fall back to a platform-wide Stripe key, and MUST NOT cache decrypted keys across tenants.

#### Scenario: Two tenants generate links in parallel
- **WHEN** invoices for tenant A and tenant B are saved concurrently and both tenants have Stripe enabled with different keys
- **THEN** tenant A's payment link is created with tenant A's key and tenant B's payment link is created with tenant B's key; no cross-tenant key usage occurs.
