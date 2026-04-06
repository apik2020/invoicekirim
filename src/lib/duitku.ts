/**
 * Duitku Payment Gateway Integration
 * Using NEW Duitku API with SHA256 signature
 *
 * Required Environment Variables:
 * - DUITKU_MERCHANT_CODE: Your Duitku Merchant Code
 * - DUITKU_API_KEY: Your Duitku API Key
 * - DUITKU_MODE: 'SANDBOX' or 'PRODUCTION'
 */

import { createHash } from 'crypto'
import * as moment from 'moment-timezone'

// Duitku Configuration
const DUITKU_CONFIG = {
  merchantCode: process.env.DUITKU_MERCHANT_CODE || '',
  apiKey: process.env.DUITKU_API_KEY || '',
  isProduction: process.env.DUITKU_MODE === 'PRODUCTION',
}

// NEW API Endpoints
const DUITKU_ENDPOINTS = {
  sandbox: 'https://api-sandbox.duitku.com/api/merchant',
  production: 'https://api-prod.duitku.com/api/merchant',
}

function getBaseUrl(): string {
  return DUITKU_CONFIG.isProduction
    ? DUITKU_ENDPOINTS.production
    : DUITKU_ENDPOINTS.sandbox
}

// Generate Jakarta timezone timestamp (Unix timestamp in milliseconds)
function getJakartaTimestamp(): number {
  const jakartaTime = moment().tz('Asia/Jakarta')
  return jakartaTime.valueOf()
}

// Generate SHA256 signature for NEW Duitku API
// Format: SHA256(merchantCode + timestamp + apiKey)
function generateSignature(merchantCode: string, timestamp: number, apiKey: string): string {
  const data = `${merchantCode}${timestamp}${apiKey}`
  return createHash('sha256').update(data).digest('hex')
}

// Build request headers with signature
function buildHeaders(timestamp: number): Record<string, string> {
  const signature = generateSignature(DUITKU_CONFIG.merchantCode, timestamp, DUITKU_CONFIG.apiKey)

  return {
    'Content-Type': 'application/json',
    'x-duitku-signature': signature,
    'x-duitku-timestamp': timestamp.toString(),
    'x-duitku-merchantcode': DUITKU_CONFIG.merchantCode,
  }
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
 * Create payment via NEW Duitku API
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

  // Get Jakarta timestamp
  const timestamp = getJakartaTimestamp()

  // Build request body for NEW API
  const requestBody = {
    merchantCode: DUITKU_CONFIG.merchantCode,
    paymentAmount: paymentAmount,
    merchantOrderId: params.orderId,
    productDetails: params.description,
    email: params.customerEmail,
    customerVaName: params.customerName,
    expiryPeriod: expiryMinutes,
    ...(params.customerPhone && { phoneNumber: params.customerPhone }),
    ...(params.paymentMethod && { paymentMethod: params.paymentMethod }),
  }

  // Build headers with signature
  const headers = buildHeaders(timestamp)

  console.log('[Duitku] Request:', {
    url: `${getBaseUrl()}/createInvoice`,
    body: requestBody,
    timestamp: timestamp,
  })

  // Call NEW Duitku API
  const response = await fetch(`${getBaseUrl()}/createInvoice`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  })

  const data = await response.json()

  console.log('[Duitku] Response:', JSON.stringify(data, null, 2))

  if (!response.ok) {
    console.error('[Duitku] API error:', {
      status: response.status,
      body: data,
    })
    throw new Error(`Duitku API error: ${data.Message || data.message || 'Unknown error'}`)
  }

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
 * Get payment status from Duitku (NEW API)
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

  // Get Jakarta timestamp
  const timestamp = getJakartaTimestamp()

  // Build headers with signature
  const headers = buildHeaders(timestamp)

  const requestBody = {
    merchantCode: DUITKU_CONFIG.merchantCode,
    merchantOrderId: orderId,
  }

  const response = await fetch(`${getBaseUrl()}/transactionStatus`, {
    method: 'POST',
    headers,
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
 * Callback uses MD5 signature (old format for callbacks)
 */
export function verifyDuitkuCallback(
  orderId: string,
  amount: number,
  signature: string
): boolean {
  const formattedAmount = Math.round(amount)
  const signatureString = `${DUITKU_CONFIG.merchantCode}${orderId}${formattedAmount}${DUITKU_CONFIG.apiKey}`
  const expectedSignature = createHash('md5').update(signatureString).digest('hex')
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

/**
 * Get available payment methods from Duitku
 */
export async function getDuitkuPaymentMethods(amount: number): Promise<{
  paymentMethod: string
  paymentName: string
  paymentImage: string
  totalFee: number
}[]> {
  console.log('[Duitku] Getting payment methods for amount:', amount)

  if (!DUITKU_CONFIG.merchantCode || !DUITKU_CONFIG.apiKey) {
    throw new Error('Duitku credentials not configured')
  }

  const timestamp = getJakartaTimestamp()
  const headers = buildHeaders(timestamp)

  const requestBody = {
    merchantCode: DUITKU_CONFIG.merchantCode,
    amount: Math.round(amount),
  }

  const response = await fetch(`${getBaseUrl()}/paymentMethod`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Duitku payment methods error: ${errorText}`)
  }

  const data = await response.json()
  console.log('[Duitku] Payment methods response:', JSON.stringify(data, null, 2))

  return data.paymentFee || []
}

// Export all banks for backward compatibility
export const DUITKU_ALL_METHODS = {
  va: DUITKU_VA_BANKS,
  qris: DUITKU_QRIS,
  ewallets: DUITKU_EWALLETS,
}
