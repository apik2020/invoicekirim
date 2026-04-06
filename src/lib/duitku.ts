/**
 * Duitku Payment Gateway Integration
 *
 * Required Environment Variables:
 * - DUITKU_MERCHANT_CODE: Your Duitku Merchant Code
 * - DUITKU_API_KEY: Your Duitku API Key
 * - DUITKU_ENVIRONMENT: 'SANDBOX' or 'PRODUCTION'
 */

import { createHash } from 'crypto'

// Duitku Configuration
const DUITKU_CONFIG = {
  merchantCode: process.env.DUITKU_MERCHANT_CODE || '',
  apiKey: process.env.DUITKU_API_KEY || '',
  isProduction: process.env.DUITKU_ENVIRONMENT === 'PRODUCTION',
}

// API Endpoints
const DUITKU_ENDPOINTS = {
  sandbox: 'https://sandbox.duitku.com/webapi/api/merchant/v2',
  production: 'https://passport.duitku.com/webapi/api/merchant/v2',
}

function getBaseUrl(): string {
  return DUITKU_CONFIG.isProduction
    ? DUITKU_ENDPOINTS.production
    : DUITKU_ENDPOINTS.sandbox
}

// Generate signature for Duitku API (MD5)
// Amount must be formatted as integer string (no decimals)
function generateSignature(orderId: string, amount: number): string {
  // Duitku signature format: MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)
  // paymentAmount must be integer (e.g., "100000" not "100000.00")
  const formattedAmount = Math.round(amount)
  const signatureString = `${DUITKU_CONFIG.merchantCode}${orderId}${formattedAmount}${DUITKU_CONFIG.apiKey}`

  console.log('[Duitku] Signature debug:', {
    merchantCode: DUITKU_CONFIG.merchantCode,
    orderId,
    amount: formattedAmount,
    apiKeyLength: DUITKU_CONFIG.apiKey?.length || 0,
    signatureString: `${DUITKU_CONFIG.merchantCode}${orderId}${formattedAmount}[API_KEY]`,
  })

  return createHash('md5').update(signatureString).digest('hex')
}

// Generate callback signature
function generateCallbackSignature(orderId: string, amount: number): string {
  const formattedAmount = Math.round(amount)
  const signatureString = `${DUITKU_CONFIG.merchantCode}${orderId}${formattedAmount}${DUITKU_CONFIG.apiKey}`
  return createHash('md5').update(signatureString).digest('hex')
}

export interface DuitkuPaymentParams {
  orderId: string
  amount: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  description: string
  expiryPeriod?: number // in minutes
  paymentMethod?: string // VA code, QRIS, etc
}

export interface DuitkuPaymentResult {
  paymentUrl: string
  orderId: string
  reference: string
  expiryDate: Date
  vaNumber?: string
  bank?: string
  qrString?: string
  qrImageUrl?: string
}

// Duitku payment method codes
export const DUITKU_VA_BANKS = [
  { code: 'BC', name: 'BCA', logo: '/images/banks/bca.png' },
  { code: 'M1', name: 'Mandiri', logo: '/images/banks/mandiri.png' },
  { code: 'B1', name: 'BNI', logo: '/images/banks/bni.png' },
  { code: 'BR', name: 'BRI', logo: '/images/banks/bri.png' },
  { code: 'C1', name: 'CIMB Niaga', logo: '/images/banks/cimb.png' },
  { code: 'A1', name: 'Bank Permata', logo: '/images/banks/permata.png' },
  { code: 'B2', name: 'Bank Danamon', logo: '/images/banks/danamon.png' },
  { code: 'D1', name: 'Bank Digibank', logo: '/images/banks/digibank.png' },
] as const

export const DUITKU_QRIS = { code: 'QP', name: 'QRIS', logo: '/images/qris.png' }
export const DUITKU_EWALLETS = [
  { code: 'OV', name: 'OVO', logo: '/images/ewallets/ovo.png' },
  { code: 'DA', name: 'DANA', logo: '/images/ewallets/dana.png' },
  { code: 'SP', name: 'ShopeePay', logo: '/images/ewallets/shopeepay.png' },
  { code: 'GQ', name: 'GoPay', logo: '/images/ewallets/gopay.png' },
]

export type DuitkuVABankCode = typeof DUITKU_VA_BANKS[number]['code']

/**
 * Map UI bank codes to Duitku API bank codes
 * UI uses: 'BCA', 'MANDIRI', 'BNI', 'BRI', 'CIMB', 'PERMATA', etc.
 * Duitku API uses: 'BC', 'M1', 'B1', 'BR', 'C1', 'A1', etc.
 */
export function mapBankCodeToDuitku(uiBankCode: string): string {
  const bankCodeMap: Record<string, string> = {
    'BCA': 'BC',
    'MANDIRI': 'M1',
    'BNI': 'B1',
    'BRI': 'BR',
    'CIMB': 'C1',
    'CIMB NIAGA': 'C1',
    'PERMATA': 'A1',
    'DANAMON': 'B2',
    'DIGIBANK': 'D1',
    // Also accept Duitku codes directly (pass-through)
    'BC': 'BC',
    'M1': 'M1',
    'B1': 'B1',
    'BR': 'BR',
    'C1': 'C1',
    'A1': 'A1',
    'B2': 'B2',
    'D1': 'D1',
  }

  const normalizedCode = uiBankCode.toUpperCase().trim()
  const duitkuCode = bankCodeMap[normalizedCode]

  if (!duitkuCode) {
    console.warn(`[Duitku] Unknown bank code: ${uiBankCode}, using as-is`)
    return uiBankCode // Return original if not found
  }

  return duitkuCode
}

