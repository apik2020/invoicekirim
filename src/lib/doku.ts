import crypto from 'crypto'

/**
 * DOKU Payment Gateway Integration using Official SDK (SNAP API)
 *
 * Required Environment Variables:
 * - DOKU_ENVIRONMENT: 'SANDBOX' or 'PRODUCTION'
 * - DOKU_CLIENT_ID: Your DOKU Client ID
 * - DOKU_SECRET_KEY: Your DOKU Secret Key
 * - DOKU_PRIVATE_KEY: Your RSA Private Key (PEM format)
 * - DOKU_PUBLIC_KEY: Your RSA Public Key (PEM format)
 * - DOKU_PUBLIC_KEY_DOKU: DOKU's Public Key (PEM format) - from DOKU Dashboard
 */

// DOKU Environment Configuration
const DOKU_CONFIG = {
  isProduction: process.env.DOKU_ENVIRONMENT === 'PRODUCTION',
  clientId: process.env.DOKU_CLIENT_ID || '',
  secretKey: process.env.DOKU_SECRET_KEY || '',
  privateKey: process.env.DOKU_PRIVATE_KEY || '',
  publicKey: process.env.DOKU_PUBLIC_KEY || '',
  dokuPublicKey: process.env.DOKU_PUBLIC_KEY_DOKU || '',
  apiUrl: process.env.DOKU_ENVIRONMENT === 'PRODUCTION'
    ? 'https://api.doku.com'
    : 'https://api-sandbox.doku.com',
}

// Log DOKU config on module load (for debugging)
console.log('[DOKU] Module loaded with config:', {
  hasClientId: !!DOKU_CONFIG.clientId,
  hasSecretKey: !!DOKU_CONFIG.secretKey,
  hasPrivateKey: !!DOKU_CONFIG.privateKey,
  hasPublicKey: !!DOKU_CONFIG.publicKey,
  hasDokuPublicKey: !!DOKU_CONFIG.dokuPublicKey,
  environment: DOKU_CONFIG.isProduction ? 'PRODUCTION' : 'SANDBOX',
  apiUrl: DOKU_CONFIG.apiUrl,
})

// SNAP API Endpoints
const SNAP_ENDPOINTS = {
  ACCESS_TOKEN: '/authorization/v1/access-token/b2b',
  CREATE_VA: '/virtual-accounts/bi-snap-va/v1.1/transfer-va/create-va',
  UPDATE_VA: '/virtual-accounts/bi-snap-va/v1.1/transfer-va/update-va',
  DELETE_VA: '/virtual-accounts/bi-snap-va/v1.1/transfer-va/delete-va',
  CHECK_STATUS_VA: '/orders/v1.0/transfer-va/status',
  CREATE_QRIS: '/qr-qriss/v2/generate-qr', // Legacy endpoint - may need updating
}

// Partner Service ID (from DOKU Dashboard)
const PARTNER_SERVICE_ID = process.env.DOKU_PARTNER_SERVICE_ID || '999999'

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

// Bank channel mapping for SNAP API
const BANK_CHANNEL_MAP: Record<string, string> = {
  'BCA': 'VIRTUAL_ACCOUNT_BANK_BCA',
  'MANDIRI': 'VIRTUAL_ACCOUNT_BANK_MANDIRI',
  'BNI': 'VIRTUAL_ACCOUNT_BANK_BNI',
  'BRI': 'VIRTUAL_ACCOUNT_BANK_BRI',
  'CIMB': 'VIRTUAL_ACCOUNT_BANK_CIMB',
  'PERMATA': 'VIRTUAL_ACCOUNT_BANK_PERMATA',
}

// Generate DOKU Customer ID
function generateCustomerId(email: string): string {
  const hash = crypto.createHash('sha256').update(email).digest('hex')
  return hash.substring(0, 8).toUpperCase()
}

// Generate DOKU Order ID
export function generateDOKUOrderId(userId: string): string {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `INV-${timestamp}-${randomStr}`
}

