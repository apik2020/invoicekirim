# NotaBener Documentation

Selamat datang di dokumentasi NotaBener.

## Quick Links

| Document | Description |
|----------|-------------|
| [README.md](../README.md) | Project overview & getting started |
| [Deployment Guide](./DEPLOYMENT.md) | Cara deploy ke production |
| [API Documentation](./API.md) | REST API endpoints |
| [Database Schema](./DATABASE.md) | Database structure |
| [Feature Access System](./FEATURE_ACCESS_SYSTEM.md) | Subscription & feature control |

## Project Overview

**NotaBener** adalah platform invoice profesional untuk freelancer Indonesia.

### Key Features
- Buat invoice profesional
- Kirim via WhatsApp & Email
- Lacak pembayaran
- Custom branding
- Multi-currency support

### Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Payment**: Duitku (Indonesia), Stripe (International)
- **Email**: Resend / Custom SMTP

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env dengan konfigurasi Anda
```

### 3. Setup Database

```bash
npx prisma migrate dev
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
notaBener/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/         # API endpoints
│   │   ├── dashboard/   # Dashboard pages
│   │   └── ...
│   ├── components/       # React components
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilities & integrations
│   └── types/           # TypeScript types
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Migration files
├── docs/                 # Documentation
└── scripts/             # Utility scripts
```

## Documentation Index

### For Developers

- [API Documentation](./API.md) - REST API endpoints & usage
- [Database Schema](./DATABASE.md) - Tables & relationships

### For DevOps

- [Deployment Guide](./DEPLOYMENT.md) - Deploy to production
- [Environment Variables](../README.md#environment-variables) - Required config

### For Product

- [Feature Access System](./FEATURE_ACCESS_SYSTEM.md) - Subscription tiers

## Support

- Website: [https://notabener.com](https://notabener.com)
- Email: hello@notabener.com
- GitHub: [Issues](https://github.com/apik2020/invoicekirim/issues)

---

**NotaBener** - Bikin invoice jadi gampang!
