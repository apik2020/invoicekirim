import crypto from 'crypto'

// DOKU Environment Configuration
const DOKU_CONFIG = {
  isProduction: process.env.DOKU_ENVIRONMENT === 'PRODUCTION',
  clientId: process.env.DOKU_CLIENT_ID || '',
  secretKey: process.env.DOKU_SECRET_KEY || '',
  apiUrl: process.env.DOKU_ENVIRONMENT === 'PRODUCTION'
    ? 'https://api.doku.com'
    : 'https://api-sandbox.doku.com',
}

// Log DOKU config on module load (for debugging)
console.log('[DOKU] Module loaded with config:', {
  hasClientId: !!DOKU_CONFIG.clientId,
  hasSecretKey: !!DOKU_CONFIG.secretKey,
  environment: DOKU_CONFIG.isProduction ? 'PRODUCTION' : 'SANDBOX',
  apiUrl: DOKU_CONFIG.apiUrl,
})

// DOKU API Headers
function getDokuHeaders() {
  const timestamp = Date.now().toString()
  const signature = crypto
    .createHmac('sha256', DOKU_CONFIG.secretKey)
    .update(timestamp + ':' + DOKU_CONFIG.clientId)
    .digest('hex')

  return {
    'Content-Type': 'application/json',
    'Client-Id': DOKU_CONFIG.clientId,
    'Request-Id': crypto.randomUUID(),
    'Request-Timestamp': timestamp,
    'Signature': signature,
  }
}

// Generate signature for DOKU requests
function generateSignature(
  method: string,
  url: string,
  timestamp: string,
  requestBody: string
): string {
  const digest = crypto
    .createHash('sha256')
    .update(requestBody)
    .digest('hex')

  const signatureComponent = `${method}:${url}:${timestamp}:${digest}`
  return crypto
    .createHmac('sha256', DOKU_CONFIG.secretKey)
    .update(signatureComponent)
    .digest('hex')
}

export interface CreatePaymentParams {
  orderId: string
  amount: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  description: string
  expiryPeriod?: number // in minutes
}

export interface DOKUPaymentResult {
  paymentUrl: string
  orderId: string
  token: string
  expiryDate: Date
}

export interface VAPaymentResult {
  vaNumber: string
  bank: string
  expiryDate: Date
}

export interface QRISPaymentResult {
  qrString: string
  qrImageUrl: string
  expiryDate: Date
}

// Generate DOKU Customer ID
function generateCustomerId(userId: string): string {
  return `CUST-${userId.substring(0, 8)}`
}

// Generate DOKU Order ID
export function generateDOKUOrderId(userId: string): string {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `INV-${timestamp}-${randomStr}`
}

