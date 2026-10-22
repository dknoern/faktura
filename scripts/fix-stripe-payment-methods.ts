import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local FIRST
config({ path: path.resolve(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import { getStripeForTenant } from '../lib/stripe/client';
import { resolvePaymentMethod } from '../lib/stripe/payment-method';

/**
 * One-off repair: Stripe Payment Link payments were classified by
 * `session.payment_method_types`, which lists the methods *allowed* on a
 * session rather than the one actually used. Once ACH was enabled on the
 * Stripe account that list contained `us_bank_account` for every session, so
 * card payments were recorded with method `ach`.
 *
 * Re-resolves the true method for every payment that carries a
 * `stripeSessionId` and corrects the ones that disagree. Payments entered by
 * hand (no session id) are never touched.
 *
 * Dry run (default):  npx tsx scripts/fix-stripe-payment-methods.ts
 * Apply changes:      npx tsx scripts/fix-stripe-payment-methods.ts --apply
 */

const APPLY = process.argv.includes('--apply');

interface PaymentDoc {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  invoiceId: mongoose.Types.ObjectId;
  amount: number;
  method: string;
  stripeSessionId?: string;
}

async function fixStripePaymentMethods() {
  console.log(
    APPLY
      ? '🔧 Correcting Stripe payment methods (APPLY — changes will be written)...'
      : '🔍 Checking Stripe payment methods (DRY RUN — no changes will be written)...'
  );

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  if (!process.env.CREDENTIALS_ENCRYPTION_KEY) {
    throw new Error('CREDENTIALS_ENCRYPTION_KEY environment variable is not set');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to database');

  const payments = mongoose.connection.collection('payments');

  const docs = (await payments
    .find({ stripeSessionId: { $exists: true, $ne: null } })
    .toArray()) as unknown as PaymentDoc[];

  console.log(`📊 Found ${docs.length} payment(s) recorded from Stripe sessions\n`);

  if (docs.length === 0) {
    console.log('ℹ️ Nothing to check');
    return;
  }

  // Cache one Stripe client per tenant
  const clients = new Map<string, Awaited<ReturnType<typeof getStripeForTenant>>>();
  async function clientFor(tenantId: string) {
    if (!clients.has(tenantId)) {
      clients.set(tenantId, await getStripeForTenant(tenantId));
    }
    return clients.get(tenantId)!;
  }

  let corrected = 0;
  let alreadyCorrect = 0;
  let skipped = 0;

  for (const doc of docs) {
    const tenantId = doc.tenantId.toString();
    const sessionId = doc.stripeSessionId!;

    const stripe = await clientFor(tenantId);
    if (!stripe) {
      console.log(`⚠️  ${sessionId}: Stripe not configured for tenant ${tenantId}, skipping`);
      skipped++;
      continue;
    }

    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (err: any) {
      console.log(`⚠️  ${sessionId}: could not retrieve session (${err?.message || err}), skipping`);
      skipped++;
      continue;
    }

    const actual = await resolvePaymentMethod(stripe, session);

    if (actual === doc.method) {
      alreadyCorrect++;
      continue;
    }

    console.log(
      `${APPLY ? '✅' : '→ '} payment ${doc._id} (invoice ${doc.invoiceId}, $${doc.amount}): ` +
        `${doc.method} -> ${actual}`
    );

    if (APPLY) {
      await payments.updateOne({ _id: doc._id }, { $set: { method: actual } });
    }
    corrected++;
  }

  console.log('\n──────── summary ────────');
  console.log(`   already correct: ${alreadyCorrect}`);
  console.log(`   ${APPLY ? 'corrected' : 'would correct'}: ${corrected}`);
  if (skipped) console.log(`   skipped: ${skipped}`);

  if (!APPLY && corrected > 0) {
    console.log('\nRe-run with --apply to write these changes.');
  }
}

fixStripePaymentMethods()
  .catch((err) => {
    console.error('❌ Failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  });
