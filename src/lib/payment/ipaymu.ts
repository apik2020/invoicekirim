/**
 * iPaymu Payment Gateway Integration
 * Implements PaymentGateway interface using iPaymu v2 API
 *
 * Authentication: HMAC-SHA256 signature
 *   1. SHA256(JSON.stringify(body)) → bodyHash
 *   2. stringToSign = "POST:{VA}:{bodyHash}:{apiKey}"
 *   3. signature = HMAC-SHA256(stringToSign, apiKey)
 *
 * Required Environment Variables:
 * - IPAYMU_VA: Virtual Account number
 * - IPAYMU_API_KEY: API key
 * - IPAYMU_MODE: 'SANDBOX' or 'PRODUCTION'
 */

import { createHash, createHmac, timingSafeEqual } from 'crypto'
import type {
  PaymentGateway,
  PaymentParams,
  PaymentResult,
  TransactionStatus,
  CallbackPayload,
  CallbackVerification,
  PaymentMethod,
  PaymentStatus,
} from './types'

// --- Configuration (lazy to allow test env overrides) ---

function getConfig() {
  return {
    va: process.env.IPAYMU_VA || '',
    apiKey: process.env.IPAYMU_API_KEY || '',
    isProduction: process.env.IPAYMU_MODE === 'PRODUCTION',
  }
}

function getBaseUrl() {
  return getConfig().isProduction
    ? 'https://my.ipaymu.com'
    : 'https://sandbox.ipaymu.com'
}

function getEndpoints() {
  const base = getBaseUrl()
  return {
    directPayment: `${base}/api/v2/payment/direct`,
    redirectPayment: `${base}/api/v2/payment`,
    checkTransaction: `${base}/api/v2/transaction`,
  } as const
}

// --- Constants ---

export const IPAYMU_VA_BANKS: PaymentMethod[] = [
  { code: 'bca', name: 'BCA', type: 'VA', description: 'Virtual Account BCA' },
  { code: 'bni', name: 'BNI', type: 'VA', description: 'Virtual Account BNI' },
  { code: 'bri', name: 'BRI', type: 'VA', description: 'Virtual Account BRI' },
  { code: 'mandiri', name: 'Mandiri', type: 'VA', description: 'Virtual Account Mandiri' },
  { code: 'permata', name: 'Permata', type: 'VA', description: 'Virtual Account Permata' },
  { code: 'cimb', name: 'CIMB Niaga', type: 'VA', description: 'Virtual Account CIMB Niaga' },
  { code: 'bsi', name: 'BSI', type: 'VA', description: 'Virtual Account BSI' },
]

export const IPAYMU_QRIS: PaymentMethod = {
  code: 'qris',
  name: 'QRIS',
  type: 'QRIS',
  description: 'Scan dengan e-wallet atau mobile banking',
}

// Map UI bank codes to iPaymu payment channel codes
const BANK_CODE_MAP: Record<string, string> = {
  'BCA': 'bca',
  'BNI': 'bni',
  'BRI': 'bri',
  'MANDIRI': 'mandiri',
  'PERMATA': 'permata',
  'CIMB': 'cimb',
  'CIMB NIAGA': 'cimb',
  'BSI': 'bsi',
  // Pass-through iPaymu codes
  'bca': 'bca',
  'bni': 'bni',
  'bri': 'bri',
  'mandiri': 'mandiri',
  'permata': 'permata',
  'cimb': 'cimb',
  'bsi': 'bsi',
}

export function mapBankCodeToIpaymu(uiBankCode: string): string {
  const normalized = uiBankCode.toUpperCase().trim()
  return BANK_CODE_MAP[normalized] || uiBankCode.toLowerCase()
}

// --- Logging ---

interface LogContext {
  action: string
  [key: string]: unknown
}

function log(level: 'info' | 'warn' | 'error', message: string, context?: LogContext) {
  const prefix = '[iPaymu]'
  const ctx = context ? ` ${JSON.stringify(context)}` : ''
  const output = `${prefix} ${message}${ctx}`

  switch (level) {
    case 'error':
      console.error(output)
      break
    case 'warn':
      console.warn(output)
      break
    default:
      console.log(output)
  }
}

// --- Signature Helpers ---

function generateBodyHash(bodyString: string): string {
  return createHash('sha256').update(bodyString).digest('hex').toLowerCase()
}