// Create payment VA with DOKU
export async function createVAPayment(
  bank: 'BCA' | 'MANDIRI' | 'BNI' | 'BRI' | 'CIMB' | 'PERMATA',
  params: CreatePaymentParams
): Promise<DOKUPaymentResult & VAPaymentResult> {
  console.log('[DOKU] Creating VA payment with config:', {
    hasClientId: !!DOKU_CONFIG.clientId,
    hasSecretKey: !!DOKU_CONFIG.secretKey,
    apiUrl: DOKU_CONFIG.apiUrl,
    clientId: DOKU_CONFIG.clientId?.substring(0, 10) + '...',
  })

  // Validate DOKU credentials
  if (!DOKU_CONFIG.clientId || !DOKU_CONFIG.secretKey) {
    console.error('[DOKU] Missing credentials')
    throw new Error('DOKU credentials are not configured. Please set DOKU_CLIENT_ID and DOKU_SECRET_KEY in .env file.')
  }

  console.log('[DOKU] Credentials valid, creating payment...')
  const customerId = generateCustomerId(params.customerEmail)
  const timestamp = Date.now().toString()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://notabener.com'

  // DOKU VA API expects this structure
  const requestBody = JSON.stringify({
    order: {
      invoice_number: params.orderId,
      amount: params.amount,
    },
    virtual_account_info: {
      billing_type: 'FIX_BILL',
      expired_time: params.expiryPeriod || 1440, // 24 hours default in minutes
      reusable_status: false,
      info1: params.description.substring(0, 30), // Max 30 chars for VA display
    },
    customer: {
      name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone || '',
    },
    additional_info: {
      // Bank code for VA (BCA, MANDIRI, BNI, BRI, PERMATA, CIMB)
      bank: bank,
    },
  })

  // Correct DOKU VA endpoint
  const url = `${DOKU_CONFIG.apiUrl}/order/v1/payment/va`
  const signature = generateSignature('POST', '/order/v1/payment/va', timestamp, requestBody)

  const headers = {
    'Content-Type': 'application/json',
    'Client-Id': DOKU_CONFIG.clientId,
    'Request-Id': crypto.randomUUID(),
    'Request-Timestamp': timestamp,
    'Signature': signature,
  }

  console.log('[DOKU] Request URL:', url)
  console.log('[DOKU] Request headers:', JSON.stringify({
    'Content-Type': headers['Content-Type'],
    'Client-Id': headers['Client-Id'],
    'Request-Timestamp': headers['Request-Timestamp'],
    'Signature': signature.substring(0, 20) + '...',
  }, null, 2))
  console.log('[DOKU] Request body:', requestBody)

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: requestBody,
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[DOKU] VA Payment error response:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    })
    let errorMessage = 'DOKU VA Payment failed'
    try {
      const error = JSON.parse(errorText)
      console.error('[DOKU] Parsed error object:', JSON.stringify(error, null, 2))
      errorMessage = error.message || error.error?.message || error.error || JSON.stringify(error)
    } catch {
      errorMessage = errorText || errorMessage
    }
    throw new Error(`DOKU Error: ${errorMessage}`)
  }

  const data = await response.json()
  console.log('[DOKU] VA Payment response:', JSON.stringify(data, null, 2))

  // Get VA number from response (DOKU VA response structure)
  const vaNumber = data.virtual_account_info?.virtual_account_number
    || data.virtual_account_number
    || data.va_number
    || ''
  const paymentUrl = data.virtual_account_info?.payment_url || data.payment_url || ''
  const token = data.virtual_account_info?.token || data.token || ''
  const expiryDate = new Date(
    data.virtual_account_info?.expired_time
      ? Date.now() + (data.virtual_account_info.expired_time * 60 * 1000)
      : Date.now() + 24 * 60 * 60 * 1000
  )

  return {
    paymentUrl,
    orderId: params.orderId,
    token,
    expiryDate,
    vaNumber,
    bank,
  }
}

// Create QRIS payment with DOKU
export async function createQRISPayment(
  params: CreatePaymentParams
): Promise<DOKUPaymentResult & QRISPaymentResult> {
  const customerId = generateCustomerId(params.customerEmail)
  const timestamp = Date.now().toString()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://notabener.com'

  // DOKU QRIS API expects this structure
  const requestBody = JSON.stringify({
    order: {
      invoice_number: params.orderId,
      amount: params.amount,
    },
    qris_info: {
      expired_time: params.expiryPeriod || 15, // 15 minutes for QRIS
      reusable_status: false,
      info1: params.description.substring(0, 30), // Max 30 chars
    },
    customer: {
      name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone || '',
    },
    additional_info: {
      callback_url: `${appUrl}/api/webhooks/doku`,
    },
  })

  // Correct DOKU QRIS endpoint
  const url = `${DOKU_CONFIG.apiUrl}/order/v1/payment/qris`
  const signature = generateSignature('POST', '/order/v1/payment/qris', timestamp, requestBody)

  const headers = {
    'Content-Type': 'application/json',
    'Client-Id': DOKU_CONFIG.clientId,
    'Request-Id': crypto.randomUUID(),
    'Request-Timestamp': timestamp,
    'Signature': signature,
  }

  console.log('[DOKU QRIS] Request URL:', url)
  console.log('[DOKU QRIS] Request headers:', JSON.stringify({
    'Content-Type': headers['Content-Type'],
    'Client-Id': headers['Client-Id'],
    'Request-Timestamp': headers['Request-Timestamp'],
    'Signature': signature.substring(0, 20) + '...',
  }, null, 2))
  console.log('[DOKU QRIS] Request body:', requestBody)

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: requestBody,
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[DOKU] QRIS Payment error response:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    })
    let errorMessage = 'DOKU QRIS Payment failed'
    try {
      const error = JSON.parse(errorText)
      console.error('[DOKU] Parsed error object:', JSON.stringify(error, null, 2))
      errorMessage = error.message || error.error?.message || error.error || JSON.stringify(error)
    } catch {
      errorMessage = errorText || errorMessage
    }
    throw new Error(`DOKU Error: ${errorMessage}`)
  }

  const data = await response.json()
  console.log('[DOKU QRIS] Response:', JSON.stringify(data, null, 2))

  // Get QRIS data from response
  const paymentUrl = data.qris_info?.payment_url || data.payment_url || ''
  const token = data.qris_info?.token || data.token || ''
  const qrString = data.qris_info?.qr_string || data.qr_string || ''
  const qrImageUrl = data.qris_info?.qr_image_url || data.qr_image_url || ''
  const expiryDate = new Date(
    data.qris_info?.expired_time
      ? Date.now() + (data.qris_info.expired_time * 60 * 1000)
      : Date.now() + 15 * 60 * 1000
  )

  return {
    paymentUrl,
    orderId: params.orderId,
    token,
    expiryDate,
    qrString,
    qrImageUrl,
  }
}

