## Context

Faktura currently calls AvaTax through a single, process-wide configuration in `lib/utils/tax.ts`: env vars (`AVATAX_USERNAME`, `AVATAX_PASSWORD`, `AVATAX_ENVIRONMENT`, `AVATAX_MACHINE_NAME`, plus app name/version) read at module load. `calcTax` is invoked from `upsertInvoice` in `lib/actions/invoice-actions.ts` and currently has a layered set of short-circuits (no ship state, tax-exempt, eBay sale, hardcoded TX 8.25%) before falling through to AvaTax.

We just shipped a per-tenant Stripe integration that follows a clean pattern: `Tenant.stripe` sub-doc, `lib/stripe/{crypto,client,payment-links}.ts`, a Profile section, and `lib/actions/tenant-stripe-actions.ts`. This change applies the same shape to AvaTax — same encryption utility, same admin-only settings UI placement, same probe-before-persist server action — while also raising the on/off semantics from per-invoice to per-tenant.

## Goals / Non-Goals

**Goals:**
- Move AvaTax credentials out of env vars and onto the tenant record, encrypted at rest.
- Per-tenant `enabled` flag that short-circuits all tax math (including the manual TX fallback).
- Hide the "Tax exempt" UI when AvaTax is disabled.
- Reuse the existing AES-256-GCM crypto utility instead of standing up a parallel one.
- Keep `calcTax`'s public contract close to today's (return a number, throw on tax-engine failure) so existing error handling in `upsertInvoice` keeps working.

**Non-Goals:**
- Backfilling tax onto past invoices.
- A platform-wide AvaTax fallback if a tenant hasn't configured one — explicit opt-in only.
- AvaTax address validation, document void/refund, or fancier multi-company-code flows.
- Changing the short-circuits: TX still uses the hardcoded 8.25% (no AvaTax call), and eBay-method sales still skip tax entirely.

## Decisions

### 1. Credentials shape on the tenant

```
avatax: {
  enabled: boolean,
  accountId: string,                  // not secret — used in AvaTax basic-auth username
  licenseKeyCiphertext: string,       // select: false
  licenseKeyIv: string,               // select: false
  licenseKeyTag: string,              // select: false
  licenseKeyLast4: string,            // shown masked in UI
  environment: 'sandbox' | 'production',
  companyCode: string,
  updatedAt: Date,
}
```

The AvaTax SDK's `withSecurity({ username, password })` takes username = account id, password = license key. We store the account id as plaintext (it's not a credential by itself) and only the license key under encryption. Matches Stripe's "ciphertext + iv + tag + last4" shape so the crypto utility plugs in unchanged.

`appName` / `appVersion` / `machineName` move out of tenant config — they're identifiers for our SDK's own telemetry, not tenant-specific. Hardcode them in the module.

### 2. Reuse the Stripe crypto helper, not duplicate it

`lib/stripe/crypto.ts` is already a generic AES-256-GCM utility. We move it to `lib/crypto/secrets.ts` and update both Stripe and AvaTax modules to import from there. The Stripe path can either remain as a thin re-export shim or be removed entirely; we'll remove it (no production code imports it externally — only `lib/stripe/client.ts` and one test, both of which we update).

At the same time we **rename the env var** from `STRIPE_KEY_ENCRYPTION_KEY` to `CREDENTIALS_ENCRYPTION_KEY` since it no longer belongs to Stripe specifically. The key bytes themselves stay the same, so all previously-encrypted Stripe secrets remain decryptable after the rename — operators simply rename the variable in their environment.

If an environment is still pointing at the old name, the app fails fast on first decrypt with a clear "CREDENTIALS_ENCRYPTION_KEY is not set" error. No silent fallback to the old name — keeping the var-rename clean is more valuable than a transition window for a single-operator app.

### 3. `calcTax` signature

Today: `calcTax(invoice: Invoice): Promise<number>`. The invoice doesn't carry `tenantId` directly in the runtime view used inside `calcTax` (it's a renderer-style Invoice), so we either thread tenant info via an argument or call `getTenantId()` inside `calcTax`.

**Decision:** add a second parameter, `tenantId: string`, and have `upsertInvoice` pass `await getTenantId()` in. Keeps `calcTax` testable without async-local-storage and makes it explicit which tenant's credentials are about to be used.

Inside `calcTax`:

```
const config = await loadTenantAvataxConfig(tenantId);
if (!config?.enabled) return 0;          // covers missing sub-doc too
if (!invoice.shipState) return 0;        // existing behavior
if (invoice.taxExempt) return 0;         // existing behavior
if (invoice.methodOfSale === 'Ebay') return 0;  // existing behavior
if (invoice.shipState === 'TX') {
  return invoice.subtotal * 0.0825;      // hardcoded TX rate, no AvaTax call
}
if (!isFullyConfigured(config)) {
  console.warn(`[avatax] tenant ${tenantId}: enabled but credentials incomplete; returning 0`);
  return 0;
}
// ... build client, call AvaTax ...
```

