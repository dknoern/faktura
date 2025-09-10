import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local FIRST
config({ path: path.resolve(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import { logModel } from '../lib/models/log';

interface LogDocument {
  _id: mongoose.Types.ObjectId;
  receivedFrom?: string;
  customerName?: string;
  vendor?: string;
  comments?: string;
  user?: string;
  search?: string;
  lineItems?: Array<{
    itemNumber?: string;
    name?: string;
    repairNumber?: string;
  }>;
}

function buildSearchField(log: LogDocument): string {
  const searchParts: string[] = [];
  
  // Add main fields
  if (log.receivedFrom) searchParts.push(log.receivedFrom);
  if (log.customerName) searchParts.push(log.customerName);
  if (log.vendor) searchParts.push(log.vendor);
  if (log.comments) searchParts.push(log.comments);
  if (log.user) searchParts.push(log.user);
  
  // Add line item details
  if (log.lineItems && log.lineItems.length > 0) {
    log.lineItems.forEach(item => {
      if (item.itemNumber) searchParts.push(item.itemNumber);
      if (item.name) searchParts.push(item.name);
      if (item.repairNumber) searchParts.push(item.repairNumber);
    });
  }
  
  // Join all parts and convert to lowercase for case-insensitive searching
  return searchParts.join(' ').toLowerCase();
}

async function rebuildLogSearchFields() {
  console.log('🔄 Starting log search field rebuild...');
  
  // Debug environment variables
  console.log('🔍 Environment check:');
  console.log('  - MONGODB_URI exists:', !!process.env.MONGODB_URI);
  console.log('  - MONGODB_URI length:', process.env.MONGODB_URI?.length || 0);
  console.log('  - MONGODB_URI starts with mongodb:', process.env.MONGODB_URI?.startsWith('mongodb') || false);
  
  try {
    // Connect directly to MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Get total count for progress tracking
    const totalLogs = await logModel.countDocuments({});
    console.log(`📊 Found ${totalLogs} logs to process`);
    
    if (totalLogs === 0) {
      console.log('ℹ️ No logs found to process');
      return;
    }
    
    let processed = 0;
    let updated = 0;
    const batchSize = 100;
    
    // Process logs in batches to avoid memory issues
    for (let skip = 0; skip < totalLogs; skip += batchSize) {
      const logs = await logModel.find({})
        .skip(skip)
        .limit(batchSize)
        .lean() as LogDocument[];
      
      console.log(`🔄 Processing batch ${Math.floor(skip / batchSize) + 1}/${Math.ceil(totalLogs / batchSize)} (${logs.length} logs)`);
      
      const bulkOps = [];
      
      for (const log of logs) {
        const newSearchField = buildSearchField(log);
        
        // Only update if search field is different or missing
        if (!log.search || log.search !== newSearchField) {
          bulkOps.push({
            updateOne: {
              filter: { _id: log._id },
              update: { $set: { search: newSearchField } }
            }
          });
          updated++;
        }
        processed++;
      }
      
      // Execute bulk operations if any
      if (bulkOps.length > 0) {
        await logModel.bulkWrite(bulkOps);
      }
      
      // Progress update
      const progress = ((processed / totalLogs) * 100).toFixed(1);
      console.log(`📈 Progress: ${processed}/${totalLogs} (${progress}%) - Updated: ${updated}`);
    }
    
    console.log('\n✅ Log search field rebuild completed!');
    console.log(`📊 Final Stats:`);
    console.log(`   - Total logs processed: ${processed}`);
    console.log(`   - Search fields updated: ${updated}`);
    console.log(`   - No changes needed: ${processed - updated}`);
    
    // Verification step
    console.log('\n🔍 Running verification...');
    const logsWithoutSearch = await logModel.countDocuments({ 
      $or: [
        { search: { $exists: false } },
        { search: null },
        { search: '' }
      ]
    });
    
    if (logsWithoutSearch === 0) {
      console.log('✅ Verification passed: All logs have search fields');
    } else {
      console.log(`⚠️ Warning: ${logsWithoutSearch} logs still missing search fields`);
    }
    
  } catch (error) {
    console.error('❌ Error rebuilding log search fields:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  rebuildLogSearchFields()
    .then(() => {
      console.log('🎉 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { rebuildLogSearchFields, buildSearchField };
