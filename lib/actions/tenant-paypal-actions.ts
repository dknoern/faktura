'use server'

import dbConnect from "@/lib/dbConnect";
import { Tenant } from "@/lib/models/tenant";
import { getTenantObjectId } from "@/lib/tenant-utils";
import { auth } from "@/auth";
import { encryptSecret } from "@/lib/crypto/secrets";

export interface PaypalSettingsView {
  enabled: boolean;
  environment: 'sandbox' | 'live';
  clientId: string | null;
  hasClientSecret: boolean;
  clientSecretLast4: string | null;
  updatedAt: string | null;
}

async function requireAdmin(): Promise<void> {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'admin') {
    throw new Error('Forbidden: admin access required');
  }
}

// Same hosts PayPal's own SDK uses internally (lib/core/paypal_environment.js).
const OAUTH_HOSTS: Record<'sandbox' | 'live', string> = {
  sandbox: 'https://api.sandbox.paypal.com',
  live: 'https://api.paypal.com',
};

async function probePaypalCredentials(
  clientId: string,
  clientSecret: string,
  environment: 'sandbox' | 'live'
): Promise<void> {
  const base = OAUTH_HOSTS[environment];
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error_description || `PayPal rejected the supplied credentials (${res.status})`);
  }
}

export async function getTenantPaypalSettings(): Promise<PaypalSettingsView> {
  await requireAdmin();
  await dbConnect();
  const tenantObjectId = await getTenantObjectId();

  const tenant = await Tenant.findOne({ _id: tenantObjectId })
    .select({
      'paypal.enabled': 1,
      'paypal.environment': 1,
      'paypal.clientId': 1,
      'paypal.clientSecretLast4': 1,
      'paypal.clientSecretCiphertext': 1,
      'paypal.updatedAt': 1,
    })
    .lean();

  const paypal = (tenant as any)?.paypal;
  if (!paypal) {
    return {
      enabled: false,
      environment: 'sandbox',
      clientId: null,
      hasClientSecret: false,
      clientSecretLast4: null,
      updatedAt: null,
    };
  }

  return {
    enabled: !!paypal.enabled,
    environment: paypal.environment === 'live' ? 'live' : 'sandbox',
    clientId: paypal.clientId || null,
    hasClientSecret: !!paypal.clientSecretCiphertext,
    clientSecretLast4: paypal.clientSecretLast4 || null,
    updatedAt: paypal.updatedAt ? new Date(paypal.updatedAt).toISOString() : null,
  };
}

export interface UpdatePaypalInput {
  enabled: boolean;
  environment: 'sandbox' | 'live';
  clientId?: string;
  clientSecret?: string;
}

export interface UpdatePaypalResult {
  success: boolean;
  error?: string;
  settings?: PaypalSettingsView;
}

export async function updateTenantPaypalConfig(input: UpdatePaypalInput): Promise<UpdatePaypalResult> {
  try {
    await requireAdmin();
    await dbConnect();
    const tenantObjectId = await getTenantObjectId();

    const environment = input.environment === 'live' ? 'live' : 'sandbox';
    const trimmedClientId = (input.clientId || '').trim();
    const trimmedSecret = (input.clientSecret || '').trim();

    const update: Record<string, any> = {
      'paypal.enabled': !!input.enabled,
      'paypal.environment': environment,
      'paypal.updatedAt': new Date(),
    };

    if (trimmedClientId) {
      update['paypal.clientId'] = trimmedClientId;
    }

    if (trimmedSecret) {
      if (!trimmedClientId) {
        return { success: false, error: 'Client ID is required to set a new client secret' };
      }

      // Probe PayPal with the new credentials before persisting so
      // misconfiguration surfaces here rather than at first payout attempt.
      try {
        await probePaypalCredentials(trimmedClientId, trimmedSecret, environment);
      } catch (err: any) {
        return {
          success: false,
          error: `PayPal rejected the supplied credentials: ${err?.message || 'Unknown error'}`,
        };
      }

      const encrypted = encryptSecret(trimmedSecret);
      update['paypal.clientSecretCiphertext'] = encrypted.ciphertext;
      update['paypal.clientSecretIv'] = encrypted.iv;
      update['paypal.clientSecretTag'] = encrypted.tag;
      update['paypal.clientSecretLast4'] = encrypted.last4;
    } else if (input.enabled) {
      // Empty secret on submit: keep the existing one. If none exists and the
      // user is trying to enable PayPal, that's an error.
      const existing = await Tenant.findOne({ _id: tenantObjectId })
        .select({ 'paypal.clientSecretCiphertext': 1, 'paypal.clientId': 1 })
        .lean();
      const hasSecret = !!(existing as any)?.paypal?.clientSecretCiphertext;
      const hasClientId = trimmedClientId || !!(existing as any)?.paypal?.clientId;
      if (!hasSecret || !hasClientId) {
        return {
          success: false,
          error: 'Cannot enable PayPal without a Client ID and Client Secret',
        };
      }
    }

    await Tenant.updateOne({ _id: tenantObjectId }, { $set: update });

    const settings = await getTenantPaypalSettings();
    return { success: true, settings };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith('Forbidden')) {
      return { success: false, error: msg };
    }
    console.error('[paypal-settings] update failed:', msg);
    return { success: false, error: 'Failed to update PayPal settings' };
  }
}

export async function removeTenantPaypalCredentials(): Promise<UpdatePaypalResult> {
  try {
    await requireAdmin();
    await dbConnect();
    const tenantObjectId = await getTenantObjectId();

    await Tenant.updateOne(
      { _id: tenantObjectId },
      {
        $set: {
          'paypal.enabled': false,
          'paypal.updatedAt': new Date(),
        },
        $unset: {
          'paypal.clientId': '',
          'paypal.clientSecretCiphertext': '',
          'paypal.clientSecretIv': '',
          'paypal.clientSecretTag': '',
          'paypal.clientSecretLast4': '',
        },
      }
    );

    const settings = await getTenantPaypalSettings();
    return { success: true, settings };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith('Forbidden')) {
      return { success: false, error: msg };
    }
    console.error('[paypal-settings] remove failed:', msg);
    return { success: false, error: 'Failed to remove PayPal credentials' };
  }
}
