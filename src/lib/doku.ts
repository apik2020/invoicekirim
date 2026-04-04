// @ts-ignore - SDK doesn't have proper types
import Doku from 'doku-nodejs-library'
import { createHash, createHmac, randomUUID } from 'crypto'

/**
 * DOKU Payment Gateway Integration using Official SDK
 *
 * Required Environment Variables:
 * - DOKU_ENVIRONMENT: 'SANDBOX' or 'PRODUCTION'
 * - DOKU_CLIENT_ID: Your DOKU Client ID
 * - DOKU_SECRET_KEY: Your DOKU Secret Key
 * - DOKU_PRIVATE_KEY: Your RSA Private Key (PEM format)
 * - DOKU_PUBLIC_KEY: Your RSA Public Key (PEM format)
 * - DOKU_PUBLIC_KEY_DOKU: DOKU's Public Key (PEM format)
 * - DOKU_PARTNER_SERVICE_ID: Partner Service ID from DOKU Dashboard
 */

// DOKU Environment Configuration
const DOKU_CONFIG = {
  isProduction: process.env.DOKU_ENVIRONMENT === 'PRODUCTION',
  clientId: process.env.DOKU_CLIENT_ID || '',
  secretKey: process.env.DOKU_SECRET_KEY || '',
  privateKey: process.env.DOKU_PRIVATE_KEY || '',
  publicKey: process.env.DOKU_PUBLIC_KEY || '',
  dokuPublicKey: process.env.DOKU_PUBLIC_KEY_DOKU || '',
  partnerServiceId: process.env.DOKU_PARTNER_SERVICE_ID || '999999',
}

// Log DOKU config on module load (for debugging)
console.log('[DOKU SDK] Module loaded with config:', {
  hasClientId: !!DOKU_CONFIG.clientId,
  hasSecretKey: !!DOKU_CONFIG.secretKey,
  hasPrivateKey: !!DOKU_CONFIG.privateKey,
  hasPublicKey: !!DOKU_CONFIG.publicKey,
  hasDokuPublicKey: !!DOKU_CONFIG.dokuPublicKey,
  partnerServiceId: DOKU_CONFIG.partnerServiceId,
  environment: DOKU_CONFIG.isProduction ? 'PRODUCTION' : 'SANDBOX',
})

// Bank channel mapping for SNAP API
export const BANK_CHANNEL_MAP: Record<string, string> = {
  'BCA': 'VIRTUAL_ACCOUNT_BANK_BCA',
  'MANDIRI': 'VIRTUAL_ACCOUNT_BANK_MANDIRI',
  'BNI': 'VIRTUAL_ACCOUNT_BANK_BNI',
  'BRI': 'VIRTUAL_ACCOUNT_BANK_BRI',
  'CIMB': 'VIRTUAL_ACCOUNT_BANK_CIMB',
  'PERMATA': 'VIRTUAL_ACCOUNT_BANK_PERMATA',
}

// Initialize DOKU Snap SDK
let dokuSnap: InstanceType<typeof Doku.Snap> | null = null

