import { pdf } from '@react-pdf/renderer'
import { prisma } from './prisma'
import { ReceiptPDF } from '@/components/pdf/ReceiptPDF'

interface ReceiptData {
  receiptNumber: string
  date: Date
  amount: number
  currency: string
  paymentMethod: string
  description: string
  customerName: string
  customerEmail: string
  invoiceNumber?: string
}

// Generate unique receipt number
export async function generateReceiptNumber(): Promise<string> {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD

  // Find the last receipt number for today
  const lastReceipt = await prisma.payment.findFirst({
    where: {
      receiptNumber: {
        startsWith: `RCP-${dateStr}`,
      },
    },
    orderBy: {
      receiptNumber: 'desc',
    },
    select: {
      receiptNumber: true,
    },
  })

  let sequence = 1
  if (lastReceipt?.receiptNumber) {
    const lastSequence = parseInt(lastReceipt.receiptNumber.split('-')[2])
    sequence = lastSequence + 1
  }

  return `RCP-${dateStr}-${sequence.toString().padStart(4, '0')}`
}

// Generate receipt PDF using @react-pdf/renderer
export async function generateReceiptPDF(data: ReceiptData): Promise<Buffer> {
  try {
    // Create the PDF document
    const doc = <ReceiptPDF {...data} />

    // Generate PDF as a buffer
    const pdfBuffer = await pdf(doc).toBuffer()

    return pdfBuffer
  } catch (error) {
    console.error('Error generating receipt PDF:', error)
    throw new Error('Failed to generate receipt PDF')
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

// Create receipt record and generate PDF
export async function createReceipt(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  })

  if (!payment || payment.status !== 'COMPLETED') {
    throw new Error('Payment not found or not completed')
  }

  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: payment.userId },
    select: {
      name: true,
      email: true,
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Generate receipt number
  const receiptNumber = payment.receiptNumber || await generateReceiptNumber()

  // Update payment with receipt details
  // The PDF is generated on-demand when downloaded
  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      receiptNumber,
      receiptUrl: `/api/payments/${paymentId}/receipt/download`,
    },
  })

  return updatedPayment
}
