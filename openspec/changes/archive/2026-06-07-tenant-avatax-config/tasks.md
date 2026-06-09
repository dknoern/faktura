## 1. Shared crypto cleanup + env-var rename

- [x] 1.1 Move the AES-256-GCM helper from `lib/stripe/crypto.ts` to `lib/crypto/secrets.ts` (same function names — `encryptSecret`, `decryptSecret`, `__resetKeyCacheForTests`)
- [x] 1.2 Update `lib/crypto/secrets.ts` to read from `process.env.CREDENTIALS_ENCRYPTION_KEY` (not `STRIPE_KEY_ENCRYPTION_KEY`); the missing-/wrong-length error message must mention the new name
- [x] 1.3 Update `lib/stripe/client.ts` to import from `@/lib/crypto/secrets` and delete `lib/stripe/crypto.ts`
- [x] 1.4 Rename `__tests__/stripe-crypto.test.ts` to `__tests__/secrets-crypto.test.ts`, point its imports at `@/lib/crypto/secrets`, and update the env-var name expectations
- [x] 1.5 Rename `STRIPE_KEY_ENCRYPTION_KEY` → `CREDENTIALS_ENCRYPTION_KEY` in `.env.example` (keep the comment about generating a 32-byte base64 value)
- [x] 1.6 Confirm no remaining `STRIPE_KEY_ENCRYPTION_KEY` references in non-archive paths via grep

## 2. Tenant model: AvaTax sub-doc

- [x] 2.1 Extend `lib/models/tenant.ts` with optional `avatax` sub-document: `enabled`, `accountId`, `licenseKeyCiphertext`, `licenseKeyIv`, `licenseKeyTag`, `licenseKeyLast4`, `environment`, `companyCode`, `updatedAt`
- [x] 2.2 Mark `licenseKeyCiphertext`, `licenseKeyIv`, `licenseKeyTag` with `select: false` at schema level
- [x] 2.3 Add a minimal `avatax` block to `lib/types/tenant.ts` for non-sensitive fields (`enabled`, `licenseKeyLast4`, `environment`, `companyCode`, `accountId`, `updatedAt`)

## 3. AvaTax module rewrite

- [x] 3.1 Create `lib/avatax/config.ts` exporting `loadTenantAvataxConfig(tenantId)` (mirroring `loadTenantStripeConfig`) that selects the encrypted + non-encrypted avatax fields and returns a typed config object
- [x] 3.2 Create `lib/avatax/client.ts` exporting `getAvataxForTenant(tenantId): Promise<Avatax | null>` that decrypts the license key, instantiates the SDK client with hardcoded `appName='Faktura'`, `appVersion='1.0'`, `machineName='faktura'`, and the per-tenant `environment`; null when not enabled / not configured
- [x] 3.3 Rewrite `lib/utils/tax.ts` `calcTax(invoice, tenantId)` to: (a) early-return 0 if config missing/disabled, (b) preserve existing zero-cases (`!shipState`, `taxExempt`, `methodOfSale === 'Ebay'`), (c) preserve the TX 8.25% manual block (no AvaTax SDK call for TX, even when enabled), (d) after the above, early-return 0 with a warn-log if enabled but credentials incomplete, (e) call AvaTax via the per-tenant client using `companyCode` from config (replacing the hardcoded `'DEFAULT'`)
- [x] 3.4 Remove all `process.env.AVATAX_*` reads from `lib/utils/tax.ts`
- [x] 3.5 Ensure no log line includes the decrypted license key

## 4. Hook update in upsertInvoice

- [x] 4.1 In `lib/actions/invoice-actions.ts`, fetch `tenantId` once before the `calcTax` call and pass it as the second argument
- [x] 4.2 Confirm the existing try/catch around `calcTax` still surfaces `{ success: false, error }` to the frontend on AvaTax failures

## 5. Settings server action

- [x] 5.1 Create `lib/actions/tenant-avatax-actions.ts` mirroring `lib/actions/tenant-stripe-actions.ts`: `getTenantAvataxSettings()`, `updateTenantAvataxConfig({ enabled, accountId?, licenseKey?, environment?, companyCode? })`, `removeTenantAvataxCredentials()`
- [x] 5.2 `requireAdmin` gate on all three (same pattern as Stripe)
- [x] 5.3 On `updateTenantAvataxConfig` with a new license key: probe by calling AvaTax (e.g. `client.queryCompanies` or `client.ping`) and bail out with a structured error if auth fails
- [x] 5.4 Empty-license-key submit while a key already exists → preserve existing key
- [x] 5.5 Cannot `enabled: true` if no stored license key — return a clear error
- [x] 5.6 `removeTenantAvataxCredentials` clears all encrypted fields, account id, and company code, and sets `enabled: false`