function getDokuSnap(): InstanceType<typeof Doku.Snap> {
  if (dokuSnap) return dokuSnap

  // Validate required credentials
  if (!DOKU_CONFIG.clientId) {
    throw new Error('DOKU_CLIENT_ID is not configured')
  }
  if (!DOKU_CONFIG.secretKey) {
    throw new Error('DOKU_SECRET_KEY is not configured')
  }
  if (!DOKU_CONFIG.privateKey) {
    throw new Error('DOKU_PRIVATE_KEY is not configured. Run: npm run doku:generate-keys')
  }
  if (!DOKU_CONFIG.publicKey) {
    throw new Error('DOKU_PUBLIC_KEY is not configured. Run: npm run doku:generate-keys')
  }
  if (!DOKU_CONFIG.dokuPublicKey) {
    console.warn('[DOKU SDK] DOKU_PUBLIC_KEY_DOKU not configured, webhook signature verification may not work')
  }

  dokuSnap = new Doku.Snap({
    isProduction: DOKU_CONFIG.isProduction,
    privateKey: DOKU_CONFIG.privateKey,
    clientID: DOKU_CONFIG.clientId,
    publicKey: DOKU_CONFIG.publicKey,
    dokuPublicKey: DOKU_CONFIG.dokuPublicKey,
    secretKey: DOKU_CONFIG.secretKey,
  })

  console.log('[DOKU SDK] Initialized successfully')
  return dokuSnap
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

// Generate DOKU Customer ID - must be digits only (max 20 chars)
function generateCustomerId(email: string): string {
  // Generate numeric-only customer ID from timestamp + hash
  const timestamp = Date.now().toString().slice(-10)
  const hashNum = parseInt(createHash('sha256').update(email).digest('hex').substring(0, 6), 16)
  return `${timestamp}${hashNum}`.slice(0, 20)
}

// Generate DOKU Order ID - takes userId for reference but uses timestamp + random
export function generateDOKUOrderId(userId?: string): string {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `INV-${timestamp}-${randomStr}`
}

// Format expiry date to ISO-8601 with timezone offset (required by DOKU)
// Format: 2024-01-01T12:00:00+07:00
function formatExpiryDate(minutes: number): string {
  const expiryDate = new Date(Date.now() + minutes * 60 * 1000)
  // Format with timezone offset for Indonesia (WIB = +07:00)
  const offset = '+07:00'
  const iso = expiryDate.toISOString()
  // Replace Z with +07:00
  return iso.replace('Z', '').replace(/\.\d{3}$/, '') + offset
}

/**
 * Create Virtual Account Payment using DOKU SDK
 */
export async function createVAPayment(
  bank: 'BCA' | 'MANDIRI' | 'BNI' | 'BRI' | 'CIMB' | 'PERMATA',
  params: CreatePaymentParams
): Promise<DOKUPaymentResult & VAPaymentResult> {
  console.log('[DOKU SDK] Creating VA payment:', {
    bank,
    orderId: params.orderId,
    amount: params.amount,
    customerEmail: params.customerEmail,
  })

  const snap = getDokuSnap()
  const channel = BANK_CHANNEL_MAP[bank]

  if (!channel) {
    throw new Error(`Invalid bank code: ${bank}. Supported banks: BCA, MANDIRI, BNI, BRI, CIMB, PERMATA`)
  }

  const customerNo = generateCustomerId(params.customerEmail)
  const expiryMinutes = params.expiryPeriod || 1440 // 24 hours default
  const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000)

  try {
    // Create VA request using SDK DTOs
    const CreateVARequestDto = require('doku-nodejs-library/_models/createVaRequestDto')
    const TotalAmount = require('doku-nodejs-library/_models/totalAmount')
    const AdditionalInfo = require('doku-nodejs-library/_models/additionalInfo')
    const VirtualAccountConfig = require('doku-nodejs-library/_models/virtualAccountConfig')

    const createVaRequestDto = new CreateVARequestDto()
    // partnerServiceId must be exactly 8 characters - pad with spaces if needed
    const partnerServiceId = DOKU_CONFIG.partnerServiceId.padEnd(8, ' ')
    createVaRequestDto.partnerServiceId = partnerServiceId
    createVaRequestDto.customerNo = customerNo
    createVaRequestDto.virtualAccountNo = `${partnerServiceId}${customerNo}`
    createVaRequestDto.virtualAccountName = params.customerName.substring(0, 255)
    createVaRequestDto.virtualAccountEmail = params.customerEmail
    // Only set phone if provided - don't send empty string
    if (params.customerPhone) {
      createVaRequestDto.virtualAccountPhone = params.customerPhone
    }
    createVaRequestDto.trxId = params.orderId
    // freeText must be an array
    createVaRequestDto.freeText = ['Payment for ' + params.description.substring(0, 20)]

    const totalAmount = new TotalAmount()
    totalAmount.value = params.amount.toFixed(2)
    totalAmount.currency = 'IDR'
    createVaRequestDto.totalAmount = totalAmount

    const virtualAccountConfig = new VirtualAccountConfig()
    virtualAccountConfig.reusableStatus = false

    const additionalInfo = new AdditionalInfo(channel, virtualAccountConfig)
    createVaRequestDto.additionalInfo = additionalInfo
    createVaRequestDto.virtualAccountTrxType = 'C' // Closed amount
    createVaRequestDto.expiredDate = formatExpiryDate(expiryMinutes)

    console.log('[DOKU SDK] VA Request:', {
      partnerServiceId: createVaRequestDto.partnerServiceId,
      customerNo: createVaRequestDto.customerNo,
      virtualAccountNo: createVaRequestDto.virtualAccountNo,
      channel: channel,
      amount: totalAmount.value,
    })

    const response = await snap.createVa(createVaRequestDto)
    console.log('[DOKU SDK] VA Response:', JSON.stringify(response, null, 2))

    // Extract VA number from response
    const vaNumber = response.virtualAccountData?.virtualAccountNo
      || response.virtualAccountNo
      || ''
    const paymentUrl = response.virtualAccountData?.paymentUrl || response.paymentUrl || ''
    const token = response.virtualAccountData?.token || response.token || ''

    return {
      paymentUrl,
      orderId: params.orderId,
      token,
      expiryDate,
      vaNumber,
      bank,
    }
  } catch (error: unknown) {
    console.error('[DOKU SDK] VA Payment error:', error)
    const err = error as { response?: { data: unknown }; message?: string }
    if (err.response?.data) {
      throw new Error(`DOKU Error: ${JSON.stringify(err.response.data)}`)
    }
    throw new Error(`DOKU Error: ${err.message || 'Unknown error'}`)
  }
}

/**
 * Create QRIS Payment using DOKU API (direct call)
 */
