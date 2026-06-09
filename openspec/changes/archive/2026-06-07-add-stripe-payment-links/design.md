## Context

Faktura is a multi-tenant Next.js 15 / Mongoose app where invoices are created by the `upsertInvoice` server action in `lib/actions/invoice-actions.ts`, rendered to PDF via `@react-pdf/renderer` in `lib/pdf/`, and emailed via AWS SES through `app/api/email/send-invoice/route.ts`. The tenant model (`lib/models/tenant.ts`) currently has no payment-related fields. The `stripe` npm package is not installed yet. Tenants want to give their customers credit-card / ACH payment options without taking on the burden of running their own Stripe integration outside the app.

Because each tenant has their own Stripe account, we cannot use a platform-wide Stripe key — every payment-link API call needs to be authenticated as the tenant. That makes secret-handling, not the Stripe API itself, the central design problem.

## Goals / Non-Goals

**Goals:**
- Per-tenant Stripe configuration, opt-in, with secrets stored encrypted at rest.
- Automatic payment-link creation as a side-effect of `upsertInvoice`, behind a feature toggle.
- Link surfaced in both the PDF and the customer email, with zero visual change when the feature is not enabled.
- Stripe outage or misconfiguration must never block invoice creation or invoice sending.
- Keep all Stripe SDK usage in a single `lib/stripe/` module so the rest of the app stays SDK-agnostic.

**Non-Goals:**
- Webhooks that mark invoices `paid` when Stripe collects. (Follow-up change — would need a webhook endpoint, signature verification, and a paid-status workflow.)
- Refunds, partial payments, or installment plans.
- Stripe Connect / OAuth flows. Tenants paste their own restricted key; we do not own the Stripe account.
- A platform-wide Stripe key fallback.
- Re-issuing payment links after Stripe's own expiry — links don't auto-expire today.
- Backfilling payment links for existing invoices (only invoices saved after this lands get links).

## Decisions

### 1. Where the payment-link call lives

**Decision:** In `lib/actions/invoice-actions.ts`, after the invoice is successfully saved, call a new helper `ensureInvoicePaymentLink(invoice, tenant)` in `lib/stripe/payment-links.ts`. The helper performs the create-or-skip logic and writes back to the invoice with a focused `$set` update (not a full document save) so it never re-triggers other save hooks.

**Why here, not in a Mongoose post-save hook:**
- Server-action call sites have request context (auth, tenantId in scope) and a clear failure boundary.
- Mongoose `post('save')` hooks are async-fire-and-forget by default; we want the link written *and* persisted before the action returns so the very first PDF render sees it.
- Keeping the orchestration in the server action makes testing easier — the helper takes plain objects.

**Alternatives considered:**
- *Lazy creation at PDF/email time.* Rejected — would double the latency of those code paths and make link state ambiguous (does the link exist? Only after first send?). Eager creation on save is simpler.
- *Background job queue.* Rejected — the app has no job runner today; introducing one is much bigger than this change.

### 2. Idempotency / when to re-create the link

The helper re-creates the link only when the invoice has no link OR the stored `stripePaymentLink.amount` differs from the new total. Stripe Payment Links are immutable in amount, so when totals change we make a new one and overwrite the field. We also pass a Stripe `idempotency_key` derived from `${invoice._id}:${total}:${currency}` so retries inside the same save don't create duplicate links.

**Alternative considered:** archiving the prior Stripe Payment Link via `stripe.paymentLinks.update({ active: false })`. We chose not to do this in v1 to keep the failure surface small — a stale active link with the old amount is annoying but not a correctness problem. We can add archival later if tenants ask.

### 3. Secret storage

**Decision:** Store the Stripe secret key encrypted with AES-256-GCM, using a key derived from a new `STRIPE_KEY_ENCRYPTION_KEY` env var (32-byte base64). The tenant document holds `stripe.secretKeyCiphertext`, `stripe.secretKeyIv`, `stripe.secretKeyTag`, and a `stripe.secretKeyLast4` for masked display. Decryption only happens inside `lib/stripe/` at the moment of an API call — no decrypted key is ever serialized into a response, log, or React tree.

**Why not just rely on Mongo at-rest encryption / cloud KMS:** at-rest encryption protects the disk, not application reads. A SSRF or misconfigured query that exfiltrates the tenant document would also exfiltrate a plaintext key. Application-layer encryption keeps the cleartext key out of any document the app might return.

**Alternative considered:** AWS Secrets Manager / SSM Parameter Store per tenant. Rejected for v1 — would add an AWS round-trip on every invoice save and a new IAM surface. Worth revisiting if/when we move other secrets there.

### 4. Tenant model shape

Add a sub-document on `Tenant`:

```
stripe: {
  enabled: boolean,
  secretKeyCiphertext: string,
  secretKeyIv: string,
  secretKeyTag: string,
  secretKeyLast4: string,
  publishableKey?: string,   // optional, plaintext, used only client-side later
  updatedAt: Date,
}
```

