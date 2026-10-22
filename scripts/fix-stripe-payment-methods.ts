import { config } from 'dotenv';
import path from 'path';

// Load env the way Next.js does: .env.local takes precedence over .env, and an
// already-exported shell variable beats both (dotenv never overrides).
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

import mongoose from 'mongoose';
import { getStripeForTenant, loadTenantStripeConfig } from '../lib/stripe/client';
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

  // Say exactly which database we are looking at — a "found 0" against the
  // wrong database looks identical to a clean bill of health otherwise.
  const conn = mongoose.connection;
  console.log(`✅ Connected to ${conn.host}:${conn.port}/${conn.name}`);

  const payments = conn.collection('payments');

  const docs = (await payments
    .find({ stripeSessionId: { $exists: true, $ne: null } })
    .toArray()) as unknown as PaymentDoc[];

  console.log(`📊 Found ${docs.length} payment(s) recorded from Stripe sessions\n`);

  if (docs.length === 0) {
    // Distinguish "no Stripe payments here" from "wrong database".
    const total = await payments.countDocuments();
    console.log(`ℹ️ The payments collection holds ${total} document(s) in total.`);
    if (total === 0) {
      const names = (await conn.db!.listCollections().toArray()).map((c) => c.name).sort();
      console.log(`   Collections in this database: ${names.join(', ') || '(none)'}`);
      console.log('   If that does not look like your data, MONGODB_URI is pointing elsewhere.');
    } else {
      const byMethod = await payments
        .aggregate([{ $group: { _id: '$method', n: { $sum: 1 } } }])
        .toArray();
      console.log(
        `   By method: ${byMethod.map((m) => `${m._id}=${m.n}`).join(', ')} — none carry a stripeSessionId.`
      );
    }
    return;
  }

  // Cache one Stripe client per tenant. `getStripeForTenant` returns null both
  // when Stripe is genuinely unconfigured and when the stored key fails to
  // decrypt, so disambiguate once per tenant — a CREDENTIALS_ENCRYPTION_KEY
  // that does not match the one used to encrypt the key in this database is by
  // far the likeliest cause when running a script against a remote database.
  const clients = new Map<string, Awaited<ReturnType<typeof getStripeForTenant>>>();
  async function clientFor(tenantId: string) {
    if (!clients.has(tenantId)) {
      const client = await getStripeForTenant(tenantId);
      if (!client) {
        const cfg = await loadTenantStripeConfig(tenantId);
        if (cfg?.enabled && cfg.secretKeyCiphertext) {
          console.error(
            `\n❌ Tenant ${tenantId} has a Stripe key stored, but it could not be decrypted.\n` +
              `   CREDENTIALS_ENCRYPTION_KEY does not match the key this database was encrypted with.\n` +
              `   Re-run with the value used by the environment that owns this data, e.g.\n` +
              `     MONGODB_URI='...' CREDENTIALS_ENCRYPTION_KEY='...' npx tsx scripts/fix-stripe-payment-methods.ts\n`
          );
        } else {
          console.error(`\n⚠️  Tenant ${tenantId} has no Stripe configuration.\n`);
        }
      }
      clients.set(tenantId, client);
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
      // Cause already reported once per tenant by clientFor().
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
