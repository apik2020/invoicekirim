/**
 * Payment Gateway Abstraction Layer
 * Defines the interface and shared types for payment gateway integrations.
 */

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED'

export type PaymentMethodType = 'VA' | 'QRIS'

export interface PaymentMethod {
  code: string
  name: string
  type: PaymentMethodType
  logo?: string
  description?: string
}

export interface PaymentParams {
  orderId: string
  amount: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  description: string
  paymentMethod?: PaymentMethodType
  paymentChannel?: string
  expiryMinutes?: number
  returnUrl?: string
  callbackUrl?: string
  metadata?: Record<string, unknown>
}

export interface PaymentResult {
  orderId: string
  sessionId?: string
  transactionId?: string
  status: PaymentStatus
  paymentUrl?: string
  vaNumber?: string
  vaBank?: string
  qrString?: string
  qrImageUrl?: string
  expiredAt?: Date
  fee?: number
  total?: number
}

export interface TransactionStatus {
  status: PaymentStatus
  amount: number
  reference: string
  transactionId?: string
  paymentMethod?: string
  paidAt?: Date
}

export interface CallbackPayload {
  [key: string]: string | number | undefined
}

export interface CallbackVerification {
  isValid: boolean
  orderId: string
  status: PaymentStatus
  transactionId?: string
  amount?: number
  fee?: number
  paymentMethod?: string
  channel?: string
}

export interface PaymentGateway {
  readonly name: string

  createTransaction(params: PaymentParams): Promise<PaymentResult>
  checkTransactionStatus(orderId: string): Promise<TransactionStatus>
  verifyCallback(payload: CallbackPayload): CallbackVerification
  getAvailablePaymentMethods(): PaymentMethod[]
}
