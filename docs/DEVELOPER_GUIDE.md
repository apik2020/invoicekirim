# Developer Guide - NotaBener

Welcome to NotaBener! This guide will help you get started with development and understand our codebase architecture and patterns.

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (local or remote like Neon)
- Git

### Setup Steps

1. **Clone repository**
```bash
git clone <repository-url>
cd invoicekirim
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct database URL (for Neon/serverless)
- `NEXTAUTH_URL` - http://localhost:3000 (dev)
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXT_PUBLIC_APP_URL` - http://localhost:3000 (dev)

4. **Setup database**
```bash
# Run migrations
npx prisma migrate dev

# Seed database (optional)
npm run db:seed

# Open Prisma Studio to view data
npx prisma studio
```

5. **Run development server**
```bash
npm run dev
```

Visit http://localhost:3000 to see the app!

## Project Structure

```
invoicekirim/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes (~123 routes)
│   │   │   ├── invoices/     # Invoice endpoints
│   │   │   ├── clients/      # Client endpoints
│   │   │   ├── payments/     # Payment endpoints
│   │   │   ├── teams/        # Team collaboration
│   │   │   ├── admin/        # Admin dashboard
│   │   │   └── webhooks/     # Payment gateway webhooks
│   │   ├── (dashboard)/      # Main dashboard pages
│   │   ├── (auth)/           # Auth pages (login, register)
│   │   └── client-portal/    # Client portal for viewing invoices
│   ├── components/            # React components (~45 components)
│   │   ├── dialogs/          # Dialog components
│   │   ├── ui/               # UI primitives
│   │   └── ...               # Feature components
│   ├── lib/                   # Utilities & core logic
│   │   ├── validations/      # Zod schemas
│   │   ├── payment/          # Payment gateway integrations
│   │   ├── api-handler.ts    # API wrapper utilities
│   │   ├── api-utils.ts      # Shared API utilities
│   │   ├── api-error.ts      # Error classes
│   │   ├── logger.ts         # Centralized logger
│   │   ├── prisma.ts         # Prisma client
│   │   ├── session.ts        # Session helpers
│   │   └── ...               # Other utilities
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript type definitions
│   └── middleware.ts          # Next.js middleware (auth, CORS, CSRF)
├── prisma/
│   ├── schema.prisma         # Database schema (34 models)
│   ├── migrations/           # Database migrations
│   └── seed.ts              # Database seeding
├── docs/                     # Documentation
│   ├── PAYMENT_GATEWAYS.md  # Payment gateway strategy
│   └── DEVELOPER_GUIDE.md   # This file
└── ...
```

## Architecture Overview

### Tech Stack
- **Framework:** Next.js 16 (App Router)
- **UI:** React 19 + Tailwind CSS 3
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js with JWT strategy
- **Payment:** iPaymu (primary), Midtrans (legacy support)
- **File Storage:** Cloudflare R2 / AWS S3 with local fallback
- **Email:** Resend API or custom SMTP

### Multi-tenancy
- Data scoped to `teams` via `team_members` table
- Roles: Owner, Admin, Member, Viewer
- Feature access controlled by subscription plans
- See `src/lib/feature-access.ts` for access control logic

### Authentication
- Two user systems:
  - `users` table - App users (freelancers, teams)
  - `admins` table - Admin dashboard users
- Auth methods: Email/password + Google OAuth
- 2FA support via `otplib`
- Admin uses separate `admin_session` cookie

## API Routes Pattern

### Standard GET Route (with pagination)

```typescript
import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { parsePaginationParams, createPaginationResponse, buildSearchQuery } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/clients
 *
 * Retrieves list of clients for the authenticated user with pagination and search
 *
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10, max: 100)
 * @query search - Search term for filtering
 *
 * @returns {PaginationResponse<Client>} List of clients with pagination info
 * @throws {401} Unauthorized - User not logged in
 * @throws {500} Internal Server Error
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const { page, limit, skip, search } = parsePaginationParams(searchParams)

    const where: any = { userId: session.id }
    if (search) {
      where.OR = buildSearchQuery(search, ['name', 'email', 'company'])
    }

    const [items, total] = await Promise.all([
      prisma.clients.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.clients.count({ where })
    ])

    return NextResponse.json(createPaginationResponse(items, total, page, limit))
  } catch (error) {
    logger.apiError('/api/clients', error, session?.id)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}
```

### Standard POST Route (with validation)

```typescript
import { createClientSchema } from '@/lib/validations/common'

/**
 * POST /api/clients
 *
 * Creates a new client for the authenticated user
 *
 * @body {CreateClientSchema} Client data
 * @returns {Client} Created client object
 * @throws {401} Unauthorized
 * @throws {422} Validation Error
 * @throws {500} Internal Server Error
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Validate with Zod
    const validation = createClientSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({
        error: validation.error.errors[0]?.message || 'Invalid data',
        details: validation.error.flatten().fieldErrors
      }, { status: 422 })
    }

    const client = await prisma.clients.create({
      data: { ...validation.data, userId: session.id }
    })

    logger.info('Client created', { userId: session.id, clientId: client.id })
    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    logger.apiError('/api/clients', error, session?.id)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
```