/**
 * Create payment via Duitku API
 */
export async function createDuitkuPayment(
  params: DuitkuPaymentParams
): Promise<DuitkuPaymentResult> {
  console.log('[Duitku] Creating payment:', {
    orderId: params.orderId,
    amount: params.amount,
    customerEmail: params.customerEmail,
    paymentMethod: params.paymentMethod,
  })

  if (!DUITKU_CONFIG.merchantCode || !DUITKU_CONFIG.apiKey) {
    throw new Error('Duitku credentials not configured. Set DUITKU_MERCHANT_CODE and DUITKU_API_KEY')
  }

  const expiryMinutes = params.expiryPeriod || 1440 // 24 hours default
  const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000)

  // Ensure amount is integer (Duitku requires integer amount)
  const paymentAmount = Math.round(params.amount)

  // Build request body
  const requestBody: Record<string, string | number> = {
    merchantCode: DUITKU_CONFIG.merchantCode,
    paymentAmount: paymentAmount,
    merchantOrderId: params.orderId,
    productDetails: params.description,
    email: params.customerEmail,
    customerVaName: params.customerName,
    expiryPeriod: expiryMinutes,
  }

  // Add phone if provided
  if (params.customerPhone) {
    requestBody.phoneNumber = params.customerPhone
  }

  // Add payment method if specified
  if (params.paymentMethod) {
    requestBody.paymentMethod = params.paymentMethod
  }

  // Generate signature (using same paymentAmount integer)
  requestBody.signature = generateSignature(params.orderId, paymentAmount)

  console.log('[Duitku] Request:', {
    ...requestBody,
    signature: '[REDACTED]',
  })

  // Call Duitku API
  const response = await fetch(`${getBaseUrl()}/inquiry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Duitku] API error:', {
      status: response.status,
      body: errorText,
    })
    throw new Error(`Duitku API error: ${errorText}`)
  }

  const data = await response.json()
  console.log('[Duitku] Response:', JSON.stringify(data, null, 2))

  // Check response status
  if (data.statusCode !== '00') {
    throw new Error(`Duitku error: ${data.statusMessage || 'Unknown error'}`)
  }

  // Extract payment details based on payment method
  const result: DuitkuPaymentResult = {
    paymentUrl: data.paymentUrl || '',
    orderId: params.orderId,
    reference: data.reference || '',
    expiryDate,
  }

  // VA specific fields
  if (data.vaNumber) {
    result.vaNumber = data.vaNumber
    result.bank = data.bankCode || params.paymentMethod
  }

  // QRIS specific fields
  if (data.qrString) {
    result.qrString = data.qrString
    result.qrImageUrl = data.qrImageUrl
  }

  return result
}

/**
 * Get payment status from Duitku
 */
export async function getDuitkuPaymentStatus(orderId: string): Promise<{
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED'
  amount: number
  reference: string
  paymentMethod?: string
}> {
  console.log('[Duitku] Checking payment status:', { orderId })

  if (!DUITKU_CONFIG.merchantCode || !DUITKU_CONFIG.apiKey) {
    throw new Error('Duitku credentials not configured')
  }

  const signature = createHash('md5')
    .update(`${DUITKU_CONFIG.merchantCode}${orderId}${DUITKU_CONFIG.apiKey}`)
    .digest('hex')

  const requestBody = {
    merchantCode: DUITKU_CONFIG.merchantCode,
    merchantOrderId: orderId,
    signature,
  }

  const response = await fetch(`${getBaseUrl()}/transactionStatus`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Duitku status check error: ${errorText}`)
  }

  const data = await response.json()
  console.log('[Duitku] Status response:', JSON.stringify(data, null, 2))

  // Map Duitku status to our status
  let status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' = 'PENDING'
  switch (data.statusCode) {
    case '00':
      status = 'COMPLETED'
      break
    case '01':
      status = 'PENDING'
      break
    case '02':
      status = 'FAILED'
      break
    case '03':
      status = 'EXPIRED'
      break
  }

  return {
    status,
    amount: parseFloat(data.amount || '0'),
    reference: data.reference || '',
    paymentMethod: data.paymentMethod,
  }
}

/**
 * Verify Duitku callback signature
 */
export function verifyDuitkuCallback(
  orderId: string,
  amount: number,
  signature: string
): boolean {
  const expectedSignature = generateCallbackSignature(orderId, amount)
  return signature.toLowerCase() === expectedSignature.toLowerCase()
}

/**
 * Generate unique order ID for Duitku
 */
export function generateDuitkuOrderId(userId?: string): string {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `INV-${timestamp}-${randomStr}`
}

// Export all banks for backward compatibility
export const DUITKU_ALL_METHODS = {
  va: DUITKU_VA_BANKS,
  qris: DUITKU_QRIS,
  ewallets: DUITKU_EWALLETS,
}
