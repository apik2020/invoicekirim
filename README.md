# InvoiceKirim

Platform Invoice Profesional untuk Freelancer Indonesia.

## Features

- Create professional invoices in seconds
- Send invoices via WhatsApp & Email
- Track payments & send automatic reminders
- Custom branding (logo, colors) for Pro users
- Multi-currency support
- Export to PDF/Excel
- Responsive design

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Payment**: Stripe
- **Email**: Resend
- **PDF Generation**: @react-pdf/renderer

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Stripe account (for payments)
- Resend account (for emails)

## Environment Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/invoicekirim.git
cd invoicekirim
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/invoicekirim"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID="price_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Resend (Email)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="your-email@example.com"

# Cron Job Secret (for payment reminders)
CRON_SECRET="your-cron-secret-here"

# Upstash Redis (optional - for rate limiting)
UPSTASH_REDIS_REST_URL="your-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
```

### 4. Set up the database

Run Prisma migrations:

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Create admin user

Run the seed script to create an admin user:

```bash
npx prisma db seed
```

Or manually create an admin in the database:

```sql
INSERT INTO "Admin" (id, email, name, password)
VALUES (
  'admin-id',
  'admin@invoicekirim.com',
  'Admin',
  'hashed-password-here' -- Use bcrypt to hash
);
```

## Stripe Setup

### 1. Create Stripe Products & Prices

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** > **Add product**
3. Create a product with:
   - Name: `InvoiceKirim Pro`
   - Description: `Professional invoice management`
   - Price: `Rp 49.000/month` or `IDR 49000`
4. Copy the Price ID and set it as `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`

### 2. Set up Webhook

1. In Stripe Dashboard, go to **Developers** > **Webhooks**
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the webhook secret and set it as `STRIPE_WEBHOOK_SECRET`

## Resend Setup (Email)

### 1. Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up and verify your domain
3. Get your API key

### 2. Configure Email

1. Set `RESEND_API_KEY` in your `.env`
2. Update the `from` email in `src/lib/email.ts` if needed

## Cron Jobs (Payment Reminders)

For Vercel deployment, the cron job is configured in `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/payment-reminders",
    "schedule": "0 9 * * *"
  }]
}
```

This runs daily at 9:00 AM to send payment reminders for invoices due in 3 days and overdue notices.

Make sure to set `CRON_SECRET` in your environment variables and include it in the cron request headers:

```
X-Cron-Secret: your-cron-secret-here
```

## Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Building for Production

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Environment Variables Checklist

Before deploying, make sure all required variables are set:

- [ ] `DATABASE_URL`
- [ ] `NEXTAUTH_URL`
- [ ] `NEXTAUTH_SECRET`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `RESEND_API_KEY`
- [ ] `CRON_SECRET`

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── admin/           # Admin endpoints
│   │   ├── stripe/          # Stripe webhooks
│   │   ├── cron/            # Cron jobs
│   │   └── ...
│   ├── dashboard/           # Dashboard pages
│   ├── admin/               # Admin pages
│   └── ...
├── components/              # React components
│   ├── pdf/                # PDF components
│   ├── admin/              # Admin components
│   └── ...
├── lib/                    # Utility functions
│   ├── auth.ts             # NextAuth config
│   ├── email.ts            # Email templates
│   ├── prisma.ts           # Prisma client
│   ├── stripe.ts           # Stripe functions
│   └── ...
└── types/                  # TypeScript types
```

## Security Notes

1. **Never commit `.env` files** to version control
2. Use strong `NEXTAUTH_SECRET` in production
3. Set up proper CORS for API routes
4. Use HTTPS in production
5. Keep dependencies updated

## License

MIT License - see LICENSE file for details.

## Support

For support, email hello@invoicekirim.com or open an issue on GitHub.
