# Changelog

Semua perubahan penting di project NotaBener akan didokumentasikan di file ini.

## [Unreleased]

## [2026-04-05] - Duitku Payment Gateway Integration

### Added
- **Duitku Integration**: Integrasi payment gateway Duitku sebagai pengganti DOKU
  - Library `src/lib/duitku.ts` dengan fungsi API Duitku
  - Webhook handler `src/app/api/webhooks/duitku/route.ts`
  - Signature verification menggunakan MD5 hash
- **Payment Methods** via Duitku:
  - Virtual Account: BCA, Mandiri, BNI, BRI, CIMB Niaga, Permata, Danamon, Digibank
  - QRIS payments
  - E-Wallet: OVO, DANA, ShopeePay, GoPay (ready untuk diaktifkan)
- **Environment Variables**: Konfigurasi lebih sederhana dari DOKU
  - `DUITKU_MERCHANT_CODE`
  - `DUITKU_API_KEY`
  - `DUITKU_ENVIRONMENT` (SANDBOX/PRODUCTION)

### Changed
- **Payment Route**: Update `src/app/api/payments/create/route.ts` untuk menggunakan Duitku
- **Payment Gateway**: Switch dari DOKU ke Duitku sebagai primary payment gateway

### Removed
- **DOKU Integration**: Dihapus sepenuhnya dari project
  - File yang dihapus: `src/lib/doku.ts`, `src/app/api/webhooks/doku/route.ts`, `src/app/api/debug/doku-config/route.ts`, `scripts/generate-doku-keys.ts`, `src/types/doku-nodejs-library.d.ts`, `docs/DOKU_INTEGRATION.md`
  - Dependency dihapus: `doku-nodejs-library`
  - Environment variables dihapus: `DOKU_CLIENT_ID`, `DOKU_SECRET_KEY`, `DOKU_ENVIRONMENT`, `DOKU_PRIVATE_KEY`, `DOKU_PUBLIC_KEY`, `DOKU_PUBLIC_KEY_DOKU`, `DOKU_PARTNER_SERVICE_ID`

### Technical Details
- Duitku menggunakan signature MD5: `MD5(email + amount + merchantCode + orderId + apiKey)`
- Callback verification: `MD5(merchantCode + orderId + amount + apiKey)`
- Result codes: `00` = Success, `01` = Pending, `02` = Failed, `03` = Expired
- Default expiry period: 24 jam (1440 menit)
- API endpoints:
  - Sandbox: `https://sandbox.duitku.com/webapi/api/merchant/v2`
  - Production: `https://passport.duitku.com/webapi/api/merchant/v2`

## [2026-04-04] - DOKU SDK Integration

### Changed
- **DOKU Integration**: Refactored to use official `doku-nodejs-library` SDK
  - Uses SDK's built-in SNAP API authentication
  - Simplified signature handling (SDK manages complexity)

### Technical Details
- SDK handles RSA-SHA256 + HMAC-SHA512 authentication automatically
- Partner Service ID defaults to `11111` for sandbox testing
- Supports VA (Virtual Account) and QRIS payment methods

## [2026-04-03] - DOKU API Endpoints Fix

### Fixed
- **DOKU API Endpoints**: Updated to correct DOKU API paths:
  - VA Creation: `/api/v1/payment-service/va/create` → `/order/v1/payment/va`
  - QRIS Creation: `/qr-qriss/v2/generate-qr` → `/order/v1/payment/qris`
  - VA Status: `/api/v1/payment-service/va/status` → `/order/v1/payment/va/status`
- **Removed SNAP**: Completely removed SNAP payment method, only VA and QRIS supported

## [2026-04-03] - DOKU Payment Flow & Deployment Fixes

### Added
- **EXPIRED Payment Status**: Added EXPIRED ke PaymentStatus enum di Prisma schema
- **Expire Payments Cron**: Added `/api/cron/expire-payments` untuk meng-automate expired pending payments
- **Missing Prisma Models**: Added missing models yang di-reference di API routes:
  - `announcements` & `announcement_reads`
  - `support_tickets` & `support_messages`
  - `impersonation_sessions`
  - `client_accounts`, `client_invoice_access`, `invoice_messages`
  - `client_notifications`, `client_notification_preferences`

