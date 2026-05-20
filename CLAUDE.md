# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NotaBener — professional invoicing SaaS for Indonesian freelancers. Multi-tenant architecture with team collaboration, dual payment gateways (Duitku for Indonesia, Stripe for international), and a client portal.

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

**Payments**: Dual gateway — Duitku (VA, QRIS, e-wallet) for Indonesia, Stripe for international. Webhook handlers at `/api/webhooks/duitku` and `/api/stripe/webhook`.

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

Required: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_URL`. Optional: Google OAuth, Duitku, Stripe, Resend, SMTP, Sentry, S3/R2 credentials. See `.env.example` for full list.