The order matters: the disabled check fires before any other heuristic, so "AvaTax disabled" really does mean zero tax-engine activity. The TX manual rate is also reached *before* the credential-completeness check, so a TX-only tenant who enabled AvaTax but never finished entering credentials still gets correct TX tax.

### 4. Texas hardcoded 8.25% fallback

Today: tenant ships to TX → manual 8.25%, no AvaTax call. This is preserved as-is for AvaTax-enabled tenants — the rationale (the operator's home state where the rate is stable and well-known, no need to spend an AvaTax transaction) still holds. The only change is that the TX path is now gated by `avatax.enabled` like every other tax path, so AvaTax-disabled tenants get `0` for TX too.

Alternative considered: route TX through AvaTax for AvaTax-enabled tenants so rates would track jurisdictional changes automatically. Rejected — keeps behavior stable for existing tenants and is what the product owner asked for. If TX rate jurisdictions ever matter, that's a separate change.

### 5. Surfacing `avatax.enabled` to the invoice form

The invoice form is a client component. It needs to know whether to render the Tax Exempt checkbox.

Options:

- **(a) Pass `avataxEnabled: boolean` as a prop from the server component that mounts the form.** Cheap, no extra fetch.
- **(b) Fetch from a new server action when the form mounts.** Extra round-trip; no benefit.
- **(c) Stash on the session.** Avoids a DB read per form mount but requires a session-update path when the admin toggles AvaTax mid-session — not worth it.

**Decision:** option (a). The form is rendered inside a server-component wrapper (`app/(dashboard)/invoices/new/page.tsx`, `.../edit/page.tsx`) that already has a DB connection; it reads `tenant.avatax?.enabled` from the loaded tenant and passes a `taxConfigEnabled` prop down.

For invoices that previously had `taxExempt: true` saved (when AvaTax was enabled) and are now viewed/edited under an AvaTax-disabled tenant, the field value is preserved in the document but not rendered. Re-enabling AvaTax later restores the checkbox in its previous state.

### 6. Settings UI shape

Mirrors the Stripe section: enabled checkbox, account id (text), license key (password, masked when stored), environment (select: sandbox/production), company code (text), Save / Remove. Probe call on save uses an authenticated read endpoint that requires the same scopes as `createOrAdjustTransaction` would. We'll use `companies.queryCompanies` (lightweight authenticated GET that fails fast on bad creds). Failure surfaces as a structured `{ success: false, error }` response that the section renders as a toast.

### 7. AvaTax SDK app-name / version / machine-name

These were env-driven for no good reason — they're descriptive metadata sent in the SDK's user-agent. Hardcode them in `lib/utils/tax.ts`:

```
const AVATAX_APP_NAME = 'Faktura';
const AVATAX_APP_VERSION = '1.0';
const AVATAX_MACHINE_NAME = 'faktura';
```

These are visible in the AvaTax customer's logs, not security-sensitive.

## Risks / Trade-offs

- **[Breaking change for tenants currently on shared env credentials]** Once this lands, those tenants get `tax: 0` (TX excepted) until an admin re-enters credentials in the Profile page. → *Mitigation:* call out clearly in the deploy/runbook. If we have only one production tenant, schedule the deploy alongside their admin re-entering credentials.
- **[Env var rename]** Existing deployments must rename `STRIPE_KEY_ENCRYPTION_KEY` → `CREDENTIALS_ENCRYPTION_KEY`. Missing the rename means the app fails fast on the first decrypt with a clear error — annoying but loud. → *Mitigation:* called out in the migration plan, the `.env.example` update, and the README.
- **[License keys live next to Stripe keys under the same encryption key]** If `CREDENTIALS_ENCRYPTION_KEY` is leaked, both subsystems' secrets are exposed. → *Mitigation:* same risk profile as Stripe alone — standard cost of app-level encryption with a shared master key. Document key rotation procedure (rotation requires admins to re-enter credentials for both subsystems).
- **[Probe-call cost on every settings save]** Each save makes an authenticated AvaTax call. → *Mitigation:* this happens only when an admin saves the settings form, not per-invoice; negligible.
- **[Latency of an extra tenant read inside calcTax]** Adds one `findById` per invoice save when AvaTax is enabled. → *Mitigation:* same Mongo pool / connection cache; load with a focused projection. Could memoize per-request later if it matters.

## Migration Plan

1. Land schema changes — `Tenant.avatax` is additive optional, no data migration needed.
2. Ship `lib/utils/tax.ts` rewrite + settings UI + form prop wiring together so half-states don't exist on main.
3. Before deploy, confirm with each production tenant admin that they have their AvaTax credentials ready and know to re-enter them on the Profile page after deploy. (For dev / staging, just disable AvaTax everywhere — invoices save with `tax: 0`.)
4. Remove `AVATAX_*` from `.env.example`; update README.

**Rollback:** Revert the PR. The `Tenant.avatax` field is optional so previously-saved settings stay in the DB unused; nothing breaks. The previous env-var-driven `calcTax` returns. We'd lose any user-entered AvaTax settings only if we also drop the schema field — which a revert wouldn't do.

## Open Questions

- **Should the probe call store the probed company code's existence, so the form can warn "company code X not found in your AvaTax account"?** Nice-to-have, defer.