Mark the ciphertext fields with `select: false` so they don't leak into incidental finds. The settings server action explicitly `.select('+stripe.secretKeyCiphertext +stripe.secretKeyIv +stripe.secretKeyTag')` when it needs them.

### 5. Invoice model shape

Add `stripePaymentLink: { url, id, amount, currency, createdAt }` as an optional sub-document. No index needed — we look it up by `_id` (the invoice's own id).

### 6. PDF integration

`lib/pdf/invoice-pdf.tsx` gains a small `<PaymentLinkBlock>` component that returns `null` when `invoice.stripePaymentLink?.url` is missing. When present it renders a `<Link src={url}>` with a styled button-ish background. Positioned directly under the totals row. Because the component returns `null` for the no-link case, the change is visually invisible for tenants without Stripe.

### 7. Email integration

In `app/api/email/send-invoice/route.ts`, build the body string conditionally:

```
const paymentParagraph = invoice.stripePaymentLink?.url
  ? `<p>You can pay by check, ACH, or credit card. For ACH or credit card you can use this <a href="${escapeHtml(invoice.stripePaymentLink.url)}">payment link</a>.</p>`
  : '';
```

HTML-escape the URL even though Stripe controls it — defense in depth keeps this route safe if Stripe ever changes URL shape.

### 8. Settings UI

A new "Payments" section in the tenant settings page (we already have `app/(dashboard)/profile/page.tsx` — extend the page rather than introducing a new route). The form has: an enabled toggle, a "Stripe secret key" password input (shown empty with a placeholder when a key is already stored — masked last 4 displayed beside it), an optional publishable key text field, a Save button, and a "Remove credentials" button. The server action validates the key format (`sk_live_*` / `sk_test_*` / `rk_live_*` / `rk_test_*`) before storing it. Submitting an empty secret-key field while one is already stored preserves the existing key.

### 9. Currency

Invoices currently store totals as numbers and assume USD throughout the codebase. v1 hardcodes `currency: 'usd'` in the Stripe call. We persist the currency on `stripePaymentLink` anyway so a future multi-currency change has the field ready.

## Risks / Trade-offs

- **[Stale link after partial update]** If an invoice is updated such that the total changes by a tiny fraction (rounding, tax recalc), we create a brand-new Stripe Payment Link every time → noise in the tenant's Stripe dashboard. → *Mitigation:* compare totals in cents and only re-create when they differ; future improvement is to deactivate the old link in Stripe.
- **[Encryption-key loss]** Losing `STRIPE_KEY_ENCRYPTION_KEY` makes every stored Stripe secret unrecoverable. → *Mitigation:* document the key as a critical secret in deploy runbooks; on key rotation, require admins to re-enter their Stripe keys (UI already supports overwrite).
- **[Stripe API latency added to invoice save]** Adds 200–600ms per save when the feature is on. → *Mitigation:* the call is awaited but the save itself completes first; if latency becomes a problem we can move to a fire-and-forget pattern with retry.
- **[Tenant pastes wrong key]** Server-action validation catches format issues, but a syntactically-valid wrong key only fails at the first Stripe call. → *Mitigation:* on save of the settings form, make one cheap probe call (`stripe.balance.retrieve` or similar) to verify the key authenticates; on failure, reject the form submission.
- **[Email body now contains an external link]** Some spam filters down-score messages with links. → *Mitigation:* acceptable; the link is to stripe.com which has good reputation. Worst case tenants can disable the feature.
- **[Restricted keys with insufficient scopes]** A tenant might supply a restricted key without `payment_links:write`. → *Mitigation:* the probe call above doubles as a smoke test; we also surface the Stripe error message in logs so support can guide the tenant.

## Migration Plan

1. Land schema changes — both `Tenant.stripe` and `Invoice.stripePaymentLink` are additive optional sub-documents, so no data migration is needed.
2. Ship the `lib/stripe/` module and the settings UI together; until a tenant fills the form, behavior is unchanged.
3. After deploy, internal QA enables Stripe on a test tenant, creates a test invoice, verifies the PDF and email both contain the link, and clicks through to a live Stripe Payment Link.
4. Announce to tenants.

**Rollback:** Setting `stripe.enabled` to `false` on all tenants (or removing the env-var encryption key, which makes credential reads fail) disables new link creation without touching invoices that already have links. Invoices with already-created links keep them — the link is just a URL, it does not depend on continued integration.

## Open Questions

- Should we also archive (deactivate in Stripe) the previous payment link when the invoice total changes? Cleaner for tenants, more failure surface for us. Defer until we see if it matters in practice.
- Do we want to mark the invoice `paid` automatically when Stripe collects? Yes eventually — but that's a separate change (webhooks + signature verification + paid-status reconciliation) and is explicitly out of scope here.
- For the settings probe call: `stripe.balance.retrieve` requires `balance:read`. Is that the right minimum scope to require, or should we probe with something narrower? Pick during implementation based on what Stripe docs recommend for restricted keys whose only intended use is creating payment links.
