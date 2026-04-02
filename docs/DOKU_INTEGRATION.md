# DOKU Integration - NotaBener

## Overview

NotaBener menggunakan DOKU sebagai payment gateway utama untuk pembayaran Indonesia.

## Supported Payment Methods

| Method | Type | Banks/Providers |
|--------|------|-----------------|
| Virtual Account | VA | BCA, Mandiri, BNI, BRI, CIMB, Permata |
| QRIS | QR | GoPay, ShopeePay, Dana, LinkAja, OVO |

## Configuration

### Environment Variables

```bash
DOKU_CLIENT_ID="BRN-xxxx-xxxxxxxxxxxx"
DOKU_SECRET_KEY="SK-xxxxxxxxxxxx"
DOKU_ENVIRONMENT="SANDBOX"  # SANDBOX or PRODUCTION
```

### API Endpoints

| Environment | Base URL |
|-------------|----------|
| Sandbox | `https://api-sandbox.doku.com` |
| Production | `https://api.doku.com` |

## Integration Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   User      │     │   NotaBener  │     │      DOKU       │
└──────┬──────┘     └──────┬───────┘     └────────┬────────┘
       │                    │                       │
       │ 1. Select Payment  │                       │
       │    Method          │                       │
       │───────────────────>│                       │
       │                    │                       │
       │                    │ 2. Create Payment     │
       │                    │──────────────────────>│
       │                    │                       │
       │                    │ 3. Return VA/QRIS     │
       │                    │<──────────────────────│
       │                    │                       │
       │ 4. Display Payment │                       │
       │    Details         │                       │
       │<───────────────────│                       │
       │                    │                       │
       │ 5. User Pays       │                       │
       │────────────────────────────────────────────>│
       │                    │                       │
       │                    │ 6. Webhook Notification
       │                    │<──────────────────────│
       │                    │                       │
       │ 7. Update Status   │                       │
       │    & Activate Pro  │                       │
       │                    │                       │
       │ 8. Redirect to     │                       │
       │    Success Page    │                       │
       │<───────────────────│                       │
```

## API Implementation

### Create VA Payment

```typescript
import { createVAPayment, DOKUVABankCode } from '@/lib/doku'

const result = await createVAPayment('BCA', {
  orderId: 'INV-2024-001',
  amount: 99000,
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  description: 'NotaBener Pro Subscription'
})

// Result:
{
  paymentUrl: 'https://checkout.doku.com/...',
  orderId: 'INV-2024-001',
  token: 'xxx',
  expiryDate: Date,
  vaNumber: '1234567890',
  bank: 'BCA'
}
```

### Create QRIS Payment

```typescript
import { createQRISPayment } from '@/lib/doku'

const result = await createQRISPayment({
  orderId: 'INV-2024-001',
  amount: 99000,
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  description: 'NotaBener Pro Subscription'
})

// Result:
{
  paymentUrl: 'https://checkout.doku.com/...',
  orderId: 'INV-2024-001',
  token: 'xxx',
  expiryDate: Date,
  qrString: '000201...',
  qrImageUrl: 'https://api.doku.com/qr/xxx.png'
}
```

### Check Payment Status

```typescript
import { getPaymentStatus } from '@/lib/doku'

const status = await getPaymentStatus('INV-2024-001')

// Result:
{
  payment_status: 'SUCCESS',
  transaction: {
    transaction_id: 'TRX-xxx',
    amount: 99000,
    currency: 'IDR'
  }
}
```

## Webhook Handler

### Endpoint

```
POST /api/webhooks/doku
```

### Webhook Flow

1. DOKU mengirim notifikasi ke webhook endpoint
2. Server memverifikasi signature
3. Server update payment status di database
4. Jika payment berhasil, activate subscription
5. Kirim email receipt ke user

### Signature Verification

```typescript
import { verifyDOKUSignature } from '@/lib/doku'

// Webhook handler
const rawBody = await request.text()
const signature = request.headers.get('X-Doku-Signature')
const timestamp = request.headers.get('X-Doku-Timestamp')
const clientId = request.headers.get('Client-Id')

const isValid = verifyDOKUSignature(rawBody, signature, timestamp, clientId)

if (!isValid) {
  return Response.json({ error: 'Invalid signature' }, { status: 401 })
}
```

### Override Notification URL

NotaBener menggunakan `override_notification_url` untuk mengirim webhook langsung ke server tanpa perlu konfigurasi di DOKU Dashboard:

```typescript
// Di setiap request ke DOKU
{
  ...requestBody,
  additional_info: {
    override_notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/doku`
  }
}
```

## Payment Status Mapping

| DOKU Status | NotaBener Status |
|-------------|------------------|
| SUCCESS | COMPLETED |
| PAYMENT_SUCCESS | COMPLETED |
| PENDING | PENDING |
| FAILED | FAILED |
| PAYMENT_FAILED | FAILED |
| EXPIRED | FAILED |

## Testing

### Sandbox Testing

1. Set `DOKU_ENVIRONMENT="SANDBOX"`
2. Gunakan test VA numbers dari DOKU documentation
3. Simulasi payment via DOKU Dashboard

### Test Cards (untuk credit card via QRIS)

Lihat dokumentasi DOKU untuk test card numbers.

## Error Handling

```typescript
try {
  const result = await createVAPayment('BCA', params)
} catch (error) {
  console.error('DOKU Payment Error:', error.message)
  
  // Common errors:
  // - Invalid credentials
  // - Invalid amount
  // - Bank not available
  // - Network timeout
}
```

## Best Practices

1. **Always verify webhook signature** - Jangan proses webhook tanpa verifikasi
2. **Handle idempotency** - Webhook bisa dikirim berkali-kali
3. **Log all transactions** - Untuk debugging dan audit
4. **Set reasonable timeout** - Default 24 jam untuk VA, 15 menit untuk QRIS
5. **Handle network failures** - Implement retry logic untuk API calls

## Files Reference

| File | Purpose |
|------|---------|
| `src/lib/doku.ts` | DOKU API integration |
| `src/app/api/webhooks/doku/route.ts` | Webhook handler |
| `src/app/api/payments/create/route.ts` | Payment creation |
| `src/app/api/payments/[id]/status/route.ts` | Status check |

## Troubleshooting

### Webhook tidak diterima

1. Check `override_notification_url` di request
2. Verify `NEXT_PUBLIC_APP_URL` benar
3. Check server logs
4. Test dengan curl ke webhook endpoint

### Payment gagal

1. Verify DOKU credentials
2. Check amount format (integer, no decimal)
3. Verify bank code
4. Check DOKU dashboard untuk error details

### Signature verification failed

1. Verify `DOKU_SECRET_KEY` benar
2. Check timestamp format
3. Ensure raw body digunakan untuk verification

---

**NotaBener** DOKU Integration Guide
