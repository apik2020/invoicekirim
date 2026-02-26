export interface InvoiceItem {
  id?: string
  description: string
  quantity: number
  price: number
}

export interface InvoiceData {
  invoiceNumber?: string
  date: string
  dueDate?: string
  companyName: string
  companyEmail: string
  companyPhone?: string
  companyAddress?: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  clientAddress?: string
  items: InvoiceItem[]
  notes?: string
  taxRate: number
}

export interface InvoiceWithItems extends InvoiceData {
  id: string
  userId: string
  subtotal: number
  taxAmount: number
  total: number
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELED'
  paidAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELED'
