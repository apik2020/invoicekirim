# Payment Gateway Strategy - NotaBener

## Status Terkini (Updated: 2026-05-29)

**Gateway Aktif:**
- ✅ **iPaymu** - Gateway utama untuk Indonesia (VA, QRIS, E-Wallet)

**Gateway Tidak Aktif untuk Pembayaran Baru (Legacy Support Only):**
- ⚠️ **Midtrans** - Webhook aktif untuk support legacy payments, tapi tidak digunakan untuk pembayaran baru
- ❌ **Stripe** - Reserved untuk rencana international di masa depan
- ❌ **Duitku** - Reserved (webhook mungkin belum exist)

## Files Terkait Gateway Aktif (iPaymu)

### Integration & Logic
- `/src/lib/payment/ipaymu.ts` - iPaymu integration logic
- `/src/lib/payment/index.ts` - Payment facade/wrapper
- `/src/app/api/webhooks/ipaymu/route.ts` - Webhook handler untuk payment notifications
- `/src/app/api/payments/create/route.ts` - Payment creation endpoint

### Environment Variables (Required)
```bash
IPAYMU_VA=your_ipaymu_va
IPAYMU_API_KEY=your_ipaymu_api_key
IPAYMU_MODE=SANDBOX  # SANDBOX or PRODUCTION
```

## Files Tidak Aktif (Reserved - Jangan Dihapus)

### Duitku (Inactive)
- `/src/app/api/webhooks/duitku/route.ts` - Duitku webhook handler (tidak aktif)
- Environment variables: `DUITKU_MERCHANT_CODE`, `DUITKU_API_KEY`, `DUITKU_CALLBACK_URL`

### Midtrans (Inactive)
- `/src/app/api/webhooks/midtrans/route.ts` - Midtrans webhook handler (tidak aktif)
- Environment variables: `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION`

### Stripe (Inactive - Reserved for International)
- `/src/app/api/stripe/webhook/route.ts` - Stripe webhook handler (tidak aktif)
- Stripe-related routes di `/src/app/api/stripe/*`
- Environment variables: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`

## Alur Payment dengan iPaymu

### 1. Create Payment Link
```typescript
// User clicks "Pay Invoice" button
POST /api/payments/create
{
  "invoiceId": "invoice_id",
  "amount": 1000000,
  "method": "va" | "qris" | "ewallet"
}

// Backend creates payment via iPaymu API
// Returns payment URL for user to complete payment
```

### 2. User Completes Payment
- User redirected ke iPaymu payment page
- User memilih bank/payment method
- User menyelesaikan pembayaran

### 3. Webhook Notification
```typescript
// iPaymu sends webhook to our server
POST /api/webhooks/ipaymu
{
  "status": "success" | "pending" | "failed",
  "trx_id": "ipaymu_transaction_id",
  "reference_id": "our_invoice_id",
  // ... other fields
}

// Backend updates invoice status & payment record
```

### 4. Success Redirect
- User redirected kembali ke app dengan status payment
- Invoice status updated to PAID
- Email notification sent

## Testing iPaymu Integration

### Sandbox Mode
Set `IPAYMU_MODE=SANDBOX` untuk testing:

```bash
IPAYMU_MODE=SANDBOX
IPAYMU_VA=sandbox_va_number
IPAYMU_API_KEY=sandbox_api_key
```

### Webhook Testing
Use ngrok atau tools lain untuk expose local server:
```bash
ngrok http 3000
# Update iPaymu dashboard webhook URL to: https://your-ngrok-url.ngrok.io/api/webhooks/ipaymu
```

## Rencana Masa Depan

### Menambahkan Gateway Baru
Jika ingin menambahkan Stripe (untuk international) atau gateway lain:

1. **Dokumentasikan di sini terlebih dahulu** - Alasan, use case, target market
2. **Implement integration** di `/src/lib/payment/gateway-name.ts`
3. **Add webhook handler** di `/src/app/api/webhooks/gateway-name/route.ts`
4. **Update payment facade** di `/src/lib/payment/index.ts` untuk support multi-gateway
5. **Test thoroughly** dengan sandbox mode
6. **Update documentation** (this file + CLAUDE.md)

### Multi-Gateway Strategy (Future)
Jika ingin support multiple gateways simultaneously:

```typescript
// Example future implementation
interface PaymentGatewayConfig {
  provider: 'ipaymu' | 'stripe' | 'duitku'
  enabled: boolean
  supportedMethods: string[]
  countries: string[]
}

// Let users choose gateway based on their needs
// - iPaymu: Indonesia domestic
// - Stripe: International
// - Duitku: Indonesia alternative
```

## Troubleshooting

### Webhook tidak diterima
1. Check webhook URL di iPaymu dashboard
2. Verify endpoint accessible dari internet (use ngrok for local testing)
3. Check logs: `logger.payment('Webhook received', { provider: 'ipaymu', data })`

### Payment success tapi invoice belum update
1. Check webhook signature validation
2. Verify reference_id mapping ke invoice_id
3. Check database transaction - pastikan tidak ada error saat update

### Testing di local environment
```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Expose with ngrok
ngrok http 3000

# Update iPaymu webhook URL di dashboard
# Test payment, monitor logs dengan logger
```

## Security Notes

### Webhook Signature Validation
Always validate webhook signatures untuk prevent unauthorized requests:

```typescript
// Verify request came from iPaymu
const signature = req.headers.get('x-ipaymu-signature')
const isValid = verifyIPaymuSignature(body, signature, IPAYMU_API_KEY)

if (!isValid) {
  logger.warn('Invalid webhook signature', { provider: 'ipaymu' })
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
}
```

### Environment Variables
- **NEVER commit** API keys ke git
- Use `.env.local` untuk local development
- Use secure environment variable storage di production (Dokploy secrets, etc.)

### Rate Limiting
Consider adding rate limiting untuk webhook endpoints untuk prevent abuse.

---

**Last Updated:** 2026-05-29
**Maintained By:** Development Team
