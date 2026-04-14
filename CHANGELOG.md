# Changelog

Semua perubahan penting di project NotaBener akan didokumentasikan di file ini.

## [Unreleased]

## [0.1.72] - 2026-04-14 — WhatsApp Integration (OpenWA)

### Added

- **WhatsApp integration via OpenWA**: Kirim invoice dan reminder otomatis melalui WhatsApp menggunakan OpenWA API.
  - Library `src/lib/whatsapp.ts` — client untuk koneksi ke OpenWA instance (health check, send text, send image)
  - API routes: `/api/whatsapp/health` (connection test), `/api/whatsapp/send` (send message), `/api/whatsapp/invoice/[id]` (send invoice/reminder)
  - Invoice detail page (`/dashboard/invoices/[id]`): Tombol "Kirim via WhatsApp" sekarang otomatis mengirim via OpenWA API, dengan fallback ke `wa.me` jika OpenWA tidak tersedia
  - Admin settings: `/admin/settings/whatsapp` — Status koneksi, konfigurasi read-only (via env vars), dan test koneksi
  - Message templates: invoice notification, payment reminder, payment confirmation
  - Activity logging: setiap pesan WhatsApp yang terkirim dicatat di `activity_logs`
- **Environment variables**:
  - `OPENWA_BASE_URL` — URL OpenWA instance (default: `http://localhost:55111`)
  - `OPENWA_API_KEY` — API key untuk X-API-Key header
  - `OPENWA_SESSION_ID` — WhatsApp session ID (default: `notabener`)

### Changed

- **Invoice WhatsApp button**: Dari membuka `wa.me` link (manual) ke OpenWA API call (otomatis) dengan graceful fallback
- **Admin navigation**: Tambah menu "WhatsApp" di Settings dropdown

### Technical Details

- Phone number formatting: strip non-digits, convert leading `0` to `62` (Indonesia country code)
- OpenWA auth: `X-API-Key` header, `POST /api/messages/send` endpoint
- Graceful degradation: jika OpenWA tidak dikonfigurasi/gagal, otomatis fallback ke `wa.me` deep link
- Tombol WhatsApp menampilkan loading state saat mengirim via OpenWA

### Deployment Checklist

1. Deploy OpenWA instance (Docker: `nicbarker/open-wa`)
2. Set env vars: `OPENWA_BASE_URL`, `OPENWA_API_KEY`, `OPENWA_SESSION_ID`
3. Scan QR code di OpenWA dashboard untuk connect nomor WhatsApp
4. Test koneksi di `/admin/settings/whatsapp`

### Files Changed

```
src/lib/whatsapp.ts                                     | 280 +++ (new)
src/app/api/whatsapp/health/route.ts                    |  38 +++ (new)
src/app/api/whatsapp/send/route.ts                      |  52 +++ (new)
src/app/api/whatsapp/invoice/[id]/route.ts              | 110 +++ (new)
src/app/api/admin/whatsapp-settings/route.ts            |  38 +++ (new)
src/app/admin/settings/whatsapp/page.tsx                | 245 +++ (new)
src/app/dashboard/invoices/[id]/page.tsx                |  60 +-
src/components/admin/AdminLayout.tsx                    |   1 +
.env.example                                           |  12 ++
```

## [0.1.71] - 2026-04-14 — Bug Fix

### Fixed
- **Security settings page logout bug**: Race condition di `/dashboard/settings/security` — `useEffect` redirect ke `/login` saat session masih loading (`null`). Diperbaiki dengan cek `status === 'unauthenticated'` alih-alih `!session`.
- **Auth debug flag**: `debug: true` yang di-hardcode di `auth.ts` sekarang membaca dari `NEXTAUTH_DEBUG` env var.

## [0.1.70] - 2026-04-13 — Security Hardening & Production Readiness

### Security

- **NEXTAUTH_SECRET**: Ganti default value lemah dengan key yang kuat. **Wajib update di server production.**
- **NEXTAUTH_DEBUG**: Set `false` untuk mencegah information leakage di response.
- **Client session HMAC signing**: Session client portal sekarang menggunakan HMAC-SHA256 + `timingSafeEqual`. Sebelumnya hanya base64 tanpa signature — attacker bisa memalsukan `clientId` untuk mengakses invoice user lain.
- **SSRF protection (image proxy)**: Block private IP (`10.x`, `172.16-31.x`, `192.168.x`, `127.0.0.1`), cloud metadata endpoint (`169.254.169.254`), dan validasi redirect destination. Hanya allow content-type `image/*`.
- **Admin impersonation secret**: Hapus fallback `"your-secret-key"`. Sekarang throw error jika `NEXTAUTH_SECRET` tidak diset.
- **File magic bytes validation**: Upload validasi signature binary (PNG: `89504E47`, JPEG: `FFD8FF`, WebP: `RIFF....WEBP`, SVG: marker `<svg`) untuk mencegah MIME type spoofing.
- **Remove debug/test endpoints**: Hapus `api/debug-auth`, `api/test-error`, `api/auth-simple`, dan `test-error` page — semua bisa diakses tanpa auth dan mengekspos informasi internal.