### Using Advanced Helpers (Optional)

For cleaner code, use `withValidation` and `withValidatedAuth`:

```typescript
import { withValidatedAuth, success } from '@/lib/api-handler'
import { createClientSchema } from '@/lib/validations/common'

export const POST = withValidatedAuth(
  createClientSchema,
  async (req, validatedData, session) => {
    const client = await prisma.clients.create({
      data: { ...validatedData, userId: session.user.id }
    })

    logger.info('Client created', { userId: session.user.id, clientId: client.id })
    return success(client, 'Client created successfully')
  }
)
```

## Validation

### Creating Validation Schemas

Create Zod schemas in `src/lib/validations/`:

```typescript
// src/lib/validations/common.ts (or your domain file)
import { z } from 'zod'

export const createInvoiceItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0, 'Price cannot be negative'),
  total: z.number().min(0)
})

export const createInvoiceSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  dueDate: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid date'),
  items: z.array(createInvoiceItemSchema).min(1, 'At least one item required'),
  notes: z.string().max(2000).optional(),
  taxRate: z.number().min(0).max(100).optional()
})
```

### Using Validation in Routes

```typescript
import { createInvoiceSchema } from '@/lib/validations/invoice'

export async function POST(req: NextRequest) {
  // ... auth check ...

  const body = await req.json()
  const validation = createInvoiceSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: validation.error.errors[0]?.message || 'Invalid data',
      details: validation.error.flatten().fieldErrors
    }, { status: 422 })
  }

  // validation.data is now typed correctly
  const invoice = await prisma.invoices.create({
    data: validation.data
  })

  return NextResponse.json(invoice, { status: 201 })
}
```

## Logging

Use centralized logger instead of `console.*`:

```typescript
import { logger } from '@/lib/logger'

// Info logging
logger.info('User logged in', { userId: session.id, email: session.email })

// Error logging
try {
  await someOperation()
} catch (error) {
  logger.error('Operation failed', error, { userId, operation: 'createInvoice' })
  // or use the shorthand for API routes:
  logger.apiError('/api/invoices', error, userId)
}

// Debug logging (only in development)
logger.debug('Processing payment', { amount, method })

// Domain-specific logging
logger.payment('Payment received', { invoiceId, amount, gateway: 'ipaymu' })
logger.auth('User registered', { userId, method: 'email' })
```

**Logger behavior:**
- **Development:** Logs all levels (debug, info, warn, error)
- **Production:** Only logs warn & error levels
- **Production format:** Structured JSON for log aggregators
- **Development format:** Human-readable with colors

## Error Handling

Use error classes from `src/lib/api-error.ts`:

```typescript
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ConflictError
} from '@/lib/api-error'

// In your route handler
if (!session) {
  throw new UnauthorizedError('You must be logged in')
}

if (!hasPermission) {
  throw new ForbiddenError('You do not have access to this resource')
}

if (!resource) {
  throw new NotFoundError('Resource not found')
}

if (duplicate) {
  throw new ConflictError('A resource with this identifier already exists')
}
```

When using `withApiHandler`, these errors are automatically caught and converted to proper HTTP responses.

## Database

### Common Commands

```bash
# Create a new migration
npx prisma migrate dev --name add_feature_x

# Push schema changes without migration (dev only)
npx prisma db push

# Reset database (destructive!)
npx prisma migrate reset

# Open Prisma Studio (GUI)
npx prisma studio

# Seed database
npm run db:seed

# Generate Prisma Client (after schema changes)
npx prisma generate
```

### Querying Best Practices

```typescript
// ✅ GOOD: Use Promise.all for parallel queries
const [invoices, total] = await Promise.all([
  prisma.invoices.findMany({ where, skip, take }),
  prisma.invoices.count({ where })
])

// ❌ BAD: Sequential queries
const invoices = await prisma.invoices.findMany({ where })
const total = await prisma.invoices.count({ where }) // Waits for first query

// ✅ GOOD: Use transactions for multiple related writes
await prisma.$transaction([
  prisma.invoices.update({ ... }),
  prisma.payments.create({ ... }),
  prisma.activity_logs.create({ ... })
])

// ✅ GOOD: Select only needed fields
const user = await prisma.users.findUnique({
  where: { id },
  select: { id: true, name: true, email: true }
})
```

## Payment Gateway

**Active Gateway:** iPaymu (Indonesia)

