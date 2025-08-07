#!/usr/bin/env tsx

import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lager';
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || '67f48a2050abe41246b22a87';

interface OldCustomer {
  _id: number;
  firstName: string;
  lastName: string;
  company?: string;
  email?: string;
  phone?: string;
  cell?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  billingAddress1?: string;
  billingAddress2?: string;
  billingAddress3?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  billingCountry?: string;
  lastUpdated: Date;
  search?: string;
  copyAddress?: boolean;
  customerType?: string;
  status?: string;
  tenantId?: string | ObjectId;
}

interface NewCustomer extends Omit<OldCustomer, '_id' | 'tenantId'> {
  _id: ObjectId;
  customerNumber: number;
  tenantId?: ObjectId;
}

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function migrateCustomers() {
  try {
    console.log('🚀 Starting customer collection migration...');
    
    // Get the raw MongoDB collection (not the Mongoose model)
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const collection = db.collection('customers');
    
    // Find all customers that need migration (integer _id OR string tenantId that can be converted)
    const customers = await collection.find({
      $or: [
        { _id: { $type: 16 } }, // 16 is the BSON type code for 32-bit integer
        { 
          tenantId: { 
            $type: 2, // 2 is the BSON type code for string
            $regex: /^[0-9a-fA-F]{24}$/ // Valid ObjectId format
          } 
        }
      ]
    }).toArray();
    
    if (customers.length === 0) {
      console.log('ℹ️  No customers found that need migration (integer _id or convertible string tenantId).');
      return;
    }
    
    console.log(`📊 Found ${customers.length} customers that need migration`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const customer of customers) {
      try {
        const needsIdMigration = typeof customer._id === 'number';
        const needsTenantIdMigration = !customer.tenantId || customer.tenantId && typeof customer.tenantId === 'string' && customer.tenantId.match(/^[0-9a-fA-F]{24}$/);
        
        if (needsIdMigration) {
          // Handle _id migration (integer -> ObjectId)
          const oldId = customer._id;
          const newId = new ObjectId();
          
          // Create the new document structure
          const newCustomer: any = {
            ...customer,
            _id: newId,
            customerNumber: oldId
          };
          
          // Convert tenantId from string to ObjectId if it exists and is a valid ObjectId string
          if (needsTenantIdMigration) {

            try {

                // if customer.tenantId is not set, set to default tenantId
                if (!customer.tenantId) {
                    newCustomer.tenantId = new ObjectId(DEFAULT_TENANT_ID);
                } else {
                    newCustomer.tenantId = new ObjectId(customer.tenantId);
                }
              console.log(`✅ Migrated customer ${oldId} -> ${newId} (customerNumber: ${oldId}) + converted tenantId`);
            } catch (error) {
              console.log(`⚠️  Customer ${oldId}: Failed to convert tenantId '${customer.tenantId}' to ObjectId, keeping as string`);
            }
          } else {
            console.log(`✅ Migrated customer ${oldId} -> ${newId} (customerNumber: ${oldId})`);
          }
          
          // Insert the new document
          await collection.insertOne(newCustomer);
          
          // Delete the old document only after successful insertion
          await collection.deleteOne({ _id: oldId });
          
        } else if (needsTenantIdMigration) {
          // Handle only tenantId migration (string -> ObjectId)
          try {
            const tenantIdObjectId = new ObjectId(customer.tenantId);
            
            // Update the document with ObjectId tenantId
            const result = await collection.updateOne(
              { _id: customer._id },
              { $set: { tenantId: tenantIdObjectId } }
            );
            
            if (result.modifiedCount === 1) {
              console.log(`✅ Converted customer ${customer._id}: tenantId '${customer.tenantId}' -> ObjectId(${tenantIdObjectId})`);
            } else {
              throw new Error('No documents modified');
            }
          } catch (error) {
            console.error(`❌ Failed to convert tenantId for customer ${customer._id}:`, error);
            errorCount++;
            continue;
          }
        }
        
        successCount++;
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to migrate customer ${customer._id}:`, error);
      }
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully processed: ${successCount} customers`);
    console.log(`❌ Failed operations: ${errorCount} customers`);
    console.log(`📊 Total processed: ${customers.length} customers`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function verifyMigration() {
  try {
    console.log('\n🔍 Verifying migration...');
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const collection = db.collection('customers');
    
    // Check for any remaining integer _id documents
    const remainingIntegerIds = await collection.countDocuments({ _id: { $type: 16 } }); // 16 is the BSON type code for 32-bit integer
    
    // Check for documents with customerNumber field
    const documentsWithCustomerNumber = await collection.countDocuments({ customerNumber: { $exists: true } });
    
    // Check for documents with ObjectId _id
    const documentsWithObjectId = await collection.countDocuments({ _id: { $type: 7 } }); // 7 is the BSON type code for ObjectId
    
    // Check for documents with ObjectId tenantId
    const documentsWithObjectIdTenantId = await collection.countDocuments({ tenantId: { $type: 7 } }); // 7 is the BSON type code for ObjectId
    
    // Check for documents with string tenantId
    const documentsWithStringTenantId = await collection.countDocuments({ tenantId: { $type: 2 } }); // 2 is the BSON type code for string
    
    console.log(`📊 Verification Results:`);
    console.log(`   - Documents with integer _id: ${remainingIntegerIds}`);
    console.log(`   - Documents with customerNumber field: ${documentsWithCustomerNumber}`);
    console.log(`   - Documents with ObjectId _id: ${documentsWithObjectId}`);
    console.log(`   - Documents with ObjectId tenantId: ${documentsWithObjectIdTenantId}`);
    console.log(`   - Documents with string tenantId: ${documentsWithStringTenantId}`);
    
    if (remainingIntegerIds === 0 && documentsWithCustomerNumber > 0) {
      console.log('✅ Migration verification passed!');
    } else {
      console.log('⚠️  Migration verification found issues. Please review the results.');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

async function main() {
  try {
    await connectToDatabase();
    
    // Ask for confirmation before proceeding
    console.log('⚠️  This script will modify the customers collection by:');
    console.log('   1. Replacing integer _id values with new ObjectId values');
    console.log('   2. Adding a customerNumber field with the old _id value');
    console.log('   3. Converting string tenantId values to ObjectId (only valid 24-char hex strings)');
    console.log('   4. These operations cannot be easily reversed');
    console.log('\n🔄 Starting migration in 5 seconds...');
    
    // Wait 5 seconds to allow cancellation
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await migrateCustomers();
    await verifyMigration();
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Handle script interruption
process.on('SIGINT', async () => {
  console.log('\n⚠️  Script interrupted. Cleaning up...');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the migration
if (require.main === module) {
  main();
}

export { migrateCustomers, verifyMigration };
