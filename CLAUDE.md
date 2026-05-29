# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NotaBener — professional invoicing SaaS for Indonesian freelancers. Multi-tenant architecture with team collaboration, payment gateway (iPaymu for Indonesia), and a client portal.

## Commands

```bash
npm run dev              # Start dev server (Next.js with webpack)
npm run build            # prisma generate + next build
npm run lint             # ESLint
npm run lint:fix         # ESLint with auto-fix
npm run typecheck        # TypeScript type checking (tsc --noEmit)

# Database
npx prisma migrate dev   # Create & apply migration
npx prisma db push       # Push schema without migration
npx prisma db seed       # Seed database (tsx prisma/seed.ts)
npx prisma studio        # GUI database browser
npx prisma migrate reset # Reset database (destructive)

# Testing
npm run test             # Vitest in watch mode
npm run test:run         # Vitest single run
npm run test:coverage    # Vitest with coverage (50% threshold)
npm run test:e2e         # Playwright E2E tests

# Utilities
npm run validate:env     # Validate environment variables
npm run db:cleanup-users # Clean up user data
```

Run a single test: `npx vitest run src/path/to/test.test.ts`

## Architecture

**Stack**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 3 + Prisma ORM (PostgreSQL)

**Monorepo structure**: Single Next.js app with API routes acting as the backend.

### Key Directories

- `src/app/` — Next.js App Router pages and API routes (~90 API route files)
- `src/app/api/` — REST API endpoints organized by domain (invoices, payments, clients, teams, admin, etc.)
- `src/lib/` — Shared utilities: auth, prisma client, payment integrations, email, storage, rate-limiting, feature-access logic
- `src/components/` — ~45 React components (dashboard layouts, invoice views, PDF generators, UI primitives)
- `src/hooks/` — Custom hooks for feature access, print, subscription guard
- `src/types/` — TypeScript type definitions
- `src/middleware.ts` — Auth checks, CSRF protection, CORS, security headers, secret rotation cleanup
- `prisma/schema.prisma` — 34 database models

### Core Patterns

**Authentication**: NextAuth.js with JWT strategy. Two user tables — `users` (app users) and `admins` (admin dashboard). Admin uses separate `admin_session` cookie. Google OAuth + email/password credentials. 2FA support via `otplib`.

**Multi-tenancy**: Data scoped to teams via `team_members` with roles (Owner, Admin, Member, Viewer). Feature access checked via `src/lib/feature-access.ts` and subscription limits via `src/lib/subscription-limits.ts`.

**Payments**: iPaymu as primary gateway for Indonesia (VA, QRIS, e-wallet). Webhook handler at `/api/webhooks/ipaymu`. Midtrans webhook exists for legacy payment support only. Stripe & Duitku reserved for future use. See `docs/PAYMENT_GATEWAYS.md` for complete payment gateway strategy.

**File Storage**: AWS S3 / Cloudflare R2 with local filesystem fallback (`src/lib/storage.ts`).

**Email**: Resend API or custom SMTP via nodemailer. Templates in `src/lib/email-templates.ts`.

**PDF Generation**: `@react-pdf/renderer` for invoice PDFs, `jspdf` + `exceljs` for exports.

**API Pattern**: Most API routes follow the pattern of getting the session, validating input with Zod, performing the operation, and returning JSON. Auth helpers in `src/lib/api-auth.ts` and `src/lib/dashboard-auth.ts`.

**Error Handling**: Centralized via `src/lib/api-error.ts` and `src/lib/api-handler.ts`.

### Database

PostgreSQL with Prisma. 34 models including users, teams, invoices, clients, payments, subscriptions, branding, activity_logs, support_tickets, client_accounts, and more. Models use snake_case field names. Migrations are in `prisma/migrations/`.

### Deployment

Docker with multi-stage build (`Dockerfile`), standalone output mode. Designed for Dokploy/VPS deployment, not Vercel.

## Configuration Notes

- `next.config.ts` has `typescript.ignoreBuildErrors: true` due to pre-existing Prisma schema mismatches in client portal routes — fix these when modifying those routes.
- Sentry integration exists but is currently disabled for dev (DSN check in next.config.ts).
- Path alias: `@` maps to `./src` (configured in both tsconfig and vitest).
- CSP headers configured in `next.config.ts` — update `connect-src` and `frame-src` when adding external services.
- Vitest uses jsdom environment with forks pool (single fork) for test isolation.

## Environment Variables

Required: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_URL`. Optional: Google OAuth, iPaymu, Resend, SMTP, Sentry, S3/R2 credentials. See `.env.example` for full list.

## Code Patterns & Standards

### API Routes

**Standard Pattern:**
```typescript
import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { parsePaginationParams, createPaginationResponse } from '@/lib/api-utils'
import { createResourceSchema } from '@/lib/validations/common'

// GET with pagination
export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const { page, limit, skip, search } = parsePaginationParams(searchParams)

    const [items, total] = await Promise.all([
      prisma.items.findMany({ skip, take: limit }),
      prisma.items.count()
    ])

    return NextResponse.json(createPaginationResponse(items, total, page, limit))
  } catch (error) {
    logger.apiError('/api/resource', error, session?.id)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

// POST with validation
export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = createResourceSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: validation.error.errors[0]?.message || 'Invalid data',
        details: validation.error.flatten().fieldErrors
      }, { status: 422 })
    }

    const item = await prisma.items.create({
      data: { ...validation.data, userId: session.id }
    })

    logger.info('Resource created', { userId: session.id, itemId: item.id })
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    logger.apiError('/api/resource', error, session?.id)
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}
```

**Requirements:**
- All routes MUST have JSDoc documentation describing endpoints, params, responses
- Use centralized `logger` instead of `console.*` for all logging
- Validate all inputs with Zod schemas from `@/lib/validations/`
- Use `parsePaginationParams` and `createPaginationResponse` for paginated endpoints
- Return standardized error responses with appropriate status codes

### Components

- Maximum 300 lines per component (split if larger)
- Dialog components live in `@/components/dialogs/` (not MessageBox.tsx)
- Use TypeScript interfaces for props (avoid `any`)
- Export components via index files for cleaner imports

### Error Handling

Use error classes from `@/lib/api-error.ts`:
- `UnauthorizedError` - 401
- `ForbiddenError` - 403
- `NotFoundError` - 404
- `ValidationError` - 422
- `ConflictError` - 409

### Validation

Create Zod schemas in `@/lib/validations/` and reuse across routes:
```typescript
import { createClientSchema } from '@/lib/validations/common'

const validation = createClientSchema.safeParse(data)
if (!validation.success) {
  // Handle error
}
```

### Logging

Use centralized logger from `@/lib/logger`:
```typescript
import { logger } from '@/lib/logger'

logger.info('Operation completed', { userId, resourceId })
logger.error('Operation failed', error, { userId, path })
logger.apiError('/api/endpoint', error, userId)
```

Production: Only logs `warn` and `error` levels. Development: Logs all levels.

### Documentation

See these files for additional documentation:
- `docs/PAYMENT_GATEWAYS.md` - Payment gateway strategy and integration details
- `docs/DEVELOPER_GUIDE.md` - Developer onboarding and common tasks (coming soon)
- `docs/API_PATTERNS.md` - Detailed API patterns and standards (coming soon)
