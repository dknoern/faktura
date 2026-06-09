import Avatax from "avatax";
import { decryptSecret } from "@/lib/crypto/secrets";
import { loadTenantAvataxConfig, isFullyConfigured, TenantAvataxConfig } from "./config";

export const AVATAX_APP_NAME = "Faktura";
export const AVATAX_APP_VERSION = "1.0";
export const AVATAX_MACHINE_NAME = "faktura";

interface ClientCacheEntry {
  ciphertext: string;
  client: any;
}

const cache = new Map<string, ClientCacheEntry>();

function buildClient(config: TenantAvataxConfig, password: string): any {
  const avataxConfig = {
    appName: AVATAX_APP_NAME,
    appVersion: AVATAX_APP_VERSION,
    environment: config.environment || "sandbox",
    machineName: AVATAX_MACHINE_NAME,
  };
  return new Avatax(avataxConfig as any).withSecurity({
    username: config.username!,
    password,
  });
}

export async function getAvataxForTenant(
  tenantId: string
): Promise<{ client: any; config: TenantAvataxConfig } | null> {
  const config = await loadTenantAvataxConfig(tenantId);
  if (!config || !config.enabled) return null;
  if (!isFullyConfigured(config)) return null;

  const cached = cache.get(tenantId);
  if (cached && cached.ciphertext === config.passwordCiphertext) {
    return { client: cached.client, config };
  }

  let password: string;
  try {
    password = decryptSecret({
      ciphertext: config.passwordCiphertext!,
      iv: config.passwordIv!,
      tag: config.passwordTag!,
    });
  } catch (err) {
    console.error(
      `[avatax] Failed to decrypt password for tenant ${tenantId}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return null;
  }

  const client = buildClient(config, password);
  cache.set(tenantId, {
    ciphertext: config.passwordCiphertext!,
    client,
  });

  return { client, config };
}

/** Build a one-off client from ad-hoc credentials (used by the settings probe). */
export function buildProbeClient(input: {
  username: string;
  password: string;
  environment: "sandbox" | "production";
}): any {
  const avataxConfig = {
    appName: AVATAX_APP_NAME,
    appVersion: AVATAX_APP_VERSION,
    environment: input.environment,
    machineName: AVATAX_MACHINE_NAME,
  };
  return new Avatax(avataxConfig as any).withSecurity({
    username: input.username,
    password: input.password,
  });
}
