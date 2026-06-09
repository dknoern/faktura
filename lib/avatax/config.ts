import dbConnect from "@/lib/dbConnect";
import { Tenant } from "@/lib/models/tenant";

export interface TenantAvataxConfig {
  enabled: boolean;
  username?: string;
  passwordCiphertext?: string;
  passwordIv?: string;
  passwordTag?: string;
  passwordLast4?: string;
  environment?: "sandbox" | "production";
  companyCode?: string;
}

export const DEFAULT_COMPANY_CODE = "DEFAULT";

export async function loadTenantAvataxConfig(
  tenantId: string
): Promise<TenantAvataxConfig | null> {
  await dbConnect();

  const tenant = await Tenant.findById(tenantId)
    .select({
      "avatax.enabled": 1,
      "avatax.username": 1,
      "avatax.passwordCiphertext": 1,
      "avatax.passwordIv": 1,
      "avatax.passwordTag": 1,
      "avatax.passwordLast4": 1,
      "avatax.environment": 1,
      "avatax.companyCode": 1,
    })
    .lean();

  const avatax = (tenant as any)?.avatax;
  if (!avatax) return null;

  return {
    enabled: !!avatax.enabled,
    username: avatax.username,
    passwordCiphertext: avatax.passwordCiphertext,
    passwordIv: avatax.passwordIv,
    passwordTag: avatax.passwordTag,
    passwordLast4: avatax.passwordLast4,
    environment: avatax.environment,
    companyCode: avatax.companyCode,
  };
}

export function isFullyConfigured(config: TenantAvataxConfig | null): boolean {
  if (!config) return false;
  return Boolean(
    config.username &&
      config.passwordCiphertext &&
      config.passwordIv &&
      config.passwordTag &&
      config.environment
    // companyCode is not required - defaults to DEFAULT_COMPANY_CODE
  );
}
