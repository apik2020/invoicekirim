# Panduan Deployment - NotaBener

## Daftar Isi

- [Prerequisites](#prerequisites)
- [Dokploy Deployment](#dokploy-deployment)
- [Manual Deployment](#manual-deployment)
- [Environment Variables](#environment-variables)
- [Database Migration](#database-migration)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Server dengan Docker installed
- Domain name (optional, tapi recommended)
- PostgreSQL database (bisa Neon, Railway, atau self-hosted)

## Dokploy Deployment

### 1. Setup Dokploy

1. Install Dokploy di server Anda
2. Setup Traefik sebagai reverse proxy

### 2. Create Application

1. Buka Dokploy Dashboard
2. Klik **Create Application**
3. Pilih **GitHub** sebagai source
4. Select repository: `apik2020/invoicekirim`
5. Branch: `main`

### 3. Build Configuration

- **Build Pack**: `Dockerfile`
- **Docker Context**: `.` (root directory)
- **Dockerfile**: Use file dari repository (sudah dikonfigurasi)

**Catatan Penting tentang Dockerfile**:
- Menggunakan `npm start` dengan Next.js built-in server
- Tidak menggunakan `output: 'standalone'` untuk kompatibilitas dengan Traefik
- Middleware di `src/middleware.ts` menangani MIME types untuk static files
- Prisma schema di-copy sebelum `npm ci` untuk postinstall script

### 4. Environment Variables

Tambahkan semua environment variables (lihat section di bawah)

### 5. Deploy

1. Klik **Deploy**
2. Wait for build to complete
3. Configure domain jika diperlukan

### 6. Domain & SSL

1. Buka **Domains** tab
2. Add custom domain: `notabener.com`
3. Enable **Let's Encrypt SSL**
4. Configure DNS records:
   ```
   A    @    your-server-ip
   CNAME www  notabener.com
   ```

### 7. Database Migration

Setelah deploy berhasil, jalankan migration:

```bash
# Via Dokploy Terminal
npx prisma migrate deploy
```

Atau gunakan `prisma db push` jika ada drift:

```bash
npx prisma db push
```

## Manual Deployment

### VPS/Cloud Server

```bash
# 1. Clone repository
git clone https://github.com/apik2020/invoicekirim.git
cd invoicekirim

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
nano .env  # Edit dengan konfigurasi Anda

# 4. Build
npm run build

# 5. Start dengan PM2
npm install -g pm2
pm2 start npm --name "notabener" -- start
pm2 save
pm2 startup
```

### Docker Deployment

```bash
# Build image
docker build -t notabener .

# Run container
docker run -d \
  --name notabener \
  -p 3000:3000 \
  --env-file .env \
  notabener
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: notabener
      POSTGRES_USER: notabener
      POSTGRES_PASSWORD: yourpassword
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Environment Variables

### Required (Wajib)

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/notabener"

# NextAuth
NEXTAUTH_URL="https://notabener.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# App URL
NEXT_PUBLIC_APP_URL="https://notabener.com"
```

### Payment Gateway

```bash
# DOKU (Indonesia)
DOKU_CLIENT_ID="BRN-xxxx-xxxxxxxxxxxx"
DOKU_SECRET_KEY="SK-xxxxxxxxxxxx"
DOKU_ENVIRONMENT="PRODUCTION"

# Stripe (International)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID="price_..."
```

### Email

```bash
# Resend
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="hello@notabener.com"

# Atau SMTP manual via Admin Dashboard
```

### Cron Jobs

```bash
CRON_SECRET="your-cron-secret-here"
```

### Optional

```bash
# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Sentry (Error tracking)
NEXT_PUBLIC_SENTRY_DSN="..."
SENTRY_ORG="..."
SENTRY_PROJECT="..."
```

## Database Migration

### Development

```bash
npx prisma migrate dev --name description
```

### Production

```bash
# Standard migration
npx prisma migrate deploy

# Jika ada drift (development tanpa migration)
npx prisma db push
```

### Seed Initial Data

```bash
npx prisma db seed
```

## Troubleshooting

### MIME Type Error (Traefik + Dokploy)

**Error**: `Refused to execute script... MIME type ('text/plain') is not executable`

**Penyebab**: Traefik meng-override Content-Type header dari Next.js server.

**Solusi** (sudah diimplementasikan):

1. **Middleware Force MIME Types** (`src/middleware.ts`):
   ```typescript
   // Handle static files - force correct MIME types
   if (pathname.startsWith('/_next/static/')) {
     const response = NextResponse.next()
     if (pathname.endsWith('.js') || pathname.endsWith('.mjs')) {
       response.headers.set('Content-Type', 'application/javascript; charset=utf-8')
     }
     if (pathname.endsWith('.css')) {
       response.headers.set('Content-Type', 'text/css; charset=utf-8')
     }
     return response
   }
   ```

2. **Dockerfile Configuration**:
   - Gunakan `npm start` mode (bukan standalone)
   - Hapus non-root user permissions untuk menghindari deployment issues
   - Copy semua file termasuk `node_modules`, `.next`, dan `prisma`

3. **Traefik Configuration** (di Dokploy):
   - Tambahkan middleware dengan `contentTypeNosniff: true`
   - Pastikan tidak ada compression yang mengganggu headers

4. **Setelah Deploy**:
   - Clear browser cache (Cmd+Shift+Delete)
   - Hard refresh (Cmd+Shift+R)
   - Test di incognito/private mode

### Build Failed

**Error**: TypeScript errors

**Solusi**:
1. Check TypeScript version
2. Run `npm run build` locally first
3. Fix all type errors sebelum deploy

### Database Connection Error

**Error**: `Can't reach database server`

**Solusi**:
1. Check `DATABASE_URL` format
2. Ensure database is accessible from server
3. Check firewall rules

### Hydration Mismatch

**Error**: `Hydration failed because the server rendered text didn't match`

**Solusi**:
1. Clear `.next` folder
2. Rebuild: `npm run build`
3. Clear browser cache

### Payment Webhook Not Working

**Solusi**:
1. Check webhook URL is accessible
2. Verify DOKU/Stripe configuration
3. Check server logs for errors

---

**NotaBener** Deployment Guide