// Create recurring payment (subscription)
export async function createRecurringPayment(params: {
  customerId: string
  amount: number
  interval: 'MONTH' | 'YEAR'
  intervalCount: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  description: string
}) {
  const timestamp = Date.now().toString()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://notabener.com'
  const requestBody = JSON.stringify({
    plan_id: generateDOKUOrderId(params.customerId),
    amount: params.amount,
    currency: 'IDR',
    interval: params.interval,
    interval_count: params.intervalCount,
    customer: {
      id: params.customerId,
      name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone || '',
    },
    metadata: {
      description: params.description,
    },
    additional_info: {
      override_notification_url: `${appUrl}/api/webhooks/doku`,
    },
  })

  const url = `${DOKU_CONFIG.apiUrl}/v1/recurring-payments`
  const signature = generateSignature('POST', '/v1/recurring-payments', timestamp, requestBody)

  const headers = {
    'Content-Type': 'application/json',
    'Client-Id': DOKU_CONFIG.clientId,
    'Request-Id': crypto.randomUUID(),
    'Request-Timestamp': timestamp,
    'Signature': signature,
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: requestBody,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'DOKU Recurring Payment failed')
  }

  return await response.json()
}

// Get payment status
export async function getPaymentStatus(orderId: string) {
  const timestamp = Date.now().toString()
  // DOKU VA status check endpoint
  const url = `${DOKU_CONFIG.apiUrl}/order/v1/payment/va/status?invoice_number=${orderId}`
  const signature = generateSignature('GET', `/order/v1/payment/va/status?invoice_number=${orderId}`, timestamp, '')

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Client-Id': DOKU_CONFIG.clientId,
      'Request-Id': crypto.randomUUID(),
      'Request-Timestamp': timestamp,
      'Signature': signature,
    },
  })

  if (!response.ok) {
    throw new Error('DOKU Payment status check failed')
  }

  return await response.json()
}

// Verify DOKU webhook signature
export function verifyDOKUSignature(
  requestBody: string,
  signature: string,
  timestamp: string,
  clientId: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', DOKU_CONFIG.secretKey)
    .update(`${clientId}:${timestamp}:${requestBody}`)
    .digest('hex')

  return expectedSignature === signature
}

// Bank names for VA
export const DOKU_VA_BANKS = [
  { code: 'BCA', name: 'BCA', logo: '/images/banks/bca.png' },
  { code: 'MANDIRI', name: 'Mandiri', logo: '/images/banks/mandiri.png' },
  { code: 'BNI', name: 'BNI', logo: '/images/banks/bni.png' },
  { code: 'BRI', name: 'BRI', logo: '/images/banks/bri.png' },
  { code: 'CIMB', name: 'CIMB Niaga', logo: '/images/banks/cimb.png' },
  { code: 'PERMATA', name: 'Permata', logo: '/images/banks/permata.png' },
] as const

export type DOKUVABankCode = typeof DOKU_VA_BANKS[number]['code']
