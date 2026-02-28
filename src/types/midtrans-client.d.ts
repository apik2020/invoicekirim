declare module 'midtrans-client' {
  interface SnapConfig {
    isProduction: boolean
    serverKey: string
    clientKey: string
  }

  interface CoreApiConfig {
    isProduction: boolean
    serverKey: string
    clientKey: string
  }

  interface TransactionDetails {
    order_id: string
    gross_amount: number
  }

  interface CustomerDetails {
    first_name: string
    email: string
    phone?: string
  }

  interface ItemDetails {
    id: string
    price: number
    quantity: number
    name: string
  }

  interface Callbacks {
    finish?: string
    error?: string
    pending?: string
  }

  interface TransactionParameter {
    payment_type?: string
    transaction_details: TransactionDetails
    customer_details: CustomerDetails
    item_details: ItemDetails[]
    callbacks?: Callbacks
    bank_transfer?: any
    qris?: any
    custom_expiry?: {
      expiry_duration: number
      unit: 'minute' | 'hour' | 'day'
    }
  }

  interface SnapTransactionResponse {
    token: string
    redirect_url: string
  }

  interface CoreApiChargeResponse {
    order_id: string
    transaction_id: string
    transaction_status: string
    payment_type: string
    gross_amount: string
    va_numbers?: Array<{
      va_number: string
      bank: string
    }>
    qr_string?: string
    actions?: Array<{
      name: string
      url: string
    }>
  }

  interface TransactionStatusResponse {
    order_id: string
    transaction_id: string
    transaction_status: string
    payment_type: string
    gross_amount: string
    transaction_time: string
    va_numbers?: Array<{
      va_number: string
      bank: string
    }>
    fraud_status?: string
  }

  class Snap {
    constructor(config: SnapConfig)
    createTransaction(parameter: TransactionParameter): Promise<SnapTransactionResponse>
  }

  class CoreApi {
    constructor(config: CoreApiConfig)
    charge(parameter: TransactionParameter): Promise<CoreApiChargeResponse>
    transaction: {
      status(orderId: string): Promise<TransactionStatusResponse>
    }
  }

  export { Snap, CoreApi }
}
