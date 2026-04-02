# Database Schema - NotaBener

## Overview

NotaBener menggunakan PostgreSQL dengan Prisma ORM.

## Entity Relationship Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   users     │────<│   invoices   │>────│   clients       │
└─────────────┘     └──────────────┘     └─────────────────┘
      │                   │
      │                   │
      ▼                   ▼
┌─────────────┐     ┌──────────────┐
│subscriptions│     │invoice_items │
└─────────────┘     └──────────────┘
      │
      │
      ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│pricing_plans│────<│payments      │     │  activity_logs  │
└─────────────┘     └──────────────┘     └─────────────────┘
```

## Core Tables

### users

Data pengguna NotaBener.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| email | String | Email unik |
| name | String? | Nama lengkap |
| password | String? | Hashed password |
| image | String? | Profile image URL |
| emailVerified | DateTime? | Email verification timestamp |
| role | Enum | USER, ADMIN |
| activeTeamId | String? | Reference ke teams |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Update timestamp |

### teams

Tim/organisasi (untuk branding).

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| name | String | Nama tim |
| slug | String | URL-friendly name |
| ownerId | String | Reference ke users |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Update timestamp |

### invoices

Invoice utama.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| invoiceNumber | String | Nomor invoice (INV-2024-001) |
| userId | String | Reference ke users |
| clientId | String? | Reference ke clients |
| teamId | String? | Reference ke teams |
| status | Enum | DRAFT, PENDING, PAID, OVERDUE, CANCELLED |
| total | Float | Total amount |
| subTotal | Float | Subtotal |
| tax | Float? | Tax amount |
| discount | Float? | Discount amount |
| currency | String | Currency code (IDR, USD) |
| issueDate | DateTime | Invoice date |
| dueDate | DateTime? | Due date |
| notes | String? | Notes |
| terms | String? | Terms & conditions |
| accessToken | String? | Public access token |
| sentAt | DateTime? | When invoice was sent |
| viewedAt | DateTime? | When client viewed |
| viewCount | Int | Number of views |
| reminderCount | Int | Number of reminders sent |
| lastReminderAt | DateTime? | Last reminder timestamp |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Update timestamp |

### invoice_items

Item dalam invoice.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| invoiceId | String | Reference ke invoices |
| description | String | Item description |
| quantity | Int | Quantity |
| price | Float | Unit price |
| subtotal | Float? | quantity * price |
| taxRate | Float? | Tax rate percentage |

### clients

Data klien.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| userId | String | Reference ke users |
| name | String | Client name |
| email | String | Client email |
| phone | String? | Phone number |
| address | String? | Address |
| taxId | String? | Tax ID (NPWP) |
| website | String? | Website URL |
| notes | String? | Notes |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Update timestamp |

### payments

Data pembayaran.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| userId | String | Reference ke users |
| invoiceId | String? | Reference ke invoices (optional) |
| pricingPlanId | String? | Reference ke pricing_plans |
| amount | Float | Payment amount |
| currency | String | Currency code |
| status | Enum | PENDING, COMPLETED, FAILED |
| paymentMethod | String? | VA, QRIS, STRIPE |
| paymentGateway | String? | DOKU, STRIPE |
| description | String? | Payment description |
| dokuOrderId | String? | DOKU order ID |
| dokuTransactionId | String? | DOKU transaction ID |
| stripePaymentId | String? | Stripe payment ID |
| vaNumber | String? | VA number |
| vaBank | String? | VA bank |
| qrisUrl | String? | QRIS image URL |
| qrString | String? | QRIS string |
| paymentUrl | String? | Payment page URL |
| expiredAt | DateTime? | Expiry timestamp |
| receiptNumber | String? | Receipt number |
| receiptUrl | String? | Receipt download URL |
| refundedAt | DateTime? | Refund timestamp |
| refundReason | String? | Refund reason |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Update timestamp |

## Subscription Tables

### subscriptions

Data langganan pengguna.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| userId | String | Reference ke users (unique) |
| status | Enum | FREE, TRIALING, ACTIVE, CANCELED, EXPIRED |
| planType | Enum | FREE, PRO |
| pricingPlanId | String? | Reference ke pricing_plans |
| stripeCustomerId | String? | Stripe customer ID |
| stripeSubscriptionId | String? | Stripe subscription ID |
| stripeCurrentPeriodEnd | DateTime? | Current period end |
| stripePriceId | String? | Stripe price ID |
| trialStartsAt | DateTime? | Trial start |
| trialEndsAt | DateTime? | Trial end |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Update timestamp |

### pricing_plans

Paket harga yang tersedia.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| name | String | Plan name (Free, Pro) |
| slug | String | URL-friendly name |
| description | String? | Plan description |
| price | Float | Price amount |
| currency | String | Currency code |
| trialDays | Int? | Trial period days |
| isActive | Boolean | Is plan active |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Update timestamp |

### pricing_features

Fitur yang tersedia.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| key | String | Feature key (PDF_EXPORT) |
| name | String | Feature name |
| description | String? | Feature description |
| sortOrder | Int | Display order |
| isActive | Boolean | Is feature active |

### pricing_plan_features

Relasi plan dengan fitur.

| Field | Type | Description |
|-------|------|-------------|
| planId | String | Reference ke pricing_plans |
| featureId | String | Reference ke pricing_features |
| included | Boolean | Is feature included |
| limitValue | Int? | Usage limit (null = unlimited) |

## Authentication Tables

### accounts

OAuth accounts (NextAuth).

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| userId | String | Reference ke users |
| type | String | Provider type |
| provider | String | Provider name |
| providerAccountId | String | Provider account ID |
| access_token | String? | OAuth access token |
| refresh_token | String? | OAuth refresh token |
| expires_at | Int? | Token expiry |
| token_type | String? | Token type |
| scope | String? | OAuth scopes |
| id_token | String? | ID token |
| session_state | String? | Session state |

### sessions

User sessions (NextAuth).

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| sessionToken | String | Session token (unique) |
| userId | String | Reference ke users |
| expires | DateTime | Expiry timestamp |

### verification_tokens

Email verification tokens.

| Field | Type | Description |
|-------|------|-------------|
| identifier | String | Email/user identifier |
| token | String | Verification token (unique) |
| expires | DateTime | Expiry timestamp |

## Utility Tables

### activity_logs

Log aktivitas pengguna.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| userId | String | Reference ke users |
| action | String | Action type (CREATED, UPDATED, DELETED) |
| entityType | String | Entity type (Invoice, Payment) |
| entityId | String | Entity ID |
| title | String | Activity title |
| description | String? | Activity description |
| metadata | Json? | Additional data |
| createdAt | DateTime | Creation timestamp |

### branding

Custom branding per team.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| teamId | String | Reference ke teams (unique) |
| logoUrl | String? | Logo URL |
| primaryColor | String? | Primary color (#FFFFFF) |
| secondaryColor | String? | Secondary color |
| accentColor | String? | Accent color |
| invoicePrefix | String | Invoice prefix (INV) |
| receiptPrefix | String | Receipt prefix (RCP) |
| showLogo | Boolean | Show logo on documents |
| showColors | Boolean | Apply custom colors |
| fontFamily | String | Font family |
| emailFromName | String? | Email from name |
| emailReplyTo | String? | Reply-to email |
| customDomain | String? | Custom domain |
| domainVerified | Boolean | Is domain verified |

### admins

Admin users.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| email | String | Email (unique) |
| name | String? | Name |
| password | String | Hashed password |
| twoFactorEnabled | Boolean | 2FA enabled |
| twoFactorSecret | String? | 2FA secret |
| smtpHost | String? | SMTP host |
| smtpPort | String? | SMTP port |
| smtpSecure | Boolean | Use TLS |
| smtpUser | String? | SMTP username |
| smtpPass | String? | SMTP password |
| smtpFromName | String? | From name |
| smtpFromEmail | String? | From email |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Update timestamp |

## Enums

### InvoiceStatus
- DRAFT
- PENDING
- PAID
- OVERDUE
- CANCELLED

### PaymentStatus
- PENDING
- COMPLETED
- FAILED

### SubscriptionStatus
- FREE
- TRIALING
- ACTIVE
- CANCELED
- EXPIRED

### PlanType
- FREE
- PRO

### UserRole
- USER
- ADMIN

## Indexes

Important indexes for performance:

- `invoices(userId, status)`
- `invoices(clientId)`
- `invoices(accessToken)` - unique
- `payments(userId, status)`
- `payments(dokuOrderId)` - unique
- `clients(userId, email)`
- `subscriptions(userId)` - unique
- `activity_logs(userId, createdAt)`

## Migrations

### Create Migration

```bash
npx prisma migrate dev --name description_of_change
```

### Apply Migration (Production)

```bash
npx prisma migrate deploy
```

### Reset Database (Development)

```bash
npx prisma migrate reset
```

---

**NotaBener** Database Schema Documentation
