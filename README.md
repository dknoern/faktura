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

# AvaTax (optional)
AVATAX_ACCOUNT_ID=<your-account-id>
AVATAX_LICENSE_KEY=<your-license-key>
AVATAX_ENVIRONMENT=sandbox
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

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
