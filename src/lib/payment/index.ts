/**
 * Payment Gateway Factory
 * Returns the active payment gateway based on environment configuration.
 */

import type { PaymentGateway } from './types'
import { IPaymuGateway } from './ipaymu'

export type { PaymentGateway } from './types'
export type {
  PaymentStatus,
  PaymentMethodType,
  PaymentMethod,
  PaymentParams,
  PaymentResult,
  TransactionStatus,
  CallbackPayload,
  CallbackVerification,
} from './types'

let _gateway: PaymentGateway | null = null

export function getPaymentGateway(): PaymentGateway {
  if (!_gateway) {
    _gateway = new IPaymuGateway()
  }
  return _gateway
}

export function generateOrderId(prefix = 'INV'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}