### Data Integrity

- **Webhook idempotency**: Duitku dan Midtrans webhook cek `payment.status === 'COMPLETED'` sebelum memproses — mencegah duplikasi pembayaran dan aktivasi subscription dari retry webhook.
- **Webhook `$transaction()`**: Payment update + subscription activation + activity log dibungkus dalam Prisma transaction. Jika satu gagal, semua di-rollback.
- **Payment verification transaction**: `api/payments/verify` menggunakan `$transaction()` dengan idempotency re-check di dalam transaksi.
- **Invoice send flow fix**: Status invoice hanya update ke `SENT` jika email berhasil terkirim. Jika gagal, tetap `DRAFT` dan user mendapat error message yang jelas.

### Performance

- **Clients pagination**: `GET /api/clients` mendukung `page`, `limit`, `search`. Default 50 per halaman dengan response format baru `{ clients, pagination }`.
- **Dashboard parallel fetch**: `fetchDashboardData()` dan `fetchSubscription()` sekarang jalan paralel dengan `Promise.all()`.
- **Login rate limiting DB-backed**: Dari in-memory `Map` ke database-backed via `activity_logs` table, dengan in-memory fallback. Mendukung multi-instance deployment (pod restart tidak reset rate limit).

### Cron Jobs

- **Concurrency guard**: Trial expiration dan subscription expiration cron menggunakan DB-based lock (valid 10 menit) untuk mencegah eksekusi duplikat saat dipanggil bersamaan.

### Schema Changes

- **`client_accounts` model**: Tambah kolom `name` (String?), `phone` (String?), `magicLinkToken` (String?), `magicLinkExpires` (DateTime?). Kolom `password` jadi optional (String?).

### Breaking Changes

- **Client portal sessions invalid**: Semua existing client sessions akan invalid karena format token berubah (base64 → HMAC-signed). User perlu re-login via magic link.
- **Clients API response format**: `GET /api/clients` sekarang mengembalikan `{ clients, pagination }` bukan array langsung. Frontend perlu disesuaikan jika ada yang consume langsung.

### Deployment Checklist

1. Update `NEXTAUTH_SECRET` di server — generate baru: `openssl rand -base64 32`
2. Set `NEXTAUTH_DEBUG=false` di environment server
3. Jalankan `npx prisma db push` untuk update schema
4. Clear browser cache setelah deploy

### Regression Watch

- Client portal: existing sessions invalid, perlu re-login
- Invoice send: jika SMTP sering timeout, invoice tetap DRAFT (bukan auto-SENT)
- File upload: file dengan ekstensi benar tapi header corrupt akan ditolak
- Image proxy: gambar dari internal URL (localhost) akan ditolak
- Webhook: verify Duitku/Midtrans webhook masih diterima setelah refactor

### Files Changed (20 files, +795 / -702)

```
next.config.ts                                    |   5 +-
prisma/schema.prisma                              |   6 +-
src/app/api/admin/users/[id]/impersonate/route.ts |   6 +-
src/app/api/auth-simple/route.ts                  |  32 --- (deleted)
src/app/api/client/auth/verify/route.ts           |  15 +-
src/app/api/clients/route.ts                      |  57 ++++-
src/app/api/cron/subscription-expiration/route.ts |  31 +++
src/app/api/cron/trial-expiration/route.ts        |  33 ++++
src/app/api/debug-auth/route.ts                   |  46 --- (deleted)
src/app/api/invoices/[id]/send/route.ts           |  80 ++++--
src/app/api/payments/verify/route.ts              | 172 ++++++-----
src/app/api/proxy-image/route.ts                  |  65 ++++-
src/app/api/test-error/route.ts                   |  58 --- (deleted)
src/app/api/upload/route.ts                       |  49 ++++-
src/app/api/webhooks/duitku/route.ts              | 221 ++++++--------
src/app/api/webhooks/midtrans/route.ts            | 230 ++++++++---------
src/app/dashboard/page.tsx                        |   4 +-
src/app/test-error/page.tsx                       | 140 ---------- (deleted)
src/lib/client-auth.ts                            |  81 ++++--
src/lib/login-attempts.ts                         | 166 ++++++++---
```

## [2026-04-05] - Invoice PDF Redesign & Bug Fixes

### Changed
- **Invoice PDF Layout**: Redesigned invoice PDF untuk tampilan yang lebih profesional dan compact
  - Layout 1 halaman A4 (tidak ada halaman kedua yang kosong)
  - Header dengan logo badge dan nama perusahaan
  - Two-column bill-to section (Our Information | Billing For)
  - 6-column items table (Product, Qty, Unit Price, Disc, Tax, Total)
  - Totals section right-aligned dengan grand total yang di-highlight
  - Bottom section dengan terms dan signature area
  - Font: Times-Roman untuk tampilan profesional

### Fixed
- **Invoice API Response**: Fixed mapping `invoice_items` ke `items` untuk frontend compatibility
  - GET `/api/invoices/[id]` sekarang mengembalikan `items` sebagai pengganti `invoice_items`
  - Mencegah error "Cannot read properties of undefined (reading 'map')" di halaman invoice detail

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
