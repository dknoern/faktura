// Seed invoices covering every PaymentBadge state so the invoice list can be
// eyeballed: each single payment method, a split (two methods), a partial
// payment, and an unpaid invoice. Also flips on the tenant `payments` feature
// flag, without which the Paid column is not rendered at all.
//
// Safe to re-run: fixed _ids, upserts. Refuses to touch any mongod that is not
// the throwaway container planted by mongo.sh.
import { MongoClient, ObjectId } from 'mongodb';
import { readFileSync } from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const URI = 'mongodb://localhost:27017/lager?replicaSet=rs0';
const TENANT = new ObjectId('67f48a2050abe41246b22a87');
const CUSTOMER = new ObjectId('68f48a2050abe41246b22a01');

const client = new MongoClient(URI);
await client.connect();
const db = client.db('lager');

// Same guard seed.mjs uses — never write to the user's real database.
const marker = await db.collection('faktura_verify_marker').findOne({});
if (!marker) {
  console.error('refusing to seed: this mongod has no faktura_verify_marker (not the throwaway container)');
  await client.close();
  process.exit(1);
}

await db.collection('tenants').updateOne(
  { _id: TENANT },
  { $set: { 'features.payments': true } }
);

const CASES = [
  { n: 9101, name: 'Card Only',   total: 1200, pays: [['credit_card', 1200]] },
  { n: 9102, name: 'Ach Only',    total: 2500, pays: [['ach', 2500]] },
  { n: 9103, name: 'Cash Only',   total: 300,  pays: [['cash', 300]] },
  { n: 9104, name: 'Check Only',  total: 850,  pays: [['check', 850]] },
  { n: 9105, name: 'Split Pay',   total: 2000, pays: [['credit_card', 1500], ['cash', 500]] },
  { n: 9106, name: 'Partial Pay', total: 1000, pays: [['check', 400]] },
  { n: 9107, name: 'Unpaid One',  total: 750,  pays: [] },
];

let i = 0;
for (const c of CASES) {
  const invoiceId = new ObjectId(`68f48a2050abe41246b23${String(100 + i).padStart(3, '0')}`);
  i++;

  await db.collection('invoices').updateOne(
    { _id: invoiceId },
    {
      $set: {
        tenantId: TENANT,
        invoiceNumber: c.n,
        customerId: CUSTOMER,
        customerFirstName: c.name.split(' ')[0],
        customerLastName: c.name.split(' ')[1] ?? 'Test',
        date: new Date('2026-10-20T00:00:00.000Z'),
        lineItems: [{ itemNumber: `IT-${c.n}`, name: c.name, amount: c.total }],
        total: c.total,
        invoiceType: 'Invoice',
        status: 'Active',
        trackingNumber: '',
        search: `${c.n} ${c.name}`,
      },
    },
    { upsert: true }
  );

  await db.collection('payments').deleteMany({ invoiceId });
  for (const [method, amount] of c.pays) {
    await db.collection('payments').insertOne({
      tenantId: TENANT,
      invoiceId,
      date: new Date('2026-10-21T00:00:00.000Z'),
      amount,
      method,
      notes: 'seeded for badge verification',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  console.log(`  #${c.n} ${c.name.padEnd(12)} total=$${String(c.total).padEnd(5)} ${c.pays.map((p) => p[0]).join('+') || '(unpaid)'}`);
}

console.log('\npayments feature flag: enabled');
console.log('open: http://localhost:3000/invoices');
await client.close();
