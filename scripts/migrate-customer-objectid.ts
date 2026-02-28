/**
 * Migration Script: Customer, Invoice, and Return IDs from Number to ObjectId
 * 
 * This script migrates:
 * 1. customers collection: numeric _id -> ObjectId, original _id -> customerNumber
 * 2. invoices collection: numeric _id -> ObjectId, original _id -> invoiceNumber
 * 3. returns collection: numeric _id -> ObjectId, original _id -> returnNumber
 * 
 * All related collections are updated to reference the new ObjectIds.
 *
 * Usage:
 *   npx tsx scripts/migrate-customer-objectid.ts
 *
 * IMPORTANT: Back up your database before running this script!
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI as string);
  console.log('Connected.');

  const db = mongoose.connection.db;
  if (!db) {
    console.error('Failed to get database reference');
    process.exit(1);
  }

  // Step 1: Read all existing customers
  const customersCollection = db.collection('customers');
  const invoicesCollection = db.collection('invoices');
  const returnsCollection = db.collection('returns');
  const wantedsCollection = db.collection('wanteds');
  const repairsCollection = db.collection('repairs');
  const proposalsCollection = db.collection('proposals');

  const existingCustomers = await customersCollection.find({}).toArray();
  console.log(`Found ${existingCustomers.length} customers to migrate.`);

  // Check if customer migration has already been run
  const customerAlreadyMigrated = existingCustomers.length > 0 && 
    typeof existingCustomers[0]._id !== 'number' && 
    existingCustomers[0].customerNumber !== undefined;

  // Build a mapping from old numeric _id to new ObjectId
  const idMapping: Map<number, mongoose.Types.ObjectId> = new Map();

  if (customerAlreadyMigrated) {
    console.log('Customer migration already complete (ObjectId _id + customerNumber exist). Skipping customers.');
  }

  // Step 2: For each customer, create a new document with ObjectId _id and customerNumber
  console.log('\n--- Migrating Customers ---');
  
  let customersMigrated = 0;
  let customersSkipped = 0;

  for (const customer of existingCustomers) {
    const oldId = customer._id;
    
    // Skip if already an ObjectId (not a number)
    if (typeof oldId !== 'number') {
      customersSkipped++;
      continue;
    }

    const newObjectId = new mongoose.Types.ObjectId();
    idMapping.set(oldId, newObjectId);

    // Create new customer document with ObjectId _id
    const newCustomer: any = {
      ...customer,
      _id: newObjectId,
      customerNumber: oldId,
    };

    // Update search field to include customerNumber
    if (newCustomer.search) {
      newCustomer.search = `${oldId} ${newCustomer.search}`;
    }

    try {
      await customersCollection.insertOne(newCustomer);
      customersMigrated++;
      
      if (customersMigrated % 100 === 0) {
        console.log(`  Migrated ${customersMigrated} customers...`);
      }
    } catch (error: any) {
      console.error(`  Error inserting new customer for old _id ${oldId}:`, error.message);
    }
  }

  console.log(`  Customers migrated: ${customersMigrated}, skipped: ${customersSkipped}`);

  // Step 3: Delete old customer documents (with numeric _id)
  console.log('\n--- Removing old customer documents ---');
  const oldCustomerIds = Array.from(idMapping.keys());
  if (oldCustomerIds.length > 0) {
    const deleteResult = await customersCollection.deleteMany({
      _id: { $in: oldCustomerIds } as any
    });
    console.log(`  Deleted ${deleteResult.deletedCount} old customer documents.`);
  }

  // Step 4: Update invoices
  console.log('\n--- Migrating Invoices ---');
  let invoicesUpdated = 0;
  
  for (const [oldId, newObjectId] of idMapping) {
    const result = await invoicesCollection.updateMany(
      { customerId: oldId },
      { 
        $set: { 
          customerId: newObjectId,
          customerNumber: oldId 
        } 
      }
    );
    invoicesUpdated += result.modifiedCount;
  }
  console.log(`  Invoices updated: ${invoicesUpdated}`);

  // Step 5: Update returns
  console.log('\n--- Migrating Returns ---');
  let returnsUpdated = 0;
  
  for (const [oldId, newObjectId] of idMapping) {
    const result = await returnsCollection.updateMany(
      { customerId: oldId },
      { 
        $set: { 
          customerId: newObjectId,
          customerNumber: oldId 
        } 
      }
    );
    returnsUpdated += result.modifiedCount;
  }
  console.log(`  Returns updated: ${returnsUpdated}`);

  // Step 6: Update wanteds
  console.log('\n--- Migrating Wanteds ---');
  let wantedsUpdated = 0;
  
  for (const [oldId, newObjectId] of idMapping) {
    const result = await wantedsCollection.updateMany(
      { customerId: oldId },
      { 
        $set: { 
          customerId: newObjectId,
          customerNumber: oldId 
        } 
      }
    );
    wantedsUpdated += result.modifiedCount;
  }
  console.log(`  Wanteds updated: ${wantedsUpdated}`);

  // Step 7: Update repairs
  console.log('\n--- Migrating Repairs ---');
  let repairsUpdated = 0;
  
  for (const [oldId, newObjectId] of idMapping) {
    const result = await repairsCollection.updateMany(
      { customerId: oldId },
      { 
        $set: { 
          customerId: newObjectId,
          customerNumber: oldId 
        } 
      }
    );
    repairsUpdated += result.modifiedCount;
  }
  console.log(`  Repairs updated: ${repairsUpdated}`);

  // Step 8: Update proposals
  console.log('\n--- Migrating Proposals ---');
  let proposalsUpdated = 0;
  
  for (const [oldId, newObjectId] of idMapping) {
    const result = await proposalsCollection.updateMany(
      { customerId: oldId },
      { 
        $set: { 
          customerId: newObjectId,
          customerNumber: oldId 
        } 
      }
    );
    proposalsUpdated += result.modifiedCount;
  }
  console.log(`  Proposals updated: ${proposalsUpdated}`);

  // =============================================
  // INVOICE MIGRATION: numeric _id -> ObjectId
  // =============================================
  console.log('\n\n========================================');
  console.log('  MIGRATING INVOICES');
  console.log('========================================');

  const existingInvoices = await invoicesCollection.find({}).toArray();
  console.log(`Found ${existingInvoices.length} invoices.`);

  const invoiceIdMapping: Map<number, mongoose.Types.ObjectId> = new Map();
  let invoicesMigrated = 0;
  let invoicesSkipped = 0;

  for (const invoice of existingInvoices) {
    const oldId = invoice._id;

    if (typeof oldId !== 'number') {
      // Already an ObjectId — just ensure invoiceNumber is set
      if (invoice.invoiceNumber === undefined) {
        console.log(`  Invoice ${oldId} has ObjectId but no invoiceNumber, skipping.`);
      }
      invoicesSkipped++;
      continue;
    }

    const newObjectId = new mongoose.Types.ObjectId();
    invoiceIdMapping.set(oldId, newObjectId);

    const newInvoice: any = {
      ...invoice,
      _id: newObjectId,
      invoiceNumber: oldId,
    };

    // Update search field to include invoiceNumber
    if (newInvoice.search) {
      // The old search already contains the old _id, which is the same as invoiceNumber
    } else {
      newInvoice.search = `${oldId} ${newInvoice.customerFirstName || ''} ${newInvoice.customerLastName || ''}`;
    }

    try {
      await invoicesCollection.insertOne(newInvoice);
      invoicesMigrated++;
      if (invoicesMigrated % 100 === 0) {
        console.log(`  Migrated ${invoicesMigrated} invoices...`);
      }
    } catch (error: any) {
      console.error(`  Error inserting new invoice for old _id ${oldId}:`, error.message);
    }
  }

  console.log(`  Invoices migrated: ${invoicesMigrated}, skipped: ${invoicesSkipped}`);

  // Delete old invoice documents with numeric _id
  console.log('\n--- Removing old invoice documents ---');
  const oldInvoiceIds = Array.from(invoiceIdMapping.keys());
  if (oldInvoiceIds.length > 0) {
    const deleteResult = await invoicesCollection.deleteMany({
      _id: { $in: oldInvoiceIds } as any
    });
    console.log(`  Deleted ${deleteResult.deletedCount} old invoice documents.`);
  }

  // =============================================
  // RETURN MIGRATION: numeric _id -> ObjectId
  // =============================================
  console.log('\n\n========================================');
  console.log('  MIGRATING RETURNS');
  console.log('========================================');

  const existingReturns = await returnsCollection.find({}).toArray();
  console.log(`Found ${existingReturns.length} returns.`);

  const returnIdMapping: Map<number, mongoose.Types.ObjectId> = new Map();
  let returnsMigrated = 0;
  let returnsSkipped = 0;

  for (const returnDoc of existingReturns) {
    const oldId = returnDoc._id;

    if (typeof oldId !== 'number') {
      if (returnDoc.returnNumber === undefined) {
        console.log(`  Return ${oldId} has ObjectId but no returnNumber, skipping.`);
      }
      returnsSkipped++;
      continue;
    }

    const newObjectId = new mongoose.Types.ObjectId();
    returnIdMapping.set(oldId, newObjectId);

    // Look up the new invoice ObjectId for this return's invoiceId
    const oldInvoiceId = returnDoc.invoiceId;
    let newInvoiceId: any = oldInvoiceId; // keep as-is by default
    let invoiceNumber: number | undefined;
    if (typeof oldInvoiceId === 'number' || (typeof oldInvoiceId === 'string' && /^\d+$/.test(oldInvoiceId))) {
      const numericInvoiceId = Number(oldInvoiceId);
      const mappedInvoiceId = invoiceIdMapping.get(numericInvoiceId);
      if (mappedInvoiceId) {
        newInvoiceId = mappedInvoiceId;
        invoiceNumber = numericInvoiceId;
      }
    }

    const newReturn: any = {
      ...returnDoc,
      _id: newObjectId,
      returnNumber: oldId,
      invoiceId: newInvoiceId,
    };

    if (invoiceNumber !== undefined) {
      newReturn.invoiceNumber = invoiceNumber;
    }

    // Update search field
    if (newReturn.search) {
      // Old search already contains the old _id
    } else {
      newReturn.search = `${oldId} ${newReturn.invoiceId || ''} ${newReturn.customerName || ''}`;
    }

    try {
      await returnsCollection.insertOne(newReturn);
      returnsMigrated++;
      if (returnsMigrated % 100 === 0) {
        console.log(`  Migrated ${returnsMigrated} returns...`);
      }
    } catch (error: any) {
      console.error(`  Error inserting new return for old _id ${oldId}:`, error.message);
    }
  }

  console.log(`  Returns migrated: ${returnsMigrated}, skipped: ${returnsSkipped}`);

  // Delete old return documents with numeric _id
  console.log('\n--- Removing old return documents ---');
  const oldReturnIds = Array.from(returnIdMapping.keys());
  if (oldReturnIds.length > 0) {
    const deleteResult = await returnsCollection.deleteMany({
      _id: { $in: oldReturnIds } as any
    });
    console.log(`  Deleted ${deleteResult.deletedCount} old return documents.`);
  }

  // =============================================
  // UPDATE CROSS-REFERENCES
  // =============================================
  // Update invoiceId references in returns that weren't migrated above
  // (returns that already had ObjectId _id but still have old numeric invoiceId)
  console.log('\n--- Updating invoiceId references in returns ---');
  let invoiceRefsUpdated = 0;
  for (const [oldId, newObjectId] of invoiceIdMapping) {
    // Update returns where invoiceId is the old numeric string
    const result = await returnsCollection.updateMany(
      { invoiceId: String(oldId) },
      { $set: { invoiceId: newObjectId, invoiceNumber: oldId } }
    );
    invoiceRefsUpdated += result.modifiedCount;
    // Also try matching as number
    const result2 = await returnsCollection.updateMany(
      { invoiceId: oldId as any },
      { $set: { invoiceId: newObjectId, invoiceNumber: oldId } }
    );
    invoiceRefsUpdated += result2.modifiedCount;
  }
  console.log(`  Invoice references updated in returns: ${invoiceRefsUpdated}`);

  // Also update the checkReturnByInvoiceId references - the invoiceId field
  // in the invoice action menu passes invoice._id which is now an ObjectId string

  // =============================================
  // ADD TENANT ID TO ALL COLLECTIONS
  // =============================================
  const DEFAULT_TENANT_ID = new mongoose.Types.ObjectId('67f48a2050abe41246b22a87');
  const collectionsToUpdate = [
    { name: 'customers', collection: customersCollection },
    { name: 'invoices', collection: invoicesCollection },
    { name: 'returns', collection: returnsCollection },
    { name: 'wanteds', collection: wantedsCollection },
    { name: 'repairs', collection: repairsCollection },
    { name: 'proposals', collection: proposalsCollection },
  ];

  // Also add logs, outs, and products
  const logsCollection = db.collection('logs');
  const outsCollection = db.collection('outs');
  const productsCollection = db.collection('products');
  collectionsToUpdate.push(
    { name: 'logs', collection: logsCollection },
    { name: 'outs', collection: outsCollection },
    { name: 'products', collection: productsCollection },
  );

  console.log('\n========================================');
  console.log('  ADDING TENANT ID TO ALL COLLECTIONS');
  console.log('========================================');

  for (const { name, collection } of collectionsToUpdate) {
    const result = await collection.updateMany(
      { tenantId: { $exists: false } },
      { $set: { tenantId: DEFAULT_TENANT_ID } }
    );
    console.log(`  ${name}: ${result.modifiedCount} documents updated with tenantId`);
  }

  // =============================================
  // SEED TENANT-SCOPED COUNTERS
  // =============================================
  console.log('\n========================================');
  console.log('  SEEDING TENANT-SCOPED COUNTERS');
  console.log('========================================');

  const countersCollection = db.collection('counters');
  const TENANT_ID_STR = '67f48a2050abe41246b22a87';

  // Map of old counter _id to new tenant-scoped key
  const counterNames = ['customerNumber', 'invoiceNumber', 'returnNumber', 'repairNumber', 'proposalNumber'];

  for (const counterName of counterNames) {
    const tenantKey = `${counterName}_${TENANT_ID_STR}`;
    
    // Check if tenant-scoped counter already exists
    const existing = await countersCollection.findOne({ _id: tenantKey as any });
    if (existing) {
      console.log(`  ${counterName}: tenant-scoped counter already exists (seq=${existing.seq}), skipping`);
      continue;
    }

    // Get the old counter value
    const oldCounter = await countersCollection.findOne({ _id: counterName as any });
    if (oldCounter) {
      await countersCollection.insertOne({
        _id: tenantKey as any,
        tenantId: DEFAULT_TENANT_ID,
        seq: oldCounter.seq
      });
      console.log(`  ${counterName}: created tenant-scoped counter with seq=${oldCounter.seq}`);
    } else {
      // No old counter exists; find max value from the collection
      let maxSeq = 0;
      if (counterName === 'customerNumber') {
        const maxDoc = await customersCollection.find({}).sort({ customerNumber: -1 }).limit(1).toArray();
        maxSeq = maxDoc[0]?.customerNumber || 0;
      } else if (counterName === 'invoiceNumber') {
        const maxDoc = await invoicesCollection.find({}).sort({ invoiceNumber: -1 }).limit(1).toArray();
        maxSeq = maxDoc[0]?.invoiceNumber || 0;
      } else if (counterName === 'returnNumber') {
        const maxDoc = await returnsCollection.find({}).sort({ returnNumber: -1 }).limit(1).toArray();
        maxSeq = maxDoc[0]?.returnNumber || 0;
      } else if (counterName === 'repairNumber') {
        const maxDoc = await repairsCollection.find({}).sort({ repairNumber: -1 }).limit(1).toArray();
        const repairNum = parseInt(maxDoc[0]?.repairNumber || '0', 10);
        maxSeq = isNaN(repairNum) ? 0 : repairNum;
      } else if (counterName === 'proposalNumber') {
        const maxDoc = await proposalsCollection.find({}).sort({ _id: -1 }).limit(1).toArray();
        maxSeq = typeof maxDoc[0]?._id === 'number' ? maxDoc[0]._id : 0;
      }

      if (maxSeq > 0) {
        await countersCollection.insertOne({
          _id: tenantKey as any,
          tenantId: DEFAULT_TENANT_ID,
          seq: maxSeq
        });
        console.log(`  ${counterName}: no old counter found, created from max value seq=${maxSeq}`);
      } else {
        console.log(`  ${counterName}: no old counter and no existing data, skipping`);
      }
    }
  }

  // =============================================
  // VERIFICATION
  // =============================================
  console.log('\n--- Verification ---');
  
  const newCustomerCount = await customersCollection.countDocuments({});
  const customersWithNumber = await customersCollection.countDocuments({ customerNumber: { $exists: true } });
  const customersWithNumericId = await customersCollection.countDocuments({ 
    _id: { $type: 'number' } as any 
  });
  
  console.log(`  Total customers: ${newCustomerCount}`);
  console.log(`  Customers with customerNumber: ${customersWithNumber}`);
  console.log(`  Customers still with numeric _id: ${customersWithNumericId}`);

  const newInvoiceCount = await invoicesCollection.countDocuments({});
  const invoicesWithNumber = await invoicesCollection.countDocuments({ invoiceNumber: { $exists: true } });
  const invoicesWithNumericId = await invoicesCollection.countDocuments({
    _id: { $type: 'number' } as any
  });

  console.log(`  Total invoices: ${newInvoiceCount}`);
  console.log(`  Invoices with invoiceNumber: ${invoicesWithNumber}`);
  console.log(`  Invoices still with numeric _id: ${invoicesWithNumericId}`);

  const newReturnCount = await returnsCollection.countDocuments({});
  const returnsWithNumber = await returnsCollection.countDocuments({ returnNumber: { $exists: true } });
  const returnsWithNumericId = await returnsCollection.countDocuments({
    _id: { $type: 'number' } as any
  });

  console.log(`  Total returns: ${newReturnCount}`);
  console.log(`  Returns with returnNumber: ${returnsWithNumber}`);
  console.log(`  Returns still with numeric _id: ${returnsWithNumericId}`);
  
  const invoicesWithNumericCustomerId = await invoicesCollection.countDocuments({
    customerId: { $type: 'number' } as any
  });
  const returnsWithNumericCustomerId = await returnsCollection.countDocuments({
    customerId: { $type: 'number' } as any
  });
  const wantedsWithNumericCustomerId = await wantedsCollection.countDocuments({
    customerId: { $type: 'number' } as any
  });
  const repairsWithNumericCustomerId = await repairsCollection.countDocuments({
    customerId: { $type: 'number' } as any
  });
  
  console.log(`  Invoices still with numeric customerId: ${invoicesWithNumericCustomerId}`);
  console.log(`  Returns still with numeric customerId: ${returnsWithNumericCustomerId}`);
  console.log(`  Wanteds still with numeric customerId: ${wantedsWithNumericCustomerId}`);
  console.log(`  Repairs still with numeric customerId: ${repairsWithNumericCustomerId}`);

  const hasIssues = customersWithNumericId > 0 || invoicesWithNumericId > 0 || 
      returnsWithNumericId > 0 || invoicesWithNumericCustomerId > 0 || 
      returnsWithNumericCustomerId > 0 || wantedsWithNumericCustomerId > 0 ||
      repairsWithNumericCustomerId > 0;

  if (hasIssues) {
    console.log('\n⚠️  WARNING: Some documents still have numeric IDs. Review the output above.');
  } else {
    console.log('\n✅ Migration completed successfully!');
  }

  console.log('\n--- Summary ---');
  console.log(`  Customers migrated: ${customersMigrated}`);
  console.log(`  Invoices migrated: ${invoicesMigrated}`);
  console.log(`  Returns migrated: ${returnsMigrated}`);
  console.log(`  Customer refs updated in invoices: ${invoicesUpdated}`);
  console.log(`  Customer refs updated in returns: ${returnsUpdated}`);
  console.log(`  Customer refs updated in wanteds: ${wantedsUpdated}`);
  console.log(`  Customer refs updated in repairs: ${repairsUpdated}`);
  console.log(`  Customer refs updated in proposals: ${proposalsUpdated}`);
  console.log(`  Invoice refs updated in returns: ${invoiceRefsUpdated}`);

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB.');
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
