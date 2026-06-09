'use server'

import dbConnect from "@/lib/dbConnect";
import { Tenant } from "@/lib/models/tenant";
import { getTenantObjectId } from "@/lib/tenant-utils";
import { auth } from "@/auth";
import { encryptSecret } from "@/lib/crypto/secrets";
import { buildProbeClient } from "@/lib/avatax/client";

export interface AvataxSettingsView {
  enabled: boolean;
  username: string | null;
  passwordLast4: string | null;
  environment: 'sandbox' | 'production' | null;
  companyCode: string | null;
  hasPassword: boolean;
  updatedAt: string | null;
}

async function requireAdmin(): Promise<void> {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'admin') {
    throw new Error('Forbidden: admin access required');
  }
}

export async function getTenantAvataxSettings(): Promise<AvataxSettingsView> {
  await requireAdmin();
  await dbConnect();
  const tenantObjectId = await getTenantObjectId();

  const tenant = await Tenant.findOne({ _id: tenantObjectId })
    .select({
      'avatax.enabled': 1,
      'avatax.username': 1,
      'avatax.passwordLast4': 1,
      'avatax.passwordCiphertext': 1,
      'avatax.environment': 1,
      'avatax.companyCode': 1,
      'avatax.updatedAt': 1,
    })
    .lean();

  const avatax = (tenant as any)?.avatax;
  if (!avatax) {
    return {
      enabled: false,
      username: null,
      passwordLast4: null,
      environment: null,
      companyCode: null,
      hasPassword: false,
      updatedAt: null,
    };
  }

  return {
    enabled: !!avatax.enabled,
    username: avatax.username || null,
    passwordLast4: avatax.passwordLast4 || null,
    environment: (avatax.environment as any) || null,
    companyCode: avatax.companyCode || null,
    hasPassword: !!avatax.passwordCiphertext,
    updatedAt: avatax.updatedAt ? new Date(avatax.updatedAt).toISOString() : null,
  };
}

export interface UpdateAvataxInput {
  enabled: boolean;
  username?: string;
  password?: string;
  environment?: 'sandbox' | 'production';
  companyCode?: string;
}

export interface UpdateAvataxResult {
  success: boolean;
  error?: string;
  settings?: AvataxSettingsView;
}

export async function updateTenantAvataxConfig(input: UpdateAvataxInput): Promise<UpdateAvataxResult> {
  try {
    await requireAdmin();
    await dbConnect();
    const tenantObjectId = await getTenantObjectId();

    const trimmedUsername = (input.username || '').trim();
    const trimmedPassword = (input.password || '').trim();
    const trimmedCompanyCode = (input.companyCode || '').trim();
    const environment = input.environment === 'production' ? 'production' : 'sandbox';

    const update: Record<string, any> = {
      'avatax.enabled': !!input.enabled,
      'avatax.environment': environment,
      'avatax.updatedAt': new Date(),
    };
    if (trimmedUsername) update['avatax.username'] = trimmedUsername;
    if (trimmedCompanyCode) update['avatax.companyCode'] = trimmedCompanyCode;

    if (trimmedPassword) {
      if (!trimmedUsername) {
        return { success: false, error: 'Username is required when entering a new password / license key' };
      }

      // Probe AvaTax with the supplied credentials before persisting.
      try {
        const probe = buildProbeClient({
          username: trimmedUsername,
          password: trimmedPassword,
          environment,
        });
        const ping = await probe.ping();
        if (!ping?.authenticated) {
          return {
            success: false,
            error: 'AvaTax accepted the request but reported the credentials as unauthenticated. Check the username and password.',
          };
        }
      } catch (err: any) {
        const msg = err?.message || 'AvaTax API call failed';
        return { success: false, error: `AvaTax rejected the supplied credentials: ${msg}` };
      }

      const encrypted = encryptSecret(trimmedPassword);
      update['avatax.passwordCiphertext'] = encrypted.ciphertext;
      update['avatax.passwordIv'] = encrypted.iv;
      update['avatax.passwordTag'] = encrypted.tag;
      update['avatax.passwordLast4'] = encrypted.last4;
    } else {
      // Empty password on submit: keep existing. Cannot enable without one.
      if (input.enabled) {
        const existing = await Tenant.findOne({ _id: tenantObjectId })
          .select({ 'avatax.passwordCiphertext': 1, 'avatax.username': 1 })
          .lean();
        const hasPassword = !!(existing as any)?.avatax?.passwordCiphertext;
        const hasUsername = !!(existing as any)?.avatax?.username || !!trimmedUsername;
        if (!hasPassword) return { success: false, error: 'Cannot enable AvaTax without a password / license key' };
        if (!hasUsername) return { success: false, error: 'Cannot enable AvaTax without a username' };
      }
    }

    await Tenant.updateOne({ _id: tenantObjectId }, { $set: update });

    const settings = await getTenantAvataxSettings();
    return { success: true, settings };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith('Forbidden')) {
      return { success: false, error: msg };
    }
    console.error('[avatax-settings] update failed:', msg);
    return { success: false, error: 'Failed to update AvaTax settings' };
  }
}

export async function removeTenantAvataxCredentials(): Promise<UpdateAvataxResult> {
  try {
    await requireAdmin();
    await dbConnect();
    const tenantObjectId = await getTenantObjectId();

    await Tenant.updateOne(
      { _id: tenantObjectId },
      {
        $set: {
          'avatax.enabled': false,
          'avatax.updatedAt': new Date(),
        },
        $unset: {
          'avatax.username': '',
          'avatax.passwordCiphertext': '',
          'avatax.passwordIv': '',
          'avatax.passwordTag': '',
          'avatax.passwordLast4': '',
          'avatax.companyCode': '',
        },
      }
    );

    const settings = await getTenantAvataxSettings();
    return { success: true, settings };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith('Forbidden')) {
      return { success: false, error: msg };
    }
    console.error('[avatax-settings] remove failed:', msg);
    return { success: false, error: 'Failed to remove AvaTax credentials' };
  }
}
