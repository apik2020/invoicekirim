import midtransClient from 'midtrans-client'

// Initialize Midtrans Snap API client
const getSnapClient = () => {
  return new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
  })
}

// Initialize Core API client for status checks
const getCoreApiClient = () => {
  return new midtransClient.CoreApi({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
  })
}

export interface CreateTransactionParams {
  orderId: string
  amount: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  description: string
}

export interface TransactionResult {
  token: string
  redirectUrl: string
  orderId: string
}

export interface VAPaymentResult {
  orderId: string
  vaNumber: string
  bank: string
  amount: number
  expiredAt: Date
}

export interface QRISPaymentResult {
  orderId: string
  qrImageUrl: string
  qrString: string
  amount: number
  expiredAt: Date
}

// Create transaction with Snap (supports all payment methods)
export async function createTransaction(params: CreateTransactionParams): Promise<TransactionResult> {
  const snap = getSnapClient()

  const transaction = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.amount,
    },
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone || '',
    },
    item_details: [
      {
        id: 'subscription-pro',
        price: params.amount,
        quantity: 1,
        name: params.description,
      },
    ],
    callbacks: {
      finish: `${process.env.NEXTAUTH_URL}/dashboard/billing?payment=finish`,
      error: `${process.env.NEXTAUTH_URL}/dashboard/billing?payment=error`,
      pending: `${process.env.NEXTAUTH_URL}/dashboard/billing?payment=pending`,
    },
  }

  const response = await snap.createTransaction(transaction)

  return {
    token: response.token,
    redirectUrl: response.redirect_url,
    orderId: params.orderId,
  }
}

// Create Virtual Account payment
export async function createVAPayment(
  bank: 'bca' | 'bni' | 'bri' | 'mandiri' | 'permata' | 'cimb',
  params: CreateTransactionParams
): Promise<VAPaymentResult> {
  const coreApi = getCoreApiClient()

  const expiryDuration = 24 * 60 // 24 hours in minutes
  const expiredAt = new Date(Date.now() + expiryDuration * 60 * 1000)

  const parameter = {
    payment_type: 'bank_transfer' as const,
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.amount,
    },
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone || '',
    },
    item_details: [
      {
        id: 'subscription-pro',
        price: params.amount,
        quantity: 1,
        name: params.description,
      },
    ],
    bank_transfer: {
      bank: bank,
      va_number: '',
      free_text: {
        inquiry: [
          {
            id: 'Pembayaran InvoiceKirim Pro',
            en: 'InvoiceKirim Pro Payment',
          },
        ],
        payment: [
          {
            id: 'Terima kasih atas pembayaran Anda',
            en: 'Thank you for your payment',
          },
        ],
      },
    },
    custom_expiry: {
      expiry_duration: expiryDuration,
      unit: 'minute' as const,
    },
  }

  const response = await coreApi.charge(parameter)

  if (!response.va_numbers || response.va_numbers.length === 0) {
    throw new Error('Failed to get VA number from Midtrans')
  }

  return {
    orderId: params.orderId,
    vaNumber: response.va_numbers[0].va_number,
    bank: response.va_numbers[0].bank.toUpperCase(),
    amount: params.amount,
    expiredAt,
  }
}

// Create QRIS payment
export async function createQRISPayment(params: CreateTransactionParams): Promise<QRISPaymentResult> {
  const coreApi = getCoreApiClient()

  const expiryDuration = 15 // 15 minutes for QRIS
  const expiredAt = new Date(Date.now() + expiryDuration * 60 * 1000)

  const parameter = {
    payment_type: 'qris' as const,
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.amount,
    },
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone || '',
    },
    item_details: [
      {
        id: 'subscription-pro',
        price: params.amount,
        quantity: 1,
        name: params.description,
      },
    ],
    qris: {
      acquirer: 'gopay',
    },
    custom_expiry: {
      expiry_duration: expiryDuration,
      unit: 'minute' as const,
    },
  }

  const response = await coreApi.charge(parameter)

  return {
    orderId: params.orderId,
    qrImageUrl: response.actions?.find((a: any) => a.name === 'generate-qr-code')?.url || '',
    qrString: response.qr_string || '',
    amount: params.amount,
    expiredAt,
  }
}

// Get transaction status
export async function getTransactionStatus(orderId: string) {
  const coreApi = getCoreApiClient()

  const response = await coreApi.transaction.status(orderId)

  return {
    orderId: response.order_id,
    transactionStatus: response.transaction_status,
    paymentType: response.payment_type,
    grossAmount: parseFloat(response.gross_amount),
    transactionTime: response.transaction_time,
    vaNumber: response.va_numbers?.[0]?.va_number || null,
    bank: response.va_numbers?.[0]?.bank || null,
    fraudStatus: response.fraud_status,
  }
}

// Verify webhook notification signature
export function verifyNotificationSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
  receivedSignature: string
): boolean {
  const crypto = require('crypto')
  const input = orderId + statusCode + grossAmount + serverKey
  const expectedSignature = crypto.createHash('sha512').update(input).digest('hex')
  return expectedSignature === receivedSignature
}

// Bank names for VA
export const VA_BANKS = [
  { code: 'bca', name: 'BCA', logo: '/images/banks/bca.png' },
  { code: 'bni', name: 'BNI', logo: '/images/banks/bni.png' },
  { code: 'bri', name: 'BRI', logo: '/images/banks/bri.png' },
  { code: 'mandiri', name: 'Mandiri', logo: '/images/banks/mandiri.png' },
  { code: 'permata', name: 'Permata', logo: '/images/banks/permata.png' },
  { code: 'cimb', name: 'CIMB Niaga', logo: '/images/banks/cimb.png' },
] as const

export type VABankCode = typeof VA_BANKS[number]['code']
