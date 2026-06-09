'use server'

import Stripe from "stripe";
import dbConnect from "@/lib/dbConnect";
import { Tenant } from "@/lib/models/tenant";
import { getTenantObjectId } from "@/lib/tenant-utils";
import { auth } from "@/auth";
import { encryptSecret } from "@/lib/crypto/secrets";

export interface StripeSettingsView {
  enabled: boolean;
  secretKeyLast4: string | null;
  publishableKey: string | null;
  hasSecretKey: boolean;
  updatedAt: string | null;
}

async function requireAdmin(): Promise<void> {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'admin') {
    throw new Error('Forbidden: admin access required');
  }
}

const SECRET_KEY_PREFIXES = ['sk_live_', 'sk_test_', 'rk_live_', 'rk_test_'];

function isValidStripeSecretKey(value: string): boolean {
  return SECRET_KEY_PREFIXES.some((prefix) => value.startsWith(prefix));
}

export async function getTenantStripeSettings(): Promise<StripeSettingsView> {
  await requireAdmin();
  await dbConnect();
  const tenantObjectId = await getTenantObjectId();

  const tenant = await Tenant.findOne({ _id: tenantObjectId })
    .select({
      'stripe.enabled': 1,
      'stripe.secretKeyLast4': 1,
      'stripe.publishableKey': 1,
      'stripe.updatedAt': 1,
      'stripe.secretKeyCiphertext': 1,
    })
    .lean();

  const stripe = (tenant as any)?.stripe;
  if (!stripe) {
    return {
      enabled: false,
      secretKeyLast4: null,
      publishableKey: null,
      hasSecretKey: false,
      updatedAt: null,
    };
  }

  return {
    enabled: !!stripe.enabled,
    secretKeyLast4: stripe.secretKeyLast4 || null,
    publishableKey: stripe.publishableKey || null,
    hasSecretKey: !!stripe.secretKeyCiphertext,
    updatedAt: stripe.updatedAt ? new Date(stripe.updatedAt).toISOString() : null,
  };
}

export interface UpdateStripeInput {
  enabled: boolean;
  secretKey?: string;
  publishableKey?: string;
}

export interface UpdateStripeResult {
  success: boolean;
  error?: string;
  settings?: StripeSettingsView;
}

export async function updateTenantStripeConfig(input: UpdateStripeInput): Promise<UpdateStripeResult> {
  try {
    await requireAdmin();
    await dbConnect();
    const tenantObjectId = await getTenantObjectId();

    const trimmedSecret = (input.secretKey || '').trim();
    const trimmedPublishable = (input.publishableKey || '').trim();

    const update: Record<string, any> = {
      'stripe.enabled': !!input.enabled,
      'stripe.publishableKey': trimmedPublishable || undefined,
      'stripe.updatedAt': new Date(),
    };

    if (trimmedSecret) {
      if (!isValidStripeSecretKey(trimmedSecret)) {
        return {
          success: false,
          error: `Invalid Stripe secret key. Must start with one of: ${SECRET_KEY_PREFIXES.join(', ')}`,
        };
      }

      // Probe Stripe with the new key before persisting so misconfiguration
      // surfaces here rather than at first invoice save.
      try {
        const probe = new Stripe(trimmedSecret);
        await probe.balance.retrieve();
      } catch (err: any) {
        const msg = err?.raw?.message || err?.message || 'Stripe API call failed';
        return {
          success: false,
          error: `Stripe rejected the supplied key: ${msg}`,
        };
      }

      const encrypted = encryptSecret(trimmedSecret);
      update['stripe.secretKeyCiphertext'] = encrypted.ciphertext;
      update['stripe.secretKeyIv'] = encrypted.iv;
      update['stripe.secretKeyTag'] = encrypted.tag;
      update['stripe.secretKeyLast4'] = encrypted.last4;
    } else {
      // Empty secret on submit: keep the existing one. If none exists and
      // user is trying to enable Stripe, that's an error.
      if (input.enabled) {
        const existing = await Tenant.findOne({ _id: tenantObjectId })
          .select({ 'stripe.secretKeyCiphertext': 1 })
          .lean();
        const hasKey = !!(existing as any)?.stripe?.secretKeyCiphertext;
        if (!hasKey) {
          return {
            success: false,
            error: 'Cannot enable Stripe without a secret key',
          };
        }
      }
    }

    await Tenant.updateOne({ _id: tenantObjectId }, { $set: update });

    const settings = await getTenantStripeSettings();
    return { success: true, settings };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith('Forbidden')) {
      return { success: false, error: msg };
    }
    console.error('[stripe-settings] update failed:', msg);
    return { success: false, error: 'Failed to update Stripe settings' };
  }
}

export async function removeTenantStripeCredentials(): Promise<UpdateStripeResult> {
  try {
    await requireAdmin();
    await dbConnect();
    const tenantObjectId = await getTenantObjectId();

    await Tenant.updateOne(
      { _id: tenantObjectId },
      {
        $set: {
          'stripe.enabled': false,
          'stripe.updatedAt': new Date(),
        },
        $unset: {
          'stripe.secretKeyCiphertext': '',
          'stripe.secretKeyIv': '',
          'stripe.secretKeyTag': '',
          'stripe.secretKeyLast4': '',
        },
      }
    );

    const settings = await getTenantStripeSettings();
    return { success: true, settings };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith('Forbidden')) {
      return { success: false, error: msg };
    }
    console.error('[stripe-settings] remove failed:', msg);
    return { success: false, error: 'Failed to remove Stripe credentials' };
  }
}