function generateSignature(method: string, bodyString: string): string {
  const config = getConfig()
  const bodyHash = generateBodyHash(bodyString)
  const stringToSign = `${method}:${config.va}:${bodyHash}:${config.apiKey}`
  return createHmac('sha256', config.apiKey).update(Buffer.from(stringToSign, 'utf-8')).digest('hex')
}

function generateTimestamp(): string {
  const d = new Date()
  const pad = (n: number) => (n < 10 ? '0' : '') + n
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  )
}

function buildHeaders(bodyString: string): Record<string, string> {
  const config = getConfig()
  return {
    'Content-Type': 'application/json',
    va: config.va,
    signature: generateSignature('POST', bodyString),
    timestamp: generateTimestamp(),
  }
}

// --- Retry Helper ---

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  action: string
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const start = Date.now()
    try {
      const result = await fn()
      const duration = Date.now() - start
      log('info', `${action} succeeded`, { action, attempt, duration: `${duration}ms` })
      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      const duration = Date.now() - start
      log('warn', `${action} failed`, { action, attempt, duration: `${duration}ms`, error: lastError.message })

      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000 // 2s, 4s
        log('info', `Retrying in ${delayMs}ms...`, { action, nextAttempt: attempt + 1 })
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }
  }

  throw lastError!
}

// --- Status Mapping ---

function mapStatusCode(statusCode: number | string): PaymentStatus {
  const code = typeof statusCode === 'string' ? parseInt(statusCode, 10) : statusCode
  switch (code) {
    case 1:
      return 'COMPLETED'
    case 0:
      return 'PENDING'
    case -2:
      return 'EXPIRED'
    default:
      return 'FAILED'
  }
}

// --- Gateway Implementation ---

export class IPaymuGateway implements PaymentGateway {
  readonly name = 'iPaymu'

