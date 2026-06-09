## Why

Tenants want to offer their customers a frictionless way to pay invoices online by credit card or ACH. Today, the invoice PDF and the accompanying email only describe how to pay by check or wire — anything electronic requires the customer to contact the tenant and arrange payment out-of-band. Adding a Stripe-hosted payment link per invoice removes that friction, shortens days-to-payment, and makes Faktura competitive with other invoicing tools tenants already evaluate.

## What Changes

- Add Stripe configuration to the tenant record so each tenant can opt-in by storing their own Stripe API credentials.
- When an invoice is created (or updated to a state that should be payable), call Stripe to create a Payment Link for that invoice's total and persist the resulting URL on the invoice.
- Render the payment link in the invoice PDF (a clickable button/URL near the totals) — only when the link exists.
- Update the "send invoice" email so that when a payment link exists the body includes: "You can pay by check, ACH, or credit card. For ACH or credit card you can use this <payment link>." When no link exists, the email keeps its current copy.
- Gracefully no-op (no link, no email change, no PDF change) when the tenant has not configured Stripe, or when the Stripe call fails — invoice creation must never fail because Stripe was unavailable.

## Capabilities

### New Capabilities
- `stripe-payment-links`: Per-tenant Stripe configuration, on-invoice payment-link creation, and surfacing of the link in the invoice PDF and customer email.

### Modified Capabilities
<!-- None — invoice creation, PDF rendering, and email sending are not spec'd in openspec/specs/ today, so behavior changes there are captured inside the new stripe-payment-links capability rather than as deltas. -->

## Impact

- **Models**: `lib/models/tenant.ts` gains a `stripe` config sub-document (secret key + publishable key + enabled flag). `lib/models/invoice.ts` gains a `stripePaymentLink` sub-document (url, id, createdAt).
- **Server actions**: `lib/actions/invoice-actions.ts` (`upsertInvoice`) gains a post-save hook that creates the payment link.
- **PDF**: `lib/pdf/invoice-pdf.tsx` renders a payment-link block when the field is populated.
- **Email**: `app/api/email/send-invoice/route.ts` injects the additional payment paragraph when the field is populated.
- **New module**: `lib/stripe/` for the Stripe client wrapper and payment-link helper (keeps the SDK contained).
- **Dependencies**: adds the `stripe` npm package.
- **Settings UI**: tenant settings page gains a Stripe section (API key entry, enable toggle). Secrets are write-only from the UI and never returned to the client.
- **Env / secrets**: tenants supply their own Stripe restricted key — no platform-wide Stripe key required. Keys are stored encrypted at rest (see design).
- **Out of scope**: webhooks for marking invoices paid, partial/installment payments, refunds, Stripe Connect / platform fees. These can land in follow-up changes.
