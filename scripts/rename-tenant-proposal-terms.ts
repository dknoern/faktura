import { config } from 'dotenv';
import path from 'path';
import { pathToFileURL } from 'url';

// Load environment variables from .env.local FIRST
config({ path: path.resolve(process.cwd(), '.env.local') });

import mongoose from 'mongoose';

/**
 * One-off migration: the tenant field `proposalTerms` was renamed to
 * `proposalConditions` to match the `conditions` field on proposals.
 *
 * Renames the field in place on every tenant document that still has the old
 * key. Tenants that already have `proposalConditions` set are left alone so a
 * re-run can never clobber a newer value with the stale one.
 *
 * Run with:  npx tsx scripts/rename-tenant-proposal-terms.ts
 */
async function renameTenantProposalTerms() {
  console.log('🔄 Renaming tenant.proposalTerms -> tenant.proposalConditions...');

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    const tenants = mongoose.connection.collection('tenants');

    const withOldField = await tenants.countDocuments({ proposalTerms: { $exists: true } });
    console.log(`📊 Found ${withOldField} tenant(s) with the old proposalTerms field`);

    if (withOldField === 0) {
      console.log('ℹ️ Nothing to migrate');
      return;
    }

    // Rename where the new field is not already populated.
    const renamed = await tenants.updateMany(
      { proposalTerms: { $exists: true }, proposalConditions: { $exists: false } },
      { $rename: { proposalTerms: 'proposalConditions' } }
    );
    console.log(`✅ Renamed on ${renamed.modifiedCount} tenant(s)`);

    // If both fields exist, keep the new one and drop the old key.
    const dropped = await tenants.updateMany(
      { proposalTerms: { $exists: true }, proposalConditions: { $exists: true } },
      { $unset: { proposalTerms: '' } }
    );
    if (dropped.modifiedCount > 0) {
      console.log(`⚠️ ${dropped.modifiedCount} tenant(s) already had proposalConditions; kept it and dropped the old proposalTerms value`);
    }

    const remaining = await tenants.countDocuments({ proposalTerms: { $exists: true } });
    if (remaining === 0) {
      console.log('✅ Verification passed: no tenant still has proposalTerms');
    } else {
      console.log(`⚠️ Warning: ${remaining} tenant(s) still have proposalTerms`);
    }
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
const isMain = import.meta.url === pathToFileURL(process.argv[1] ?? '').href;

if (isMain) {
  renameTenantProposalTerms()
    .then(() => {
      console.log('🎉 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { renameTenantProposalTerms };