  async createTransaction(params: PaymentParams): Promise<PaymentResult> {
    log('info', 'Creating transaction', {
      action: 'createTransaction',
      orderId: params.orderId,
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      paymentChannel: params.paymentChannel,
    })

    if (!getConfig().va || !getConfig().apiKey) {
      throw new Error('iPaymu credentials not configured. Set IPAYMU_VA and IPAYMU_API_KEY')
    }

    const notifyUrl = params.callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/ipaymu`
    const successUrl = params.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/checkout`
    const expired = params.expiryMinutes ? Math.ceil(params.expiryMinutes / 60) : 24 // hours

    const phone = params.customerPhone || '081000000000'
    const requestBody: Record<string, unknown> = {
      account: getConfig().va,
      name: params.customerName,
      phone,
      email: params.customerEmail,
      amount: Math.round(params.amount),
      notifyUrl,
      referenceId: params.orderId,
      expired,
      expiredType: 'days',
      product: [params.description || 'Payment'],
      qty: ['1'],
      price: [String(Math.round(params.amount))],
      description: [params.description || 'Payment'],
      weight: [0],
      length: [0],
      width: [0],
      height: [0],
      successUrl,
      cancelUrl,
    }

    if (params.paymentMethod === 'VA') {
      requestBody.paymentMethod = 'va'
      requestBody.paymentChannel = mapBankCodeToIpaymu(params.paymentChannel || '')
    } else if (params.paymentMethod === 'QRIS') {
      requestBody.paymentMethod = 'qris'
    }

    return withRetry(async () => {
      const bodyString = JSON.stringify(requestBody)
      const headers = buildHeaders(bodyString)

      log('info', 'Direct payment request', {
        action: 'createTransaction',
        url: getEndpoints().directPayment,
        body: { ...requestBody, name: '***', email: '***' },
      })

      const response = await fetch(getEndpoints().directPayment, {
        method: 'POST',
        headers,
        body: bodyString,
      })

      const data = await response.json()

      log('info', 'Direct payment response', {
        action: 'createTransaction',
        status: response.status,
        data: JSON.stringify(data),
      })

      if (!response.ok) {
        log('error', 'API error', { action: 'createTransaction', status: response.status, data })
        throw new Error(`iPaymu API error: ${data.Message || data.message || data.status_message || 'Unknown error'}`)
      }

      if (data.Status !== 200 && data.Status !== 0) {
        const errorMsg = data.Message || data.message || data.status_message || 'Unknown error'
        log('error', 'Transaction failed', { action: 'createTransaction', status: data.Status, message: errorMsg })
        throw new Error(`iPaymu transaction error: ${errorMsg}`)
      }

      const result: PaymentResult = {
        orderId: params.orderId,
        sessionId: data.SessionId || data.SessionID,
        transactionId: data.TransactionId,
        status: 'PENDING',
        fee: data.Fee ? parseFloat(data.Fee) : undefined,
        total: data.Total ? parseFloat(data.Total) : undefined,
      }

      // VA fields
      if (data.PaymentNo) {
        result.vaNumber = data.PaymentNo
        result.vaBank = params.paymentChannel?.toUpperCase() || ''
      }

      // QRIS fields
      if (data.QrString || data.QrImage) {
        result.qrString = data.QrString
        result.qrImageUrl = data.QrImage
      }

      // Expiry
      if (data.Expired) {
        const expiryHours = parseInt(data.Expired, 10) || expired
        result.expiredAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000)
      } else {
        result.expiredAt = new Date(Date.now() + expired * 60 * 60 * 1000)
      }

      return result
    }, 3, 'createTransaction')
  }

  async createRedirectTransaction(params: PaymentParams): Promise<PaymentResult> {
    log('info', 'Creating redirect transaction', {
      action: 'createRedirectTransaction',
      orderId: params.orderId,
      amount: params.amount,
    })

    if (!getConfig().va || !getConfig().apiKey) {
      throw new Error('iPaymu credentials not configured. Set IPAYMU_VA and IPAYMU_API_KEY')
    }

    const notifyUrl = params.callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/ipaymu`
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?reference_id=${params.orderId}`
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/checkout`
    const expired = params.expiryMinutes ? Math.ceil(params.expiryMinutes / 60) : 24
    const phone = params.customerPhone || '081000000000'

    const requestBody: Record<string, unknown> = {
      account: getConfig().va,
      name: params.customerName,
      phone,
      email: params.customerEmail,
      buyerName: params.customerName,
      buyerEmail: params.customerEmail,
      buyerPhone: phone,
      amount: Math.round(params.amount),
      notifyUrl,
      returnUrl,
      cancelUrl,
      referenceId: params.orderId,
      expired,
      expiredType: 'days',
      product: [params.description || 'Payment'],
      qty: ['1'],
      price: [String(Math.round(params.amount))],
      description: [params.description || 'Payment'],
      weight: [0],
      length: [0],
      width: [0],
      height: [0],
    }

    return withRetry(async () => {
      const bodyString = JSON.stringify(requestBody)
      const headers = buildHeaders(bodyString)

      log('info', 'Redirect payment request', {
        action: 'createRedirectTransaction',
        url: getEndpoints().redirectPayment,
      })

      const response = await fetch(getEndpoints().redirectPayment, {
        method: 'POST',
        headers,
        body: bodyString,
      })

      const data = await response.json()

      log('info', 'Redirect payment response', {
        action: 'createRedirectTransaction',
        status: response.status,
        data: JSON.stringify(data),
      })

      if (!response.ok) {
        log('error', 'Redirect API error', { action: 'createRedirectTransaction', status: response.status, data })
        throw new Error(`iPaymu API error: ${data.Message || data.message || 'Unknown error'}`)
      }

      if (data.Status !== 200 && data.Status !== 0) {
        const errorMsg = data.Message || data.message || 'Unknown error'
        log('error', 'Redirect transaction failed', { action: 'createRedirectTransaction', status: data.Status, message: errorMsg })
        throw new Error(`iPaymu redirect error: ${errorMsg}`)
      }

      const sessionData = data.Data || data
      const paymentUrl = sessionData.Url || sessionData.url || ''

      if (!paymentUrl) {
        throw new Error('iPaymu did not return a payment URL')
      }

      return {
        orderId: params.orderId,
        sessionId: sessionData.SessionID || sessionData.SessionId,
        status: 'PENDING',
        paymentUrl,
        expiredAt: new Date(Date.now() + expired * 60 * 60 * 1000),
      }
    }, 3, 'createRedirectTransaction')
  }

  async checkTransactionStatus(orderId: string): Promise<TransactionStatus> {
    log('info', 'Checking transaction status', { action: 'checkTransactionStatus', orderId })

    if (!getConfig().va || !getConfig().apiKey) {
      throw new Error('iPaymu credentials not configured')
    }

    return withRetry(async () => {
      // Try with transactionId first (iPaymu transaction ID or session ID)
      const requestObj: Record<string, string> = {
        transactionId: orderId,
      }
      const bodyString = JSON.stringify(requestObj)
      const headers = buildHeaders(bodyString)

      const response = await fetch(getEndpoints().checkTransaction, {
        method: 'POST',
        headers,
        body: bodyString,
      })

      if (!response.ok) {
        const errorText = await response.text()
        log('warn', 'Status check failed', { action: 'checkTransactionStatus', status: response.status, error: errorText })
        throw new Error(`iPaymu status check error: ${errorText}`)
      }

      const data = await response.json()
      log('info', 'Status check response', { action: 'checkTransactionStatus', data: JSON.stringify(data) })

      // iPaymu v2 wraps transaction data inside { Status: 200, Success: true, Data: { ... } }
      const txData = data.Data || data

      // API-level error (not a valid response)
      if (!data.Success && data.Status === -1) {
        log('warn', 'Transaction not found', { action: 'checkTransactionStatus', message: data.Message })
        throw new Error(`iPaymu transaction not found: ${data.Message || 'Unknown'}`)
      }

      // Extract payment status from Data.Status (1=Berhasil, 0=Pending, -2=Expired)
      const paymentStatus = txData.Status ?? data.status_code ?? 0

      return {
        status: mapStatusCode(paymentStatus),
        amount: parseFloat(txData.Amount || txData.SubTotal || data.total || data.amount || '0'),
        reference: String(txData.ReferenceId || txData.TransactionId || data.trx_id || ''),
        transactionId: String(txData.TransactionId || data.TransactionId || data.trx_id || ''),
        paymentMethod: txData.PaymentMethod || data.via || data.paymentMethod || '',
        paymentChannel: txData.PaymentChannel || data.channel || '',
        paidAt: paymentStatus === 1 ? new Date() : undefined,
      }
    }, 2, 'checkTransactionStatus')
  }

  verifyCallback(payload: CallbackPayload): CallbackVerification {
    log('info', 'Verifying callback', {
      action: 'verifyCallback',
      referenceId: payload.reference_id,
      statusCode: payload.status_code,
    })

    const receivedSignature = String(payload.signature || '')

    // Clone and remove signature for verification
    const dataToVerify = { ...payload }
    delete dataToVerify.signature

    // ksort equivalent: sort keys alphabetically
    const sortedData: Record<string, unknown> = {}
    Object.keys(dataToVerify)
      .sort()
      .forEach(key => {
        sortedData[key] = dataToVerify[key]
      })

    const jsonPayload = JSON.stringify(sortedData)
    const expectedSignature = createHmac('sha256', getConfig().va)
      .update(jsonPayload)
      .digest('hex')

    // Timing-safe comparison to prevent timing attacks
    let isValid = false
    try {
      const receivedBuf = Buffer.from(receivedSignature.toLowerCase(), 'hex')
      const expectedBuf = Buffer.from(expectedSignature.toLowerCase(), 'hex')
      if (receivedBuf.length === expectedBuf.length) {
        isValid = timingSafeEqual(receivedBuf, expectedBuf)
      }
    } catch {
      isValid = false
    }

    if (!isValid) {
      log('error', 'Callback signature verification failed', {
        action: 'verifyCallback',
        referenceId: payload.reference_id,
      })
      return {
        isValid: false,
        orderId: String(payload.reference_id || ''),
        status: 'FAILED',
      }
    }

    log('info', 'Callback signature verified', {
      action: 'verifyCallback',
      referenceId: payload.reference_id,
      statusCode: payload.status_code,
    })

    return {
      isValid: true,
      orderId: String(payload.reference_id || ''),
      status: mapStatusCode(payload.status_code ?? 0),
      transactionId: String(payload.trx_id || ''),
      amount: payload.total ? parseFloat(String(payload.total)) : undefined,
      fee: payload.fee ? parseFloat(String(payload.fee)) : undefined,
      paymentMethod: payload.via ? String(payload.via) : undefined,
      channel: payload.channel ? String(payload.channel) : undefined,
    }
  }

  getAvailablePaymentMethods(): PaymentMethod[] {
    return [...IPAYMU_VA_BANKS, IPAYMU_QRIS]
  }
}