// Generate timestamp in ISO 8601 format with timezone
function generateTimestamp(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const offsetHours = Math.abs(Math.floor(offset / 60))
  const offsetMinutes = Math.abs(offset % 60)
  const sign = offset >= 0 ? '-' : '+'
  const pad = (num: number) => String(num).padStart(2, '0')

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}${sign}${pad(offsetHours)}:${pad(offsetMinutes)}`
}

// Generate RSA signature for B2B token request
function generateRSASignature(clientId: string, timestamp: string): string {
  if (!DOKU_CONFIG.privateKey) {
    throw new Error('DOKU_PRIVATE_KEY is not configured')
  }

  const stringToSign = `${clientId}|${timestamp}`
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(stringToSign)
  sign.end()
  return sign.sign(DOKU_CONFIG.privateKey, 'base64')
}

// Generate symmetric signature for API requests (HMAC-SHA512)
function generateSymmetricSignature(
  httpMethod: string,
  endPointUrl: string,
  tokenB2B: string,
  requestBody: object,
  timestamp: string
): string {
  const minifiedBody = JSON.stringify(requestBody)
  const sha256Hash = crypto.createHash('sha256').update(minifiedBody).digest('hex').toLowerCase()
  const stringToSign = `${httpMethod}:${endPointUrl}:${tokenB2B}:${sha256Hash}:${timestamp}`

  const hmac = crypto.createHmac('sha512', DOKU_CONFIG.secretKey)
  hmac.update(stringToSign)
  return hmac.digest('base64')
}

// Get B2B Access Token
async function getB2BToken(): Promise<{ accessToken: string; expiresIn: number }> {
  const timestamp = generateTimestamp()
  const signature = generateRSASignature(DOKU_CONFIG.clientId, timestamp)

  const url = `${DOKU_CONFIG.apiUrl}${SNAP_ENDPOINTS.ACCESS_TOKEN}`

  console.log('[DOKU] Requesting B2B token from:', url)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-CLIENT-KEY': DOKU_CONFIG.clientId,
      'X-TIMESTAMP': timestamp,
      'X-SIGNATURE': signature,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grantType: 'client_credentials',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[DOKU] B2B Token error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    })
    throw new Error(`Failed to get B2B token: ${errorText}`)
  }

  const data = await response.json()
  console.log('[DOKU] B2B Token received successfully')

  return {
    accessToken: data.accessToken,
    expiresIn: data.expiresIn || 900,
  }
}

// Create payment VA with DOKU using SNAP API
export async function createVAPayment(
  bank: 'BCA' | 'MANDIRI' | 'BNI' | 'BRI' | 'CIMB' | 'PERMATA',
  params: CreatePaymentParams
): Promise<DOKUPaymentResult & VAPaymentResult> {
  console.log('[DOKU] Creating VA payment with config:', {
    hasClientId: !!DOKU_CONFIG.clientId,
    hasSecretKey: !!DOKU_CONFIG.secretKey,
    hasPrivateKey: !!DOKU_CONFIG.privateKey,
    apiUrl: DOKU_CONFIG.apiUrl,
    bank,
  })

  // Validate DOKU credentials
  if (!DOKU_CONFIG.clientId || !DOKU_CONFIG.secretKey) {
    console.error('[DOKU] Missing credentials')
    throw new Error('DOKU credentials are not configured. Please set DOKU_CLIENT_ID and DOKU_SECRET_KEY in .env file.')
  }

  if (!DOKU_CONFIG.privateKey) {
    console.error('[DOKU] Missing private key')
    throw new Error('DOKU_PRIVATE_KEY is not configured. Please generate RSA keys and configure them. Run: npm run doku:generate-keys')
  }

  console.log('[DOKU] Credentials valid, creating payment...')

  // Get B2B token
  let tokenB2B: string
  try {
    const tokenData = await getB2BToken()
    tokenB2B = tokenData.accessToken
  } catch (tokenError) {
    console.error('[DOKU] Failed to get B2B token:', tokenError)
    throw new Error(`Failed to authenticate with DOKU: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`)
  }

  const timestamp = generateTimestamp()
  const customerNo = generateCustomerId(params.customerEmail)
  const channel = BANK_CHANNEL_MAP[bank]

  if (!channel) {
    throw new Error(`Invalid bank code: ${bank}. Supported banks: BCA, MANDIRI, BNI, BRI, CIMB, PERMATA`)
  }

  // Calculate expiry date
  const expiryMinutes = params.expiryPeriod || 1440 // 24 hours default
  const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000)
  const expiryDateStr = expiryDate.toISOString()

  // SNAP API request body for VA creation
  const requestBody = {
    partnerServiceId: PARTNER_SERVICE_ID,
    customerNo: customerNo,
    virtualAccountNo: `${PARTNER_SERVICE_ID}${customerNo}`,
    virtualAccountName: params.customerName.substring(0, 255),
    virtualAccountEmail: params.customerEmail,
    virtualAccountPhone: params.customerPhone || '',
    trxId: params.orderId,
    totalAmount: {
      value: params.amount.toFixed(2),
      currency: 'IDR',
    },
    additionalInfo: {
      channel: channel,
      virtualAccountConfig: {
        reusableStatus: false,
      },
    },
    virtualAccountTrxType: 'C', // Closed amount
    expiredDate: expiryDateStr,
  }

  const url = `${DOKU_CONFIG.apiUrl}${SNAP_ENDPOINTS.CREATE_VA}`
  const signature = generateSymmetricSignature('POST', SNAP_ENDPOINTS.CREATE_VA, tokenB2B, requestBody, timestamp)

  const headers = {
    'Content-Type': 'application/json',
    'X-CLIENT-KEY': DOKU_CONFIG.clientId,
    'X-TIMESTAMP': timestamp,
    'X-SIGNATURE': signature,
    'X-PARTNER-ID': DOKU_CONFIG.clientId,
    'X-EXTERNAL-ID': crypto.randomUUID(),
    'CHANNEL-ID': channel,
    'Authorization': `Bearer ${tokenB2B}`,
  }

  console.log('[DOKU] Request URL:', url)
  console.log('[DOKU] Request body:', JSON.stringify(requestBody, null, 2))

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
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
      errorMessage = error.responseMessage || error.message || error.error?.message || JSON.stringify(error)
    } catch {
      errorMessage = errorText || errorMessage
    }
    throw new Error(`DOKU Error: ${errorMessage}`)
  }

  const data = await response.json()
  console.log('[DOKU] VA Payment response:', JSON.stringify(data, null, 2))

  // Extract VA number from response
  const vaNumber = data.virtualAccountData?.virtualAccountNo
    || data.virtualAccountNo
    || ''
  const paymentUrl = data.virtualAccountData?.paymentUrl || data.paymentUrl || ''
  const token = data.virtualAccountData?.token || data.token || ''

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
  console.log('[DOKU] Creating QRIS payment with config:', {
    hasClientId: !!DOKU_CONFIG.clientId,
    hasSecretKey: !!DOKU_CONFIG.secretKey,
    hasPrivateKey: !!DOKU_CONFIG.privateKey,
    apiUrl: DOKU_CONFIG.apiUrl,
  })

  // Validate DOKU credentials
  if (!DOKU_CONFIG.clientId || !DOKU_CONFIG.secretKey) {
    throw new Error('DOKU credentials are not configured. Please set DOKU_CLIENT_ID and DOKU_SECRET_KEY in .env file.')
  }

  if (!DOKU_CONFIG.privateKey) {
    throw new Error('DOKU_PRIVATE_KEY is not configured. Please generate RSA keys and configure them. Run: npm run doku:generate-keys')
  }

  // Get B2B token
  let tokenB2B: string
  try {
    const tokenData = await getB2BToken()
    tokenB2B = tokenData.accessToken
  } catch (tokenError) {
    console.error('[DOKU] Failed to get B2B token:', tokenError)
    throw new Error(`Failed to authenticate with DOKU: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`)
  }

  const timestamp = generateTimestamp()

  // Calculate expiry date (15 minutes for QRIS)
  const expiryMinutes = params.expiryPeriod || 15
  const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000)

  // QRIS request body - using legacy endpoint format
  const requestBody = {
    order: {
      invoice_number: params.orderId,
      amount: params.amount,
    },
    qris_info: {
      expired_time: expiryMinutes,
      reusable_status: false,
      info1: params.description.substring(0, 30),
    },
    customer: {
      name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone || '',
    },
    additional_info: {
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://notabener.com'}/api/webhooks/doku`,
    },
  }

  const url = `${DOKU_CONFIG.apiUrl}${SNAP_ENDPOINTS.CREATE_QRIS}`
  const signature = generateSymmetricSignature('POST', SNAP_ENDPOINTS.CREATE_QRIS, tokenB2B, requestBody, timestamp)

  const headers = {
    'Content-Type': 'application/json',
    'X-CLIENT-KEY': DOKU_CONFIG.clientId,
    'X-TIMESTAMP': timestamp,
    'X-SIGNATURE': signature,
    'X-PARTNER-ID': DOKU_CONFIG.clientId,
    'X-EXTERNAL-ID': crypto.randomUUID(),
    'Authorization': `Bearer ${tokenB2B}`,
  }

  console.log('[DOKU QRIS] Request URL:', url)
  console.log('[DOKU QRIS] Request body:', JSON.stringify(requestBody, null, 2))

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
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
      errorMessage = error.responseMessage || error.message || error.error?.message || JSON.stringify(error)
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

  return {
    paymentUrl,
    orderId: params.orderId,
    token,
    expiryDate,
    qrString,
    qrImageUrl,
  }
}

