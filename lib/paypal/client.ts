import { core } from "@paypal/payouts-sdk";
import dbConnect from "@/lib/dbConnect";
import { Tenant } from "@/lib/models/tenant";
import { decryptSecret } from "@/lib/crypto/secrets";

export interface TenantPaypalConfig {
  enabled: boolean;
  environment: "sandbox" | "live";
  clientId?: string;
  clientSecretCiphertext?: string;
  clientSecretIv?: string;
  clientSecretTag?: string;
  clientSecretLast4?: string;
}

interface ClientCacheEntry {
  ciphertext: string;
  client: any;
}

// Per-request cache keyed by tenantId, same rationale as lib/stripe/client.ts:
// avoids re-decrypting + re-instantiating the SDK client for repeat calls
// within a single request flow. Cache key includes the ciphertext so rotating
// the secret invalidates the cached client.
const cache = new Map<string, ClientCacheEntry>();

export async function loadTenantPaypalConfig(
  tenantId: string
): Promise<TenantPaypalConfig | null> {
  await dbConnect();

  const tenant = await Tenant.findById(tenantId)
    .select({
      "paypal.enabled": 1,
      "paypal.environment": 1,
      "paypal.clientId": 1,
      "paypal.clientSecretCiphertext": 1,
      "paypal.clientSecretIv": 1,
      "paypal.clientSecretTag": 1,
      "paypal.clientSecretLast4": 1,
    })
    .lean();

  const paypal = (tenant as any)?.paypal;
  if (!paypal) return null;

  return {
    enabled: !!paypal.enabled,
    environment: paypal.environment === "live" ? "live" : "sandbox",
    clientId: paypal.clientId,
    clientSecretCiphertext: paypal.clientSecretCiphertext,
    clientSecretIv: paypal.clientSecretIv,
    clientSecretTag: paypal.clientSecretTag,
    clientSecretLast4: paypal.clientSecretLast4,
  };
}

// Cheap presence check for UI gating - no decryption needed.
export function isFullyConfigured(config: TenantPaypalConfig | null): boolean {
  if (!config) return false;
  return Boolean(
    config.enabled &&
      config.clientId &&
      config.clientSecretCiphertext &&
      config.clientSecretIv &&
      config.clientSecretTag
  );
}

export async function getPaypalClientForTenant(
  tenantId: string
): Promise<any | null> {
  const config = await loadTenantPaypalConfig(tenantId);
  if (!isFullyConfigured(config)) return null;

  const cached = cache.get(tenantId);
  if (cached && cached.ciphertext === config!.clientSecretCiphertext) {
    return cached.client;
  }

  let clientSecret: string;
  try {
    clientSecret = decryptSecret({
      ciphertext: config!.clientSecretCiphertext!,
      iv: config!.clientSecretIv!,
      tag: config!.clientSecretTag!,
    });
  } catch (err) {
    console.error(
      `[paypal] Failed to decrypt PayPal client secret for tenant ${tenantId}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return null;
  }

  const environment =
    config!.environment === "live"
      ? new core.LiveEnvironment(config!.clientId!, clientSecret)
      : new core.SandboxEnvironment(config!.clientId!, clientSecret);

  const client = new core.PayPalHttpClient(environment);

  cache.set(tenantId, {
    ciphertext: config!.clientSecretCiphertext!,
    client,
  });

  return client;
}