See [`docs/PAYMENT_GATEWAYS.md`](./PAYMENT_GATEWAYS.md) for complete documentation on:
- Payment flow and integration
- Webhook handling
- Testing with sandbox mode
- Future gateway expansion plans

## Testing

### Unit & Integration Tests (Vitest)

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage

# Run specific test file
npx vitest run src/lib/api-utils.test.ts
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
npm run test:e2e
```

### Writing Tests

```typescript
// src/lib/__tests__/api-utils.test.ts
import { describe, it, expect } from 'vitest'
import { parsePaginationParams, createPaginationResponse } from '../api-utils'

describe('parsePaginationParams', () => {
  it('should parse pagination params with defaults', () => {
    const params = new URLSearchParams()
    const result = parsePaginationParams(params)

    expect(result.page).toBe(1)
    expect(result.limit).toBe(10)
    expect(result.skip).toBe(0)
  })

  it('should limit max items per page to 100', () => {
    const params = new URLSearchParams({ limit: '500' })
    const result = parsePaginationParams(params)

    expect(result.limit).toBe(100)
  })
})
```

## Code Style & Standards

### TypeScript

- **Strict mode enabled** - No `any` types (use proper interfaces)
- **Named exports preferred** - Easier to search and refactor
- **Use Prisma types** - Import from `@prisma/client` instead of creating duplicates

### Components

- **Max 300 lines** - Split if larger
- **Props interface required** - Always define prop types
- **Use TypeScript** - All components should be .tsx
- **Dialogs in separate files** - Use `src/components/dialogs/` directory

### API Routes

- **JSDoc required** - Document all routes with params, returns, throws
- **Validation required** - Use Zod schemas for all POST/PUT/PATCH
- **Logger required** - Use centralized logger, not console.*
- **Error handling required** - Use try/catch with proper error responses
- **Max 200 lines** - Split complex logic into separate functions/files

## Common Tasks

### Adding a New API Endpoint

1. **Create route file:** `src/app/api/my-resource/route.ts`

2. **Create validation schema:** `src/lib/validations/my-resource.ts`
```typescript
import { z } from 'zod'

export const createMyResourceSchema = z.object({
  name: z.string().min(1),
  // ... other fields
})
```

3. **Implement route with standard pattern:**
```typescript
// Follow pattern from "API Routes Pattern" section above
```

4. **Add JSDoc documentation**

5. **Test the endpoint:**
```bash
# Manual testing
curl http://localhost:3000/api/my-resource

# Or write tests
# src/app/api/my-resource/__tests__/route.test.ts
```

### Adding a New Component

1. **Create component file:** `src/components/MyComponent.tsx`

2. **Define props interface:**
```typescript
interface MyComponentProps {
  title: string
  onAction: () => void
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  // ...
}
```

3. **Keep under 300 lines** - Split if needed

4. **Export from index if grouped:**
```typescript
// src/components/my-group/index.ts
export * from './MyComponent'
```

### Debugging

```bash
# Check TypeScript errors
npm run typecheck

# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix

# View database in GUI
npx prisma studio

# Check environment variables
npm run validate:env
```

## Troubleshooting

### TypeScript Errors

Currently `ignoreBuildErrors: true` is set due to Prisma schema mismatches in client portal routes. We're working on fixing these. When modifying client portal code, be extra careful about types.

### Database Connection Issues

**Error:** "Can't reach database server"
- Check `DATABASE_URL` in `.env.local`
- Ensure PostgreSQL is running
- For Neon: Check if database is paused (auto-wakes on query)

**Error:** "Migration failed"
- Use `DIRECT_URL` for migrations with Neon/serverless
- Ensure database is accessible
- Check if migrations are already applied: `npx prisma migrate status`

### Payment Testing

**iPaymu Sandbox:**
1. Set `IPAYMU_MODE=SANDBOX` in `.env.local`
2. Use sandbox credentials from iPaymu dashboard
3. Use ngrok to expose local webhook: `ngrok http 3000`
4. Update webhook URL in iPaymu dashboard

### Build Errors

**Error:** "Module not found"
- Run `npm install` to ensure all dependencies are installed
- Check that import paths use `@/` alias correctly

**Error:** "Prisma Client not generated"
```bash
npx prisma generate
```

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [Zod Docs](https://zod.dev)

### Internal Docs
- [`CLAUDE.md`](../CLAUDE.md) - Project overview for AI assistance
- [`docs/PAYMENT_GATEWAYS.md`](./PAYMENT_GATEWAYS.md) - Payment gateway strategy
- [`.env.example`](../.env.example) - Environment variable reference

## Getting Help

- **GitHub Issues:** Report bugs or request features
- **Code Comments:** Most complex logic has inline documentation
- **Prisma Studio:** Use to explore database schema and data
- **Logger:** Check logs for debugging information

---

**Last Updated:** 2026-05-29
**Maintained By:** Development Team

Welcome aboard! 🚀
