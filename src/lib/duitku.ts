/**
 * Duitku Payment Gateway Integration
 * Using official Duitku v2 API with MD5 signature
 *
 * Documentation: https://docs.duitku.com/api/id/#parameter-request-transaksi
 *
 * Required Environment Variables:
 * - DUITKU_MERCHANT_CODE: Your Duitku Merchant Code
 * - DUITKU_API_KEY: Your Duitku API Key
 * - DUITKU_MODE: 'SANDBOX' or 'PRODUCTION'
 */

import { createHash } from 'crypto'

// Duitku Configuration
const DUITKU_CONFIG = {
  merchantCode: process.env.DUITKU_MERCHANT_CODE || '',
  apiKey: process.env.DUITKU_API_KEY || '',
  isProduction: process.env.DUITKU_MODE === 'PRODUCTION',
}

// Official Duitku v2 API Endpoints
const DUITKU_ENDPOINTS = {
  sandbox: {
    inquiry: 'https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry',
    transactionStatus: 'https://sandbox.duitku.com/webapi/api/merchant/transactionStatus',
    paymentMethod: 'https://sandbox.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod',
  },
  production: {
    inquiry: 'https://passport.duitku.com/webapi/api/merchant/v2/inquiry',
    transactionStatus: 'https://passport.duitku.com/webapi/api/merchant/transactionStatus',
    paymentMethod: 'https://passport.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod',
  },
}

function getEndpoints() {
  return DUITKU_CONFIG.isProduction
    ? DUITKU_ENDPOINTS.production
    : DUITKU_ENDPOINTS.sandbox
}

// Generate MD5 signature for transaction request
// Format: MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)
function generateTransactionSignature(
  merchantCode: string,
  merchantOrderId: string,
  paymentAmount: number,
  apiKey: string
): string {
  const data = `${merchantCode}${merchantOrderId}${paymentAmount}${apiKey}`
  return createHash('md5').update(data).digest('hex')
}

// Generate MD5 signature for transaction status check
// Format: MD5(merchantCode + merchantOrderId + apiKey)
function generateStatusSignature(
  merchantCode: string,
  merchantOrderId: string,
  apiKey: string
): string {
  const data = `${merchantCode}${merchantOrderId}${apiKey}`
  return createHash('md5').update(data).digest('hex')
}

// Generate SHA256 signature for get payment method
// Format: SHA256(merchantCode + amount + datetime + apiKey)
function generatePaymentMethodSignature(
  merchantCode: string,
  amount: number,
  datetime: string,
  apiKey: string
): string {
  const data = `${merchantCode}${amount}${datetime}${apiKey}`
  return createHash('sha256').update(data).digest('hex')
}

