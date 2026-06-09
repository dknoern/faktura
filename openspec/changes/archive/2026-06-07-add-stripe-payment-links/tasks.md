## 1. Dependencies & environment

- [x] 1.1 Add `stripe` to `package.json` dependencies and run `npm install`
- [x] 1.2 Add `STRIPE_KEY_ENCRYPTION_KEY` to `.env.example` (32-byte base64) and document it in README/dev setup notes
- [ ] 1.3 Generate a real key for local development and add to `.env.local` (not committed)

## 2. Encryption utility

- [x] 2.1 Create `lib/stripe/crypto.ts` exporting `encryptSecret(plain) → { ciphertext, iv, tag, last4 }` and `decryptSecret({ ciphertext, iv, tag }) → plain` using AES-256-GCM with key from `STRIPE_KEY_ENCRYPTION_KEY`
- [x] 2.2 Throw a clear error if `STRIPE_KEY_ENCRYPTION_KEY` is missing or not 32 bytes after base64-decode
- [x] 2.3 Add a unit-style smoke test (script under `scripts/` or a `__tests__` file matching project conventions) round-tripping a fake key

## 3. Tenant model: Stripe config

- [x] 3.1 Extend `lib/models/tenant.ts` with optional `stripe` sub-document: `enabled`, `secretKeyCiphertext`, `secretKeyIv`, `secretKeyTag`, `secretKeyLast4`, `publishableKey?`, `updatedAt`
- [x] 3.2 Mark `secretKeyCiphertext`, `secretKeyIv`, `secretKeyTag` with `select: false` at schema level
- [x] 3.3 Update any Zod schema that mirrors Tenant to include the new optional fields

## 4. Invoice model: payment-link field

- [x] 4.1 Extend `lib/models/invoice.ts` with optional `stripePaymentLink` sub-document: `url`, `id`, `amount` (cents, int), `currency`, `createdAt`
- [x] 4.2 Update the matching Zod / TS types

## 5. Stripe client wrapper

- [x] 5.1 Create `lib/stripe/client.ts` exporting `getStripeForTenant(tenantId) → Stripe | null` that loads the tenant (selecting the encrypted fields), decrypts the key, instantiates a Stripe client, and returns `null` when Stripe is not enabled / not configured
- [x] 5.2 Cache the Stripe client per `(tenantId, ciphertext)` in-memory for the duration of a single request to avoid repeated decrypt + SDK init in the same flow
- [x] 5.3 Ensure no logger statements include the decrypted key

## 6. Payment-link helper

- [x] 6.1 Create `lib/stripe/payment-links.ts` exporting `ensureInvoicePaymentLink(invoice, tenant) → updatedFields | null`
- [x] 6.2 Helper checks: tenant Stripe enabled, total > 0, existing link amount mismatch → triggers create
- [x] 6.3 Build line-item / price-on-the-fly payload (one ad-hoc line item with the invoice's total in cents, currency `usd`, name like `Invoice #<number>`)
- [x] 6.4 Pass `idempotency_key: \`pl-${invoice._id}-${total}-${currency}\`` to Stripe
- [x] 6.5 On success: return `{ stripePaymentLink: { url, id, amount, currency, createdAt: new Date() } }`
- [x] 6.6 On Stripe error: log with `invoiceId`, `tenantId`, and Stripe error code/message; return `null`

## 7. Hook into invoice creation

- [x] 7.1 In `lib/actions/invoice-actions.ts`, after `invoice.save()` succeeds, call `ensureInvoicePaymentLink`
- [x] 7.2 When the helper returns a non-null result, persist via a focused `Invoice.updateOne({ _id }, { $set: { stripePaymentLink } })` and mutate the in-memory invoice object so the rest of the action sees it
- [x] 7.3 Wrap the whole Stripe step in try/catch so a Stripe failure never propagates out of `upsertInvoice`
- [x] 7.4 Confirm that the action still returns `{ success: true, invoiceId, invoiceNumber }` in both branches

## 8. PDF rendering

- [x] 8.1 Add a `<PaymentLinkBlock>` component inside `lib/pdf/invoice-pdf.tsx` that renders only when `invoice.stripePaymentLink?.url` is set
- [x] 8.2 Style it as a labelled call-to-action: "Pay online by credit card or ACH" + clickable URL (use `@react-pdf/renderer` `<Link>`)
- [x] 8.3 Place it directly under the totals row
- [x] 8.4 Manually generate one PDF with and one without to confirm no layout shift when the block is absent

## 9. Email rendering

- [x] 9.1 In `app/api/email/send-invoice/route.ts`, conditionally build the payment-link paragraph
- [x] 9.2 HTML-escape the URL before interpolation (use a small inline escape helper if no util exists)
- [x] 9.3 Insert the paragraph between the existing "Your invoice is attached" line and the "Thank you." line so it reads naturally
- [x] 9.4 Send a test email to a personal address with a tenant configured for Stripe and confirm the anchor renders and is clickable

## 10. Tenant settings UI

- [x] 10.1 In `app/(dashboard)/profile/page.tsx`, add a "Payments / Stripe" section visible only to tenant admins
- [x] 10.2 Render: enabled toggle, secret-key password input (empty by default; show `sk_••••${last4}` if configured), publishable-key text input, Save button, Remove-credentials button
- [x] 10.3 Create a server action `updateTenantStripeConfig` in `app/actions/` (or extend the existing tenant action) that: validates the secret-key prefix, calls `stripe.balance.retrieve` (or chosen probe) with the new key to verify it authenticates, encrypts and saves on success, returns a structured error message on failure
- [x] 10.4 Empty secret-key submit while a key already exists → preserve existing key (don't overwrite with empty)
- [x] 10.5 Remove-credentials action clears the encrypted fields and sets `enabled: false`
- [x] 10.6 Wire form errors into the UI (toast / inline message)

## 11. Manual verification

- [x] 11.1 With Stripe disabled on the tenant: create an invoice → no Stripe call, no link on invoice, PDF and email unchanged from before
- [x] 11.2 Enable Stripe, save a valid restricted key, create an invoice → invoice gains `stripePaymentLink`, PDF shows the block, email shows the new paragraph, link opens a working Stripe Payment Link
- [x] 11.3 Update the invoice so the total changes by $1 → a new payment link is created, PDF/email show the new URL
- [x] 11.4 Update the invoice without changing the total → existing link is preserved (no new Stripe call; verify in Stripe dashboard)
- [ ] 11.5 Temporarily set a bogus Stripe key and create an invoice → invoice still saves, no `stripePaymentLink`, error logged with invoice + tenant id
- [x] 11.6 Confirm tenant settings page never returns the cleartext secret in any network response (Network tab)

## 12. Docs

- [x] 12.1 Update `CLAUDE.md` to note the new `STRIPE_KEY_ENCRYPTION_KEY` env var and brief description of the `lib/stripe/` module
- [x] 12.2 Add a short README note (or section in existing docs) explaining how a tenant enables Stripe and what scopes the restricted key needs (`payment_links:write` + whatever the probe call requires)
