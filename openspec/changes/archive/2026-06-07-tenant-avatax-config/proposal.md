## Why

AvaTax credentials live in the platform's environment today (`AVATAX_USERNAME`, `AVATAX_PASSWORD`, etc.), which forces every tenant to share one AvaTax account and forces operators to redeploy whenever a tenant wants to be on/off. Tenants that don't sell taxable goods still get hit with tax-calculation calls on every invoice save (the "Tax exempt" affordance only short-circuits per-invoice). Moving AvaTax to per-tenant configuration — mirroring the per-tenant Stripe pattern we just shipped — lets each tenant own their own AvaTax credentials and lets the rest cleanly opt out of tax calculation altogether.

## What Changes

- Add an `avatax` sub-document on the tenant record with `enabled`, account credentials (account id, license key, environment, company code), and an `updatedAt` timestamp. License key stored encrypted at rest, mirroring the Stripe pattern.
- Add a new "AvaTax" section to the Profile / Settings page (admin-only) for entering and saving these values, with the same "leave secret blank to keep existing" + "Remove credentials" behavior as the Stripe section.
- Change `calcTax` to accept a tenant context and build the Avatax client per-call from the tenant's stored credentials; remove the module-level `process.env.AVATAX_*` reads.
- **BREAKING**: When the tenant has `avatax.enabled === false` (or no `avatax` sub-doc at all), `calcTax` SHALL return `0` immediately without consulting AvaTax, the manual Texas fallback, or any other heuristic. Invoices for such tenants will save with `tax: 0`.
- Preserve the existing short-circuits when AvaTax is enabled: invoices shipping to TX still use the hardcoded 8.25% rate without calling AvaTax, and invoices with `methodOfSale === 'Ebay'` still skip tax entirely (eBay acts as marketplace facilitator).
- **BREAKING**: Rename the encryption env var from `STRIPE_KEY_ENCRYPTION_KEY` to `CREDENTIALS_ENCRYPTION_KEY` now that the same key protects both Stripe secrets and AvaTax license keys (and likely future tenant secrets).
- Hide the "Tax exempt" checkbox on the invoice form when the tenant does not have AvaTax enabled; the `taxExempt` field on the invoice still exists but is only meaningful when tax is being calculated.
- **BREAKING**: Deprecate and remove the six `AVATAX_*` env vars from `.env.example` and the code. After this change ships, those env vars have no effect.

## Capabilities

### New Capabilities
- `tenant-avatax-config`: Per-tenant AvaTax credentials, opt-in flag, encrypted credential storage, and gating of tax calculation + tax-exempt UI on that flag.

### Modified Capabilities
<!-- None: there is no existing AvaTax spec under openspec/specs/ to delta. Tax behavior lives only in code today, so this proposal introduces it as a fresh capability. -->

## Impact

- **Model**: `lib/models/tenant.ts` gains an `avatax` sub-document.
- **Module**: `lib/utils/tax.ts` loses its env reads and module-level client config; gains a `getAvataxConfigForTenant(tenantId)` helper. `calcTax` signature gains a tenant context argument (or accepts the tenant id).
- **Server action**: `lib/actions/invoice-actions.ts` (`upsertInvoice`) passes tenant context into `calcTax`. The "no tax for disabled tenants" path is taken purely by `calcTax` returning 0, so the action itself doesn't need to special-case.
- **New server actions**: `lib/actions/tenant-avatax-actions.ts` (`getTenantAvataxSettings`, `updateTenantAvataxConfig`, `removeTenantAvataxCredentials`).
- **New UI**: `components/avatax/avatax-settings-section.tsx` + wiring in `app/(dashboard)/profile/page.tsx` next to the Stripe section.
- **Invoice form**: `components/invoices/form.tsx` reads tenant `avatax.enabled` (likely via a server-supplied prop or session-cached flag) and conditionally renders the Tax Exempt checkbox.
- **Env**: `.env.example` loses `AVATAX_APP_NAME`, `AVATAX_APP_VERSION`, `AVATAX_ENVIRONMENT`, `AVATAX_MACHINE_NAME`, `AVATAX_USERNAME`, `AVATAX_PASSWORD`. README updated.
- **Shared crypto**: AvaTax license-key encryption reuses the AES-256-GCM helper from `lib/stripe/crypto.ts`, which is moved to `lib/crypto/secrets.ts`. The encryption env var is renamed from `STRIPE_KEY_ENCRYPTION_KEY` to `CREDENTIALS_ENCRYPTION_KEY`; existing deployments must update the var name (the key value itself stays the same so previously-encrypted Stripe secrets remain decryptable).
- **Migration**: no data migration needed — `avatax` is an additive optional sub-doc, and existing invoices already store `tax: number` so untouched invoices are unaffected. Tenants currently relying on the shared env credentials must re-enter their AvaTax credentials on the Profile page after this lands, **or** their invoices will start saving with `tax: 0` until they do. This is intentional and called out in deploy notes.
- **Out of scope**: AvaTax address validation, tax document reconciliation / void / refund flows, multi-company-code support per tenant beyond the single value saved on the settings form, automatic provisioning of an AvaTax company in their account.
