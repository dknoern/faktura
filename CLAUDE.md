# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbo mode
- `npm run debug` - Start development server with Node.js inspector for debugging
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

## Architecture Overview

This is a Next.js 15 application with App Router architecture built for jewelry/watch inventory management. The application follows a multi-tenant SaaS pattern with Auth0 authentication.

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Auth0 via NextAuth.js
- **UI**: React with shadcn/ui components and Tailwind CSS
- **Schema Validation**: Zod with @zodyac/zod-mongoose for MongoDB integration
- **External Services**: AWS S3 (images), AWS SES (email), AvaTax (tax calculation)

### Directory Structure

**App Router Structure (`app/`):**
- `(dashboard)/` - Protected dashboard routes with shared layout
- `api/` - API routes for CRUD operations and integrations
- `auth/` - NextAuth.js authentication routes
- `actions/` - Server actions for form handling and data mutations

**Core Libraries (`lib/`):**
- `models/` - Mongoose/Zod schemas for entities (Customer, Product, Invoice, etc.)
- `actions/` - Business logic and database operations
- `dbConnect.ts` - MongoDB connection utility with caching
- Various utility modules for rendering, tax calculation, and data processing

**Components (`components/`):**
- `ui/` - Reusable shadcn/ui components
- Entity-specific component directories (customers/, invoices/, products/, etc.)
- Each entity follows a pattern: form.tsx, table.tsx, view.tsx, action-menu.tsx

### Key Architectural Patterns

**Multi-tenancy**: All data models include `tenantId` field. Auth0 provides tenant information via custom claims (`https://fakturian.com/tenantId`).

**Schema-first Development**: Uses Zod schemas that generate both TypeScript types and Mongoose schemas via @zodyac/zod-mongoose.

**Server Actions Pattern**: Form submissions and mutations use Next.js server actions in `app/actions/` rather than traditional API routes.

**Component Organization**: Entity components are grouped by functionality:
- `form.tsx` - Create/edit forms
- `table.tsx` - Data tables with search and pagination
- `view.tsx` - Read-only detail views
- `action-menu.tsx` - Dropdown menus for entity actions

**Auto-incrementing IDs**: Uses a Counter collection pattern for generating sequential IDs for customers, invoices, etc.

### Data Models

**Core Entities:**
- Customer: Contact information with billing/shipping addresses
- Product: Inventory items with detailed watch/jewelry specifications
- Invoice: Sales transactions with line items and tax calculation
- Repair: Service orders with status tracking
- Return: Return merchandise authorizations
- Log: Activity tracking for items (login/logout from shows)
- Wanted: Item that is being looked for on behalf of a customr

**Special Features:**
- Product history tracking with detailed audit trail
- Complex inventory status management (In Stock, Out at Show, Consignment, etc.)
- Multi-level addressing (regular + billing addresses)
- Flexible payment method tracking

### Authentication & Authorization

Uses NextAuth.js with Auth0 provider. Session includes:
- `tenantId` - Isolates data per business
- `tenantName` - Display name for business
- `fullName` - User's full name
- Route protection via middleware for all dashboard routes

### External Integrations

- **AWS S3**: Product image storage and serving
- **AWS SES**: Automated email for invoices, proposals, repairs
- **AvaTax**: Real-time tax calculation for sales
- **Auth0**: Multi-tenant user authentication

### Development Notes

- Environment variables required: `MONGODB_URI`, Auth0 config, AWS credentials, AvaTax credentials
- Uses MongoDB connection caching to prevent connection exhaustion in development
- Hardcoded tenant ID in layout.tsx for demo purposes
- Mixed JS/TS files (legacy JavaScript models being gradually migrated to TypeScript)

### Development Practices

- Use server actions rather than APIs when possible