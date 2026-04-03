# Changelog

Semua perubahan penting di project NotaBener akan didokumentasikan di file ini.

## [Unreleased]

## [2026-04-03] - DOKU Payment Flow Improvements

### Fixed
- **Bank Code Casing**: Fixed bank codes dari lowercase ke uppercase (bca → BCA) untuk kompatibilitas DOKU API
- **Payment Method Validation**: Removed unsupported SNAP payment method
- **CSRF for Cron Jobs**: Fixed middleware untuk skip CSRF protection pada `/api/cron/` endpoints

### Changed
- **Payment Methods**: Sekarang hanya mendukung VA (Virtual Account) dan QRIS
- Removed SNAP payment option dari checkout page dan API

### Added
- **EXPIRED Payment Status**: Added EXPIRED ke PaymentStatus enum di Prisma schema
- **Expire Payments Cron**: Added `/api/cron/expire-payments` untuk meng-automate expired pending payments

### Technical Details
- Bank codes sekarang menggunakan format uppercase: BCA, BNI, BRI, MANDIRI, PERMATA, CIMB
- Cron job menggunakan CRON_SECRET untuk authorization
- Expired payments diupdate secara otomatis dengan activity logging
- Middleware skip CSRF untuk cron endpoints karena menggunakan CRON_SECRET verification

## [2026-04-03] - Fix MIME Type Issue untuk Traefik/Dokploy

### Fixed
- **MIME Type Error**: Fixed `Refused to execute script... MIME type ('text/plain')` error di production dengan Traefik
  - Penyebab: Traefik meng-override Content-Type header dari Next.js server
  - Solusi: Tambah middleware di `src/middleware.ts` untuk force MIME types yang benar

### Changed
- **Dockerfile**: Removed non-root user permissions yang menyebabkan deployment cancelled
- **Dockerfile**: Simplified build process - copy semua files tanpa permission restrictions
- **Deployment docs**: Updated dengan troubleshooting lengkap untuk MIME type issue

### Technical Details
- Middleware sekarang intercept semua request ke `/_next/static/`
- Force `Content-Type: application/javascript` untuk file `.js` dan `.mjs`
- Force `Content-Type: text/css` untuk file `.css`

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
