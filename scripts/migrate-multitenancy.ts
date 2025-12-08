import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { customerModel } from '../lib/models/customer';
import { Invoice } from '../lib/models/invoice';
import { Return } from '../lib/models/return';
import { Repair } from '../lib/models/repair';
import { Tenant } from '../lib/models/tenant';
import { Counter } from '../lib/models/counter';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env.local');
    process.exit(1);
}

async function migrate() {
    try {
        await mongoose.connect(MONGODB_URI as string);
        console.log('Connected to MongoDB');

        // 1. Get or Create Default Tenant
        let defaultTenant = await Tenant.findOne({ isDefault: true });
        if (!defaultTenant) {
            console.log('No default tenant found, creating one...');
            defaultTenant = await Tenant.create({
                name: 'Default Tenant',
                isDefault: true,
                // Add other required fields with dummy data if needed
            });
            console.log('Created default tenant:', defaultTenant._id);
        } else {
            console.log('Found default tenant:', defaultTenant._id);
        }

        const tenantId = defaultTenant._id;

        // 2. Migrate Counters
        console.log('Migrating Counters...');
        const counters = await Counter.find({ _id: { $exists: true }, tenant: { $exists: false } });
        console.log(`Found ${counters.length} legacy counters to migrate.`);

        for (const counter of counters) {
            const modelName = counter._id.replace('Number', '').toLowerCase(); // e.g. 'invoiceNumber' -> 'invoice'
            // Check if it's one of our target models
            if (['customer', 'invoice', 'return', 'repair'].includes(modelName)) {
                console.log(`Migrating counter for ${modelName}...`);

                // Update the existing counter or create a new one with tenant/model
                // Since we modified the schema, we can just update this document if we want,
                // but it's safer to create a new entry and keep the old one or delete it.
                // Let's create a new entry for the default tenant.

                await Counter.findOneAndUpdate(
                    { tenant: tenantId, model: modelName },
                    { $set: { seq: counter.seq } },
                    { upsert: true, new: true }
                );

                // Optionally delete the old counter or leave it
                // await Counter.deleteOne({ _id: counter._id });
            }
        }
        console.log('Counters migrated.');

        // 3. Migrate Customers
        console.log('Migrating Customers...');
        // Use raw collection to avoid schema validation errors on read
        const rawCustomers = await mongoose.connection.db.collection('customers').find({ _id: { $type: 'number' } }).toArray();
        console.log(`Found ${rawCustomers.length} customers to migrate.`);

        for (const customerObj of rawCustomers) {
            const oldId = customerObj._id;
            delete customerObj._id; // Remove old numeric ID

            // Ensure required fields are present and meet length requirements
            if (!customerObj.firstName || customerObj.firstName.length < 2) customerObj.firstName = "Unknown";
            if (!customerObj.lastName || customerObj.lastName.length < 2) customerObj.lastName = "Unknown";

            // Create new document using the model to ensure validation and defaults
            const newCustomer = new customerModel({
                ...customerObj,
                customerNumber: oldId,
                tenant: tenantId,
            });

            await newCustomer.save();
            await mongoose.connection.db.collection('customers').deleteOne({ _id: oldId });

            // Update Tenant Counter just in case
            await Counter.findOneAndUpdate(
                { tenant: tenantId, model: 'customer' },
                { $max: { seq: oldId } },
                { upsert: true }
            );
        }
        console.log('Customers migrated.');

        // 4. Migrate Invoices
        console.log('Migrating Invoices...');
        const rawInvoices = await mongoose.connection.db.collection('invoices').find({ _id: { $type: 'number' } }).toArray();
        console.log(`Found ${rawInvoices.length} invoices to migrate.`);

        for (const invoiceObj of rawInvoices) {
            const oldId = invoiceObj._id;
            delete invoiceObj._id;

            const newInvoice = new Invoice({
                ...invoiceObj,
                invoiceNumber: oldId,
                tenant: tenantId,
            });

            await newInvoice.save();
            await mongoose.connection.db.collection('invoices').deleteOne({ _id: oldId });

            // Update Tenant Counter
            await Counter.findOneAndUpdate(
                { tenant: tenantId, model: 'invoice' },
                { $max: { seq: oldId } },
                { upsert: true }
            );
        }
        console.log('Invoices migrated.');

        // 5. Migrate Returns
        console.log('Migrating Returns...');
        const rawReturns = await mongoose.connection.db.collection('returns').find({ _id: { $type: 'number' } }).toArray();
        console.log(`Found ${rawReturns.length} returns to migrate.`);

        for (const returnObj of rawReturns) {
            const oldId = returnObj._id;
            delete returnObj._id;

            // Ensure required fields
            if (!returnObj.customerName) returnObj.customerName = "Unknown";
            if (!returnObj.invoiceId) returnObj.invoiceId = "Unknown";
            if (returnObj.totalReturnAmount == null) returnObj.totalReturnAmount = 0;
            if (returnObj.subTotal == null) returnObj.subTotal = 0;
            if (returnObj.salesTax == null) returnObj.salesTax = 0;

            const newReturn = new Return({
                ...returnObj,
                returnNumber: oldId,
                tenant: tenantId,
            });

            await newReturn.save();
            await mongoose.connection.db.collection('returns').deleteOne({ _id: oldId });

            // Update Tenant Counter
            await Counter.findOneAndUpdate(
                { tenant: tenantId, model: 'return' },
                { $max: { seq: oldId } },
                { upsert: true }
            );
        }
        console.log('Returns migrated.');

        // 6. Migrate Repairs
        console.log('Migrating Repairs...');
        // Repairs already have ObjectId _id, just need to add tenant
        const repairs = await Repair.find({ tenant: { $exists: false } });
        console.log(`Found ${repairs.length} repairs to migrate.`);

        for (const repair of repairs) {
            repair.tenant = tenantId;
            await repair.save();
        }
        console.log('Repairs migrated.');

        console.log('Migration complete.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
