# API Documentation - NotaBener

## Daftar Isi

- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)

## Authentication

NotaBener menggunakan session-based authentication via NextAuth.js.

### Login

```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Session

```http
GET /api/auth/session
```

Response:
```json
{
  "user": {
    "id": "xxx",
    "email": "user@example.com",
    "name": "User Name"
  },
  "expires": "2024-12-31T23:59:59.999Z"
}
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "error": "Error message",
  "details": "Additional details (development only)"
}
```

## Error Handling

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Endpoints

### Invoices

#### List Invoices

```http
GET /api/invoices?page=1&limit=10&status=PENDING
```

Query Parameters:
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 10
- `status` (optional): Filter by status (PENDING, PAID, OVERDUE, CANCELLED)

Response:
```json
{
  "invoices": [...],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

#### Get Invoice

```http
GET /api/invoices/:id
```

Response:
```json
{
  "id": "uuid",
  "invoiceNumber": "INV-2024-001",
  "status": "PENDING",
  "total": 1500000,
  "client": {
    "name": "Client Name",
    "email": "client@example.com"
  },
  "items": [...],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### Create Invoice

```http
POST /api/invoices
Content-Type: application/json

{
  "clientId": "client-uuid",
  "items": [
    {
      "description": "Web Development",
      "quantity": 1,
      "price": 1500000
    }
  ],
  "dueDate": "2024-02-01",
  "notes": "Terima kasih atas kepercayaannya"
}
```

#### Update Invoice

```http
PUT /api/invoices/:id
Content-Type: application/json

{
  "status": "PAID",
  "notes": "Pembayaran diterima"
}
```

#### Delete Invoice

```http
DELETE /api/invoices/:id
```

#### Send Invoice

```http
POST /api/invoices/:id/send
Content-Type: application/json

{
  "method": "email",
  "message": "Custom message"
}
```

### Clients

#### List Clients

```http
GET /api/clients
```

#### Create Client

```http
POST /api/clients
Content-Type: application/json

{
  "name": "Client Name",
  "email": "client@example.com",
  "phone": "+6281234567890",
  "address": "Jakarta, Indonesia"
}
```

### Payments

#### Create Payment

```http
POST /api/payments/create
Content-Type: application/json

{
  "paymentMethod": "VA",
  "bankCode": "BCA",
  "pricingPlanId": "plan-uuid",
  "planSlug": "plan-pro"
}
```

Response:
```json
{
  "success": true,
  "payment": {
    "id": "payment-uuid",
    "orderId": "INV-xxx",
    "amount": 99000,
    "method": "VA",
    "vaNumber": "1234567890",
    "bank": "BCA",
    "expiredAt": "2024-01-02T00:00:00.000Z"
  }
}
```

#### Check Payment Status

```http
GET /api/payments/:id/status
```

Response:
```json
{
  "payment": {
    "id": "uuid",
    "status": "COMPLETED",
    "amount": 99000
  },
  "statusChanged": true
}
```

#### Download Receipt

```http
GET /api/payments/:id/receipt/download
```

Returns PDF file.

### Subscription

#### Get Subscription Status

```http
GET /api/subscription
```

Response:
```json
{
  "subscription": {
    "id": "uuid",
    "status": "ACTIVE",
    "planType": "PRO",
    "currentPeriodEnd": "2024-02-01T00:00:00.000Z"
  }
}
```

### Feature Access

#### Check Feature Access

```http
GET /api/features/:featureKey/check
```

Response:
```json
{
  "allowed": true,
  "planName": "Pro",
  "limit": null,
  "currentUsage": 5
}
```

Locked Response (403):
```json
{
  "allowed": false,
  "reason": "feature_locked",
  "message": "Analytics is available in Pro plan. Upgrade now.",
  "upgradeUrl": "/checkout",
  "planName": "Free"
}
```

### Admin

#### Admin Login

```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@notabener.com",
  "password": "adminpassword"
}
```

#### Get SMTP Settings

```http
GET /api/admin/smtp-settings
```

#### Update SMTP Settings

```http
POST /api/admin/smtp-settings
Content-Type: application/json

{
  "smtpHost": "smtp.gmail.com",
  "smtpPort": "587",
  "smtpSecure": true,
  "smtpUser": "your-email@gmail.com",
  "smtpPass": "app-password",
  "smtpFromName": "NotaBener",
  "smtpFromEmail": "hello@notabener.com"
}
```

### Webhooks

#### DOKU Webhook

```http
POST /api/webhooks/doku
Content-Type: application/json
X-Doku-Signature: xxx

{
  "order": {
    "invoice_number": "INV-xxx"
  },
  "transaction": {
    "status": "SUCCESS",
    "transaction_id": "TRX-xxx"
  }
}
```

#### Stripe Webhook

```http
POST /api/stripe/webhook
Content-Type: application/json
Stripe-Signature: xxx

{
  "type": "checkout.session.completed",
  "data": { ... }
}
```

### Cron Jobs

#### Payment Reminders

```http
POST /api/cron/payment-reminders
X-Cron-Secret: your-cron-secret
```

#### Subscription Expiration

```http
POST /api/cron/subscription-expiration
X-Cron-Secret: your-cron-secret
```

---

## Rate Limiting

API endpoints dibatasi untuk mencegah abuse:

- **Standard endpoints**: 100 requests/minute
- **Auth endpoints**: 10 requests/minute
- **Webhooks**: Unlimited (dengan signature verification)

---

## Webhook Signature Verification

### DOKU

```typescript
import { verifyDOKUSignature } from '@/lib/doku'

const isValid = verifyDOKUSignature(
  requestBody,
  signature,
  timestamp,
  clientId
)
```

### Stripe

Stripe SDK otomatis memverifikasi signature menggunakan `STRIPE_WEBHOOK_SECRET`.

---

**NotaBener** API Documentation
