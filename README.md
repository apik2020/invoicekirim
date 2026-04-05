# NotaBener

Platform Invoice Profesional untuk Freelancer Indonesia.

Website: [https://notabener.com](https://notabener.com)

## Daftar Isi

- [Fitur](#fitur)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Instalasi](#instalasi)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Payment Gateway Setup](#payment-gateway-setup)
- [Email Setup](#email-setup)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

## Fitur

### Fitur Utama
- Buat invoice profesional dalam hitungan detik
- Kirim invoice via WhatsApp & Email
- Lacak pembayaran & kirim pengingat otomatis
- Custom branding (logo, warna) untuk pengguna Pro
- Multi-currency support
- Export ke PDF/Excel
- Responsive design (mobile-first)

### Fitur Subscription
- **Free**: 10 invoice/bulan, template dasar, export PDF
- **Pro**: Invoice unlimited, custom branding, analytics, priority support

### Payment Methods
- Virtual Account (BCA, Mandiri, BNI, BRI, CIMB, Permata)
- QRIS (GoPay, ShopeePay, Dana, LinkAja)
- International: Stripe (Credit Card)

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4, Radix UI |
| **Backend** | Next.js API Routes, Prisma ORM |
| **Database** | PostgreSQL (Neon) |
| **Authentication** | NextAuth.js, 2FA Support |
| **Payment - ID** | Duitku (VA, QRIS, E-Wallet) |
| **Payment - International** | Stripe |
| **Email** | Resend / Custom SMTP |
| **PDF Generation** | @react-pdf/renderer |
| **Deployment** | Docker, Dokploy |

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Duitku account (untuk pembayaran Indonesia)
- Stripe account (untuk pembayaran internasional)
- Resend account atau SMTP server (untuk email)

## Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/apik2020/invoicekirim.git
cd invoicekirim
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Buat file `.env` di root directory:

```bash
cp .env.example .env
```

Edit file `.env` dengan konfigurasi Anda.

### 4. Setup Database

```bash
npx prisma generate
npx prisma migrate dev
```

### 5. Seed Data (Opsional)

```bash
npx prisma db seed
```

### 6. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/notabener"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Authentication (Optional - OAuth)

```bash
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Payment Gateway - Duitku (Indonesia)

```bash
DUITKU_MERCHANT_CODE="your-merchant-code"
DUITKU_API_KEY="your-api-key"
DUITKU_ENVIRONMENT="SANDBOX"  # SANDBOX or PRODUCTION
```

### Payment Gateway - Stripe (International)

```bash
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID="price_..."
```

### Email - Resend

```bash
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="hello@notabener.com"
```

### Cron Jobs

```bash
CRON_SECRET="your-cron-secret-here"
```

## Database Setup

### Schema Overview

Database menggunakan PostgreSQL dengan Prisma ORM. Schema utama:

- **users** - Data pengguna
- **teams** - Tim/organisasi
- **invoices** - Invoice
- **invoice_items** - Item dalam invoice
- **clients** - Data klien
- **payments** - Data pembayaran
- **subscriptions** - Langganan pengguna
- **pricing_plans** - Paket harga
- **activity_logs** - Log aktivitas

### Migrations

```bash
# Development
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

### Seed Data

```bash
npx prisma db seed
```

## Payment Gateway Setup

### Duitku Setup (Indonesia)

1. Daftar di [Duitku Dashboard](https://dashboard.duitku.com)
2. Verifikasi bisnis Anda
3. Dapatkan Merchant Code dan API Key
4. Webhook URL: `https://yourdomain.com/api/webhooks/duitku`

**Environment:**
- Sandbox: `https://sandbox.duitku.com/webapi/api/merchant/v2`
- Production: `https://passport.duitku.com/webapi/api/merchant/v2`

### Stripe Setup (International)

1. Daftar di [Stripe Dashboard](https://dashboard.stripe.com)
2. Buat Products & Prices
3. Setup Webhook: `https://yourdomain.com/api/stripe/webhook`
4. Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`

## Email Setup

### Option 1: Resend (Recommended)

1. Daftar di [resend.com](https://resend.com)
2. Verifikasi domain Anda
3. Dapatkan API key

### Option 2: Custom SMTP

Konfigurasi SMTP di Admin Dashboard `/admin/settings/email`

## Deployment

### Dokploy (Recommended)

1. Connect GitHub repository
2. Set build pack: `nixpacks`
3. Configure environment variables
4. Deploy!

### Manual Deployment

```bash
npm run build
npm start
```

### Docker

```bash
docker build -t notabener .
docker run -p 3000:3000 notabener
```

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── admin/               # Admin endpoints
│   │   ├── auth/                # Authentication
│   │   ├── client/              # Client portal API
│   │   ├── cron/                # Cron jobs
│   │   ├── invoices/            # Invoice endpoints
│   │   ├── payments/            # Payment endpoints
│   │   ├── stripe/              # Stripe webhooks
│   │   ├── subscriptions/       # Subscription management
│   │   ├── user/                # User endpoints
│   │   └── webhooks/            # Payment webhooks (Duitku)
│   │
│   ├── admin/                    # Admin dashboard pages
│   │   ├── login/               # Admin login
│   │   ├── reports/             # Reports & analytics
│   │   └── settings/            # Admin settings
│   │
│   ├── auth/                     # Authentication pages
│   │   ├── login/               # User login
│   │   └── register/            # User registration
│   │
│   ├── checkout/                 # Checkout page
│   │
│   ├── client/                   # Client portal
│   │   └── invoices/[token]/    # View invoice as client
│   │
│   ├── dashboard/                # User dashboard
│   │   ├── invoices/            # Invoice management
│   │   ├── clients/             # Client management
│   │   ├── payments/            # Payment history
│   │   ├── settings/            # User settings
│   │   └── subscription/        # Subscription management
│   │
│   ├── invoice/                  # Public invoice view
│   │   └── [token]/             # Invoice by access token
│   │
│   ├── pricing/                  # Pricing page
│   │
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   └── globals.css              # Global styles
│
├── components/                   # React components
│   ├── admin/                   # Admin components
│   ├── auth/                    # Auth components (2FA, etc)
│   ├── pdf/                     # PDF components
│   ├── receipts/                # Receipt components
│   ├── ui/                      # UI primitives (Radix)
│   └── ...                      # Other components
│
├── hooks/                        # Custom React hooks
│   ├── useFeatureAccess.ts      # Feature access control
│   ├── usePrint.ts              # Print functionality
│   └── useSubscriptionGuard.tsx # Subscription protection
│
├── lib/                          # Utility functions
│   ├── auth.ts                  # NextAuth configuration
│   ├── prisma.ts                # Prisma client
│   ├── duitku.ts                # Duitku integration
│   ├── stripe.ts                # Stripe integration
│   ├── email.ts                 # Email templates & sending
│   ├── feature-access.ts        # Feature access logic
│   ├── branding.ts              # Branding configuration
│   └── ...                      # Other utilities
│
├── types/                        # TypeScript type definitions
│
└── middleware.ts                 # Next.js middleware (auth, CSRF)

prisma/
├── schema.prisma                 # Database schema
├── seed.ts                       # Seed data
└── migrations/                   # Database migrations

scripts/                          # Utility scripts
├── test-send-email.ts           # Test email sending
└── save-smtp-and-test.ts        # SMTP configuration test
```

## API Documentation

### Authentication

Semua API endpoint (kecuali public routes) memerlukan authentication via session.

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments/create` | Get available payment methods |
| GET | `/invoice/[token]` | View public invoice |
| POST | `/api/webhooks/duitku` | Duitku webhook |
| POST | `/api/stripe/webhook` | Stripe webhook |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | Get user invoices |
| POST | `/api/invoices` | Create invoice |
| GET | `/api/invoices/[id]` | Get invoice by ID |
| PUT | `/api/invoices/[id]` | Update invoice |
| DELETE | `/api/invoices/[id]` | Delete invoice |
| POST | `/api/invoices/[id]/send` | Send invoice via email/WhatsApp |
| GET | `/api/payments/[id]/status` | Check payment status |
| GET | `/api/payments/[id]/receipt/download` | Download receipt PDF |

### Subscription Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscription` | Get subscription status |
| POST | `/api/payments/create` | Create payment for subscription |
| GET | `/api/features/[featureKey]/check` | Check feature access |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/smtp-settings` | Get SMTP settings |
| POST | `/api/admin/smtp-settings` | Update SMTP settings |

## Cron Jobs

Aplikasi menggunakan cron jobs untuk:

- **Payment Reminders**: Kirim pengingat pembayaran untuk invoice yang akan jatuh tempo
- **Subscription Expiration**: Notifikasi dan penanganan subscription yang expired

Konfigurasi di `vercel.json` atau setup manual di server.

## Security

- CSRF Protection
- Content Security Policy (CSP)
- XSS Protection
- SQL Injection Prevention (Prisma)
- Rate Limiting
- 2FA Support
- Secure Session Management

## Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

## License

MIT License - see LICENSE file for details.

## Support

- Email: hello@notabener.com
- Website: [https://notabener.com](https://notabener.com)
- GitHub Issues: [https://github.com/apik2020/invoicekirim/issues](https://github.com/apik2020/invoicekirim/issues)

---

**NotaBener** - Bikin invoice jadi gampang!
