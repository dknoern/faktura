import Stripe from "stripe";
import dbConnect from "@/lib/dbConnect";
import { Tenant } from "@/lib/models/tenant";
import { decryptSecret } from "@/lib/crypto/secrets";

export interface TenantStripeConfig {
  enabled: boolean;
  secretKeyCiphertext?: string;
  secretKeyIv?: string;
  secretKeyTag?: string;
  secretKeyLast4?: string;
  publishableKey?: string;
}

interface ClientCacheEntry {
  ciphertext: string;
  client: Stripe;
}

// Per-request cache keyed by tenantId. Cleared when the Node process recycles;
// inside a single request flow this avoids decrypting + re-instantiating the
// SDK if multiple call sites resolve the same tenant.
const cache = new Map<string, ClientCacheEntry>();

export async function loadTenantStripeConfig(
  tenantId: string
): Promise<TenantStripeConfig | null> {
  await dbConnect();

  const tenant = await Tenant.findById(tenantId)
    .select({
      "stripe.enabled": 1,
      "stripe.secretKeyCiphertext": 1,
      "stripe.secretKeyIv": 1,
      "stripe.secretKeyTag": 1,
      "stripe.secretKeyLast4": 1,
      "stripe.publishableKey": 1,
    })
    .lean();

  const stripe = (tenant as any)?.stripe;
  if (!stripe) return null;

  return {
    enabled: !!stripe.enabled,
    secretKeyCiphertext: stripe.secretKeyCiphertext,
    secretKeyIv: stripe.secretKeyIv,
    secretKeyTag: stripe.secretKeyTag,
    secretKeyLast4: stripe.secretKeyLast4,
    publishableKey: stripe.publishableKey,
  };
}

export async function getStripeForTenant(
  tenantId: string
): Promise<Stripe | null> {
  const config = await loadTenantStripeConfig(tenantId);
  if (!config || !config.enabled) return null;
  if (
    !config.secretKeyCiphertext ||
    !config.secretKeyIv ||
    !config.secretKeyTag
  ) {
    return null;
  }

  const cached = cache.get(tenantId);
  if (cached && cached.ciphertext === config.secretKeyCiphertext) {
    return cached.client;
  }

  let secret: string;
  try {
    secret = decryptSecret({
      ciphertext: config.secretKeyCiphertext,
      iv: config.secretKeyIv,
      tag: config.secretKeyTag,
    });
  } catch (err) {
    console.error(
      `[stripe] Failed to decrypt Stripe key for tenant ${tenantId}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return null;
  }

  // Use the SDK's bundled API version (LatestApiVersion). Pinning a specific
  // version here would couple us to a Stripe SDK upgrade.
  const client = new Stripe(secret);

  cache.set(tenantId, {
    ciphertext: config.secretKeyCiphertext,
    client,
  });

  return client;
}