// Generate datetime format for payment method API (YYYY-MM-DD HH:mm:ss)
function getDatetime(): string {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
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
  returnUrl?: string // URL to redirect after payment
  callbackUrl?: string // Webhook callback URL
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

// Duitku payment method codes (official from documentation)
export const DUITKU_VA_BANKS = [
  { code: 'BC', name: 'BCA', logo: '/images/banks/bca.png' },
  { code: 'M2', name: 'Mandiri', logo: '/images/banks/mandiri.png' },
  { code: 'I1', name: 'BNI', logo: '/images/banks/bni.png' },
  { code: 'BR', name: 'BRI', logo: '/images/banks/bri.png' },
  { code: 'B1', name: 'CIMB Niaga', logo: '/images/banks/cimb.png' },
  { code: 'BT', name: 'Bank Permata', logo: '/images/banks/permata.png' },
  { code: 'DM', name: 'Bank Danamon', logo: '/images/banks/danamon.png' },
]

export const DUITKU_QRIS = { code: 'QP', name: 'QRIS', logo: '/images/qris.png' }

export const DUITKU_EWALLETS = [
  { code: 'OV', name: 'OVO', logo: '/images/ewallets/ovo.png' },
  { code: 'DA', name: 'DANA', logo: '/images/ewallets/dana.png' },
  { code: 'SP', name: 'ShopeePay', logo: '/images/ewallets/shopeepay.png' },
  { code: 'SA', name: 'ShopeePay Apps', logo: '/images/ewallets/shopeepay.png' },
]

export type DuitkuVABankCode = typeof DUITKU_VA_BANKS[number]['code']

/**
 * Map UI bank codes to official Duitku API bank codes
 * UI uses: 'BCA', 'MANDIRI', 'BNI', 'BRI', 'CIMB', 'PERMATA', etc.
 * Official Duitku codes: 'BC', 'M2', 'I1', 'BR', 'B1', 'BT', 'DM'
 */
export function mapBankCodeToDuitku(uiBankCode: string): string {
  const bankCodeMap: Record<string, string> = {
    'BCA': 'BC',
    'MANDIRI': 'M2',
    'BNI': 'I1',
    'BRI': 'BR',
    'CIMB': 'B1',
    'CIMB NIAGA': 'B1',
    'PERMATA': 'BT',
    'DANAMON': 'DM',
    // Also accept Duitku codes directly (pass-through)
    'BC': 'BC',
    'M2': 'M2',
    'I1': 'I1',
    'BR': 'BR',
    'B1': 'B1',
    'BT': 'BT',
    'DM': 'DM',
  }

  const normalizedCode = uiBankCode.toUpperCase().trim()
  const duitkuCode = bankCodeMap[normalizedCode]

  if (!duitkuCode) {
    console.warn(`[Duitku] Unknown bank code: ${uiBankCode}, using as-is`)
    return uiBankCode
  }

  return duitkuCode
}

/**
 * Create payment via official Duitku v2 API
 * POST to https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry
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

  // Generate MD5 signature: MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)
  const signature = generateTransactionSignature(
    DUITKU_CONFIG.merchantCode,
    params.orderId,
    paymentAmount,
    DUITKU_CONFIG.apiKey
  )

  // Build returnUrl with orderId for verification after redirect
  const returnUrl = params.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`
  const callbackUrl = params.callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/duitku`

  // Build request body per official v2 API documentation
  const requestBody = {
    merchantCode: DUITKU_CONFIG.merchantCode,
    paymentAmount: paymentAmount,
    merchantOrderId: params.orderId,
    productDetails: params.description,
    email: params.customerEmail,
    customerVaName: params.customerName,
    expiryPeriod: expiryMinutes,
    returnUrl: returnUrl,
    callbackUrl: callbackUrl,
    signature: signature,
    ...(params.customerPhone && { phoneNumber: params.customerPhone }),
    ...(params.paymentMethod && { paymentMethod: params.paymentMethod }),
  }

  console.log('[Duitku] Request:', {
    url: getEndpoints().inquiry,
    body: { ...requestBody, signature: '***' },
  })

  // Call Duitku v2 API
  const response = await fetch(getEndpoints().inquiry, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
 * Get payment status from Duitku
 * POST to https://sandbox.duitku.com/webapi/api/merchant/transactionStatus
 * Signature: MD5(merchantCode + merchantOrderId + apiKey)
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

  // Generate MD5 signature for status check: MD5(merchantCode + merchantOrderId + apiKey)
  const signature = generateStatusSignature(
    DUITKU_CONFIG.merchantCode,
    orderId,
    DUITKU_CONFIG.apiKey
  )

  const requestBody = {
    merchantCode: DUITKU_CONFIG.merchantCode,
    merchantOrderId: orderId,
    signature: signature,
  }

  const response = await fetch(getEndpoints().transactionStatus, {
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
 * Callback signature: MD5(merchantCode + amount + merchantOrderId + apiKey)
 */
export function verifyDuitkuCallback(
  orderId: string,
  amount: number,
  signature: string
): boolean {
  const formattedAmount = Math.round(amount)
  const signatureString = `${DUITKU_CONFIG.merchantCode}${formattedAmount}${orderId}${DUITKU_CONFIG.apiKey}`
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
 * POST to https://sandbox.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod
 * Signature: SHA256(merchantCode + amount + datetime + apiKey)
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

  const datetime = getDatetime()
  const paymentAmount = Math.round(amount)

  // SHA256 signature for get payment method
  const signature = generatePaymentMethodSignature(
    DUITKU_CONFIG.merchantCode,
    paymentAmount,
    datetime,
    DUITKU_CONFIG.apiKey
  )

  const requestBody = {
    merchantCode: DUITKU_CONFIG.merchantCode,
    amount: paymentAmount,
    datetime: datetime,
    signature: signature,
  }

  const response = await fetch(getEndpoints().paymentMethod, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