// Get payment status
export async function getPaymentStatus(orderId: string) {
  if (!DOKU_CONFIG.privateKey) {
    throw new Error('DOKU_PRIVATE_KEY is not configured')
  }

  // Get B2B token
  const tokenData = await getB2BToken()
  const tokenB2B = tokenData.accessToken

  const timestamp = generateTimestamp()
  const customerNo = generateCustomerId(orderId)

  const requestBody = {
    partnerServiceId: PARTNER_SERVICE_ID,
    customerNo: customerNo,
    virtualAccountNo: `${PARTNER_SERVICE_ID}${customerNo}`,
    additionalInfo: {},
  }

  const url = `${DOKU_CONFIG.apiUrl}${SNAP_ENDPOINTS.CHECK_STATUS_VA}`
  const signature = generateSymmetricSignature('POST', SNAP_ENDPOINTS.CHECK_STATUS_VA, tokenB2B, requestBody, timestamp)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CLIENT-KEY': DOKU_CONFIG.clientId,
      'X-TIMESTAMP': timestamp,
      'X-SIGNATURE': signature,
      'X-PARTNER-ID': DOKU_CONFIG.clientId,
      'X-EXTERNAL-ID': crypto.randomUUID(),
      'Authorization': `Bearer ${tokenB2B}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DOKU Payment status check failed: ${errorText}`)
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
  if (!DOKU_CONFIG.dokuPublicKey) {
    console.warn('[DOKU] DOKU_PUBLIC_KEY_DOKU not configured, skipping signature verification')
    return true // Skip verification if DOKU public key not configured
  }

  try {
    const data = Buffer.from(`${clientId}|${timestamp}`)
    const isVerified = crypto.verify(
      'RSA-SHA256',
      data,
      {
        key: DOKU_CONFIG.dokuPublicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(signature, 'base64')
    )
    return isVerified
  } catch (error) {
    console.error('[DOKU] Signature verification error:', error)
    return false
  }
}

// Verify webhook symmetric signature
export function verifyDOKUSymmetricSignature(
  requestBody: string,
  signature: string,
  timestamp: string,
  tokenB2B: string
): boolean {
  const stringToSign = `POST:/api/webhooks/doku:${tokenB2B}:${crypto.createHash('sha256').update(requestBody).digest('hex').toLowerCase()}:${timestamp}`
  const expectedSignature = crypto.createHmac('sha512', DOKU_CONFIG.secretKey).update(stringToSign).digest('base64')
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