## 6. Settings UI

- [x] 6.1 Create `components/avatax/avatax-settings-section.tsx` (client component) mirroring `components/stripe/stripe-settings-section.tsx`: enabled checkbox, account id input, license key password input (masked when set), environment select (`sandbox` / `production`), company code input, Save + Remove buttons
- [x] 6.2 Show masked placeholder `••••${last4}` for the license key when one is stored
- [x] 6.3 Wire `applySettings` post-save to refresh the rendered values
- [x] 6.4 Mount the new section in `app/(dashboard)/profile/page.tsx` inside the existing admin-only block, between Stripe and ApiKeys (or wherever feels natural)
- [x] 6.5 Verify the section is hidden for non-admins

## 7. Invoice form: hide Tax Exempt when AvaTax disabled

- [x] 7.1 In the server components that render the invoice form (likely `app/(dashboard)/invoices/new/page.tsx` and the invoice edit route), load the tenant and pass an `avataxEnabled: boolean` prop into the form
- [x] 7.2 In `components/invoices/form.tsx` (around lines 507-514), wrap the Tax Exempt checkbox in `{avataxEnabled && (...)}`
- [x] 7.3 Confirm that an invoice with a pre-existing `taxExempt: true` saved while AvaTax was on remains unchanged when later viewed/edited under an AvaTax-disabled tenant (preserved in document, not rendered)

## 8. Env / docs cleanup

- [x] 8.1 Remove `AVATAX_APP_NAME`, `AVATAX_APP_VERSION`, `AVATAX_ENVIRONMENT`, `AVATAX_MACHINE_NAME`, `AVATAX_USERNAME`, `AVATAX_PASSWORD` from `.env.example`
- [x] 8.2 Search the repo for `process.env.AVATAX` and `AVATAX_` — assert zero matches outside of `openspec/changes/archive/`
- [x] 8.3 Update README — drop the AvaTax env-var block from "Getting Started", note that AvaTax is configured per-tenant in Profile → AvaTax
- [x] 8.4 Update CLAUDE.md — replace the "AvaTax credentials" env-var mention with a note that AvaTax lives in `lib/avatax/` and is per-tenant

## 9. Manual verification

- [x] 9.1 With AvaTax disabled on the tenant: save an invoice with `shipState: 'CA'` → `tax: 0`, no log lines about AvaTax calls
- [x] 9.2 With AvaTax disabled: open the invoice form → no "Tax exempt" checkbox visible
- [x] 9.3 Enable AvaTax with valid credentials (sandbox), save a CA invoice → tax is non-zero, no errors
- [x] 9.4 Enable AvaTax, save a TX invoice → tax equals `subtotal * 0.0825` and no AvaTax SDK call is made (confirm AvaTax sandbox transactions list has no new entry)
- [x] 9.5 Enable AvaTax with valid creds, mark an invoice `taxExempt: true` → `tax: 0`, no AvaTax call
- [x] 9.6 Enable AvaTax, save an invoice with `methodOfSale === 'Ebay'` → `tax: 0`, no AvaTax call
- [x] 9.7 Enter a bogus AvaTax license key on the settings form → save is rejected with a clear error toast, nothing persisted
- [x] 9.8 Remove AvaTax credentials → form re-renders empty, `enabled: false`, subsequent invoices save with `tax: 0`
- [x] 9.9 Confirm Network tab never returns the cleartext license key after save
- [x] 9.10 With the env var still set to the old name `STRIPE_KEY_ENCRYPTION_KEY`, the app fails fast on the first decrypt with an error mentioning `CREDENTIALS_ENCRYPTION_KEY`

## 10. Tests

- [x] 10.1 Crypto test continues to pass after the move (point 1.3)
- [x] 10.2 (Optional) Add a unit test for `calcTax` that asserts: disabled tenant → 0, enabled+TX → not zero from the hardcoded path (mocking the SDK), missing creds → 0 + warn log. Skip if SDK mocking is heavier than the value provides.
