# Faktura

A modern, multi-tenant inventory and sales management system designed for jewelry and watch retailers. Built with Next.js 15, MongoDB, and Auth0.

## Features

- **Inventory Management**: Track watches, jewelry, and accessories with detailed specifications
- **Customer Management**: Maintain customer records with billing and shipping addresses
- **Invoice & Proposal Generation**: Create professional invoices and proposals with automated tax calculation
- **Repair Tracking**: Manage repair orders with status tracking and customer notifications
- **Returns Management**: Handle return merchandise authorizations (RMAs)
- **Activity Logging**: Track item movements (shows, consignments, loans)
- **Multi-tenant Architecture**: Isolated data and secure access per business
- **Email Automation**: Automated invoice, proposal, and repair notification emails via AWS SES
- **Tax Integration**: Real-time tax calculation using Avalara AvaTax
- **Image Management**: Product image upload and storage with AWS S3
- **Stripe Payment Links**: Optional per-tenant Stripe integration that adds a credit-card / ACH payment link to each invoice PDF and customer email

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Auth0 via NextAuth.js
- **UI**: React with shadcn/ui components and Tailwind CSS
- **Schema Validation**: Zod with @zodyac/zod-mongoose
- **Cloud Services**: AWS S3 (storage), AWS SES (email)
- **Tax Calculation**: Avalara AvaTax

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB instance (local or cloud)
- Auth0 account
- AWS account (for S3 and SES)
- Avalara AvaTax account (optional, for tax calculation)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd faktura
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory. See `.env.example` for required variables:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/faktura

# Auth0
AUTH0_SECRET=<generate-a-secret>
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://<your-tenant>.auth0.com
AUTH0_CLIENT_ID=<your-client-id>
AUTH0_CLIENT_SECRET=<your-client-secret>

# AWS
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_REGION=us-east-1
S3_BUCKET_NAME=<your-bucket-name>

# Encryption key for tenant secrets stored at rest (Stripe, AvaTax, …); 32-byte base64
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
CREDENTIALS_ENCRYPTION_KEY=<32-byte-base64>
```

4. Generate the `CREDENTIALS_ENCRYPTION_KEY`:

This must be a 32-byte value, base64-encoded. Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Or, if you prefer `openssl`:

```bash
openssl rand -base64 32
```

Paste the output into `.env.local` as the `CREDENTIALS_ENCRYPTION_KEY` value. Keep this value somewhere safe (a password manager works) — losing it makes every stored tenant secret (Stripe, AvaTax, future integrations) unrecoverable, and admins would have to re-enter them. Rotating it requires the same re-entry, so don't rotate casually.

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Commands

```bash
npm run dev          # Start development server with Turbo mode
npm run debug        # Start development server with Node.js inspector
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
```

## Project Structure

```
faktura/
├── app/
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── customers/     # Customer management
│   │   ├── inventory/     # Product inventory
│   │   ├── invoices/      # Invoice management
│   │   ├── repairs/       # Repair tracking
│   │   └── ...
│   ├── actions/           # Server actions
│   ├── api/              # API routes
│   └── auth/             # NextAuth.js routes
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── customers/        # Customer-specific components
│   ├── invoices/         # Invoice-specific components
│   └── ...
├── lib/
│   ├── models/           # Mongoose/Zod schemas
│   ├── actions/          # Business logic
│   ├── dbConnect.ts      # MongoDB connection
│   └── ...
└── public/              # Static assets
```

## Architecture

### Multi-tenancy

All data is isolated by `tenantId`, provided through Auth0 custom claims. Each business has its own isolated data while sharing the same application instance.

### Schema-first Development

Uses Zod schemas that generate both TypeScript types and Mongoose schemas via @zodyac/zod-mongoose, ensuring type safety and runtime validation.

### Component Patterns

Each entity follows a consistent component structure:
- `form.tsx` - Create/edit forms with validation
- `table.tsx` - Data tables with search and pagination
- `view.tsx` - Read-only detail views
- `action-menu.tsx` - Dropdown menus for entity actions

## Key Features

### Auto-incrementing IDs

Uses a Counter collection pattern to generate sequential, human-friendly IDs for customers, invoices, and other entities.

### Product History Tracking

Comprehensive audit trail for all product changes, tracking price updates, status changes, and location movements.

### Inventory Status Management

Track items across multiple states: In Stock, Out at Show, On Consignment, Sold, etc.

### Stripe Payment Links (per-tenant)

Tenants can opt in to Stripe by entering a Stripe restricted secret key on the Profile / Payments page (admins only). Once enabled:

- Every new or updated invoice with a positive total triggers `ensureInvoicePaymentLink` after save, which creates a Stripe Payment Link for the invoice's total and persists the URL on the invoice document.
- The invoice PDF renders a "Pay Online" block with a clickable link.
- The "Send Invoice" email body adds: "You can pay by check, ACH, or credit card. For ACH or credit card you can use this payment link."

Notes:

- The Stripe restricted key needs scopes sufficient to `POST /v1/payment_links` (write access on Payment Links and the implied Products / Prices it creates inline), plus `balance:read` for the save-time probe.
- Stripe credentials are stored AES-256-GCM-encrypted at rest using `CREDENTIALS_ENCRYPTION_KEY` (the same key now also protects AvaTax license keys). Losing that env var makes existing stored credentials unrecoverable — tenants would need to re-enter them.
- Failures from Stripe never block invoice save. Look for `[stripe]` lines in server logs to diagnose missing/invalid keys.
- Out of scope today: automatic paid-status webhooks, refunds, partial payments, Stripe Connect.

### AvaTax (per-tenant)

AvaTax credentials are configured per-tenant on the Profile → AvaTax section (admins only). When AvaTax is disabled for a tenant, all invoices save with `tax: 0` and the "Tax exempt" checkbox is hidden from the invoice form. When AvaTax is enabled:

- Invoices with no `shipState`, `taxExempt: true`, or `methodOfSale === 'Ebay'` skip AvaTax and use `tax: 0`.
- Invoices shipping to `TX` skip AvaTax and use a hardcoded 8.25% rate.
- All other invoices go through AvaTax using the tenant's stored account id, license key, environment, and company code.

Notes:

- AvaTax license keys are stored AES-256-GCM-encrypted using `CREDENTIALS_ENCRYPTION_KEY`.
- Save-time probe uses AvaTax's authenticated `ping` endpoint; bad credentials are rejected before persistence.
- The `AVATAX_*` env vars are gone — they have no effect after this change.

## Deployment

### Docker

Build and run with Docker:

```bash
docker build -t faktura .
docker run -p 3000:3000 --env-file .env.local faktura
```

### Vercel

This application can be deployed to Vercel:

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests as needed
5. Submit a pull request

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.