export async function createQRISPayment(
  params: CreatePaymentParams
): Promise<DOKUPaymentResult & QRISPaymentResult> {
  console.log('[DOKU SDK] Creating QRIS payment:', {
    orderId: params.orderId,
    amount: params.amount,
    customerEmail: params.customerEmail,
  })

  const expiryMinutes = params.expiryPeriod || 15 // 15 minutes default for QRIS
  const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000)

  // QRIS request body for DOKU SNAP API
  const requestBody = {
    partnerReferenceNo: params.orderId,
    amount: {
      value: params.amount.toFixed(2),
      currency: 'IDR',
    },
    validityPeriod: expiryDate.toISOString(),
    additionalInfo: {
      channel: 'EMONEY_DANA_SNAP', // Default to DANA QRIS
      remarks: params.description.substring(0, 30),
    },
  }

  // Use direct API call for QRIS
  const apiUrl = DOKU_CONFIG.isProduction
    ? 'https://api.doku.com'
    : 'https://api-sandbox.doku.com'

  const timestamp = new Date().toISOString()
  const requestId = randomUUID()

  // Generate signature for SNAP API
  const minifiedBody = JSON.stringify(requestBody)
  const sha256HashBody = createHash('sha256').update(minifiedBody).digest('hex').toLowerCase()
  const stringToSign = `POST:/qr-qriss/v2/generate-qr\n${timestamp}\n${minifiedBody}`
  const signature = createHmac('sha256', DOKU_CONFIG.secretKey)
    .update(stringToSign)
    .digest('base64')

  console.log('[DOKU SDK] QRIS Request:', {
    url: `${apiUrl}/qr-qriss/v2/generate-qr`,
    requestId,
    timestamp,
  })

  const response = await fetch(`${apiUrl}/qr-qriss/v2/generate-qr`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CLIENT-KEY': DOKU_CONFIG.clientId,
      'X-TIMESTAMP': timestamp,
      'X-SIGNATURE': signature,
      'X-PARTNER-ID': DOKU_CONFIG.clientId,
      'X-EXTERNAL-ID': requestId,
      'CHANNEL-ID': 'EMONEY_DANA_SNAP',
    },
    body: minifiedBody,
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[DOKU SDK] QRIS Payment error:', {
      status: response.status,
      body: errorText,
    })
    throw new Error(`DOKU QRIS Error: ${errorText}`)
  }

  const data = await response.json()
  console.log('[DOKU SDK] QRIS Response:', JSON.stringify(data, null, 2))

  const paymentUrl = data.qrisInfo?.paymentUrl || data.paymentUrl || ''
  const token = data.qrisInfo?.token || data.token || ''
  const qrString = data.qrisInfo?.qrString || data.qrString || ''
  const qrImageUrl = data.qrisInfo?.qrImageUrl || data.qrImageUrl || ''

  return {
    paymentUrl,
    orderId: params.orderId,
    token,
    expiryDate,
    qrString,
    qrImageUrl,
  }
}

/**
 * Get payment status from DOKU
 */
export async function getPaymentStatus(orderId: string) {
  const snap = getDokuSnap()

  const CheckStatusVARequestDto = require('doku-nodejs-library/_models/checkStatusVARequestDTO')

  const partnerServiceId = DOKU_CONFIG.partnerServiceId.padEnd(8, ' ')
  const checkVaRequestDto = new CheckStatusVARequestDto()
  checkVaRequestDto.partnerServiceId = partnerServiceId
  checkVaRequestDto.customerNo = generateCustomerId(orderId)
  checkVaRequestDto.virtualAccountNo = `${partnerServiceId}${checkVaRequestDto.customerNo}`

  const response = await snap.checkStatusVa(checkVaRequestDto)
  return response
}

/**
 * Verify DOKU webhook signature using SDK
 */
export function verifyDOKUSignature(
  requestBody: string,
  signature: string,
  timestamp: string,
  clientId: string
): boolean {
  try {
    const snap = getDokuSnap()
    // Validate B2B token from authorization header
    const authHeader = `Bearer ${signature}`
    return snap.validateTokenB2B(authHeader)
  } catch (error) {
    console.error('[DOKU SDK] Signature verification error:', error)
    return false
  }
}

/**
 * Verify webhook symmetric signature (HMAC-SHA512)
 */
export function verifyDOKUSymmetricSignature(
  requestBody: string,
  signature: string,
  timestamp: string,
  tokenB2B: string
): boolean {
  const sha256HashBody = createHash('sha256').update(requestBody).digest('hex').toLowerCase()
  const stringToSign = `POST:/api/webhooks/doku:${tokenB2B}:${sha256HashBody}:${timestamp}`
  const expectedSignature = createHmac('sha512', DOKU_CONFIG.secretKey).update(stringToSign).digest('base64')
  return signature.toLowerCase() === expectedSignature.toLowerCase()
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

// Legacy export for backwards compatibility
export { BANK_CHANNEL_MAP as DOKU_BANK_CHANNELS }
