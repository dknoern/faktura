// Seeds the throwaway Mongo with one tenant + customer + proposal + product +
// invoice so the dashboard pages have something to render.
//
// Idempotent: fixed ObjectIds, upserts. Safe to re-run.
//
//   node .claude/skills/run-faktura/seed.mjs
import { createRequire } from 'node:module'
import { loadEnv, PROJECT_DIR, TENANT_ID } from './session.mjs'

const require = createRequire(import.meta.url)
const { MongoClient, ObjectId } = await import(
  require.resolve('mongodb', { paths: [PROJECT_DIR] })
)

const TENANT = new ObjectId(TENANT_ID)
const CUSTOMER = new ObjectId('68f48a2050abe41246b22a01')
const PROPOSAL = new ObjectId('68f48a2050abe41246b22a02')
const PRODUCT = new ObjectId('68f48a2050abe41246b22a03')

// Dates are stored as UTC midnight, matching what upsertProposal writes.
export const SEED = {
  tenantId: TENANT_ID,
  customerId: CUSTOMER.toString(),
  proposalId: PROPOSAL.toString(),
  productId: PRODUCT.toString(),
  proposalDate: '2026-03-14',
}

const uri = process.env.MONGODB_URI || loadEnv().MONGODB_URI
const c = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 })
await c.connect()
const db = c.db()

await db.collection('tenants').updateOne(
  { _id: TENANT },
  { $set: { name: 'lager', companyName: 'Lager Verify Co', status: 'Active' } },
  { upsert: true }
)

await db.collection('counters').updateOne(
  { _id: 'customerNumber' },
  { $setOnInsert: { seq: 1001 } },
  { upsert: true }
)

await db.collection('customers').updateOne(
  { _id: CUSTOMER },
  {
    $set: {
      customerNumber: 1001,
      firstName: 'Ada',
      lastName: 'Lovelace',
      emails: [{ email: 'ada@example.test', type: 'work' }],
      phones: [{ phone: '555-0142', type: 'mobile' }],
      address1: '1 Analytical Way',
      city: 'Boston',
      state: 'MA',
      zip: '02108',
      country: 'US',
      status: 'Active',
      customerType: 'Retail',
      lastUpdated: new Date('2026-05-01T00:00:00Z'),
      search: 'ada lovelace 1001 boston',
      tenantId: TENANT,
    },
  },
  { upsert: true }
)

await db.collection('products').updateOne(
  { _id: PRODUCT },
  {
    $set: {
      sku: 'VERIFY-001',
      name: 'Vintage Rolex Datejust',
      longDesc: '36mm, jubilee bracelet',
      price: 4200,
      cost: 2600,
      status: 'In Stock',
      lastUpdated: new Date('2026-05-01T00:00:00Z'),
      search: 'verify-001 vintage rolex datejust in stock',
      tenantId: TENANT,
    },
  },
  { upsert: true }
)

await db.collection('proposals').updateOne(
  { _id: PROPOSAL },
  {
    $set: {
      customerId: CUSTOMER,
      customerNumber: 1001,
      customerFirstName: 'Ada',
      customerLastName: 'Lovelace',
      customerEmail: 'ada@example.test',
      customerPhone: '555-0142',
      date: new Date(`${SEED.proposalDate}T00:00:00Z`),
      total: 4200,
      lineItems: [
        { name: 'Vintage Rolex Datejust', longDesc: '36mm, jubilee bracelet', amount: 4200 },
      ],
      conditions: 'Valid for 30 days.',
      status: 'Draft',
      search: `ada lovelace ${SEED.proposalDate} vintage rolex datejust`,
      tenantId: TENANT,
    },
  },
  { upsert: true }
)

console.log(JSON.stringify(SEED, null, 2))
console.log(`\nproposal edit: http://localhost:3000/proposals/${SEED.proposalId}/edit`)
console.log(`proposal view: http://localhost:3000/proposals/${SEED.proposalId}/view`)
await c.close()