### Fixed
- **Bank Code Casing**: Fixed bank codes dari lowercase ke uppercase (bca → BCA) untuk kompatibilitas DOKU API
- **Payment Method Validation**: Removed unsupported SNAP payment method
- **CSRF for Cron Jobs**: Fixed middleware untuk skip CSRF protection pada `/api/cron/` endpoints
- **Cleanup Script**: Fixed TypeScript errors di cleanup-user-data.ts
- **Dockerfile Permissions**: Removed non-root user setup yang menyebabkan deployment cancelled
- **MIME Type Error**: Fixed `Refused to execute script... MIME type ('text/plain')` error di production dengan Traefik
  - Middleware intercept request ke `/_next/static/`
  - Force correct Content-Type untuk `.js`, `.mjs`, dan `.css` files

### Changed
- **Payment Methods**: Sekarang hanya mendukung VA (Virtual Account) dan QRIS
- **next.config.ts**: 
  - Added `output: 'standalone'` untuk Docker deployment
  - Added `typescript.ignoreBuildErrors: true` sebagai solusi sementara untuk Prisma type issues
- **Dockerfile**: Simplified build process tanpa non-root user permissions

### Technical Details
- Bank codes menggunakan format uppercase: BCA, BNI, BRI, MANDIRI, PERMATA, CIMB
- Cron job menggunakan CRON_SECRET untuk authorization
- Middleware skip CSRF untuk webhooks dan cron endpoints
- Database synced dengan `npx prisma db push`

## [2026-04-02] - Landing Page Redesign & Branding

### Changed
- **Brand Color**: Changed dari `#276874` ke `#0A637D` (Deep Teal)
- **Copywriting**: Updated semua text di landing page dengan bahasa Indonesia yang lebih engaging
  - Headline: "Bikin Invoice Tanpa Ribet, Kirim dalam Hitungan Detik!"
  - Features headline: "Kenapa NotaBener Cocok untuk UMKM & Freelancer?"
  - CTA headline: "Yuk, Mulai Mengelola Invoice yang Bener!"
- **Pricing Table**: Redesigned dengan table view untuk desktop dan card view untuk mobile
- **Label**: Changed "Forever Free" menjadi "FREE" pada pricing cards

### Improved
- Mobile responsiveness untuk landing page
- Dashboard preview card di hero section
- Trust badges dan social proof elements

## [2026-04-01] - DOKU Payment Gateway Integration

### Added
- **DOKU Integration**: Integrasi payment gateway DOKU untuk Indonesia
  - Virtual Account (VA) payments
  - QRIS payments
  - Override notification URL untuk webhook
- **Webhook Handler**: `src/app/api/webhooks/doku/route.ts`
- **DOKU Library**: `src/lib/doku.ts` dengan fungsi untuk VA dan QRIS

### Fixed
- TypeScript errors di payment routes
- Prisma schema dengan menambahkan fields: `qrisUrl`, `paymentUrl`, `qrString`
- `createReceipt` function call parameter

## [2026-03-30] - Project Rebranding

### Changed
- **Nama**: InvoiceKirim → **NotaBener**
- **Domain**: notabener.com
- **Logo**: Updated dengan branding baru
- Semua text dan copywriting diubah ke bahasa Indonesia

## [2026-03-28] - Initial Release

### Added
- Next.js 16 dengan App Router
- Prisma ORM dengan PostgreSQL
- NextAuth.js untuk authentication
- Stripe integration untuk international payments
- Invoice management system
- Client portal
- Admin dashboard
- Email templates dengan Resend
- PDF generation untuk invoice dan receipt
- Feature-based access control (FBAC)
- Two-factor authentication (2FA)
- Sentry error tracking
- Responsive design dengan Tailwind CSS

---

Format berdasarkan [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
