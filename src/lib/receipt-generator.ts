import { prisma } from './prisma'

// Generate unique receipt number
export async function generateReceiptNumber(): Promise<string> {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD

  // Find the last receipt number for today
  const lastReceipt = await prisma.payments.findFirst({
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

// Create receipt record
export async function createReceipt(paymentId: string) {
  const payment = await prisma.payments.findUnique({
    where: { id: paymentId },
  })

  if (!payment || payment.status !== 'COMPLETED') {
    throw new Error('Payment not found or not completed')
  }

  // Get user info
  const user = await prisma.users.findUnique({
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
  const updatedPayment = await prisma.payments.update({
    where: { id: paymentId },
    data: {
      receiptNumber,
      receiptUrl: `/api/payments/${paymentId}/receipt/download`,
    },
  })

  return updatedPayment
}
