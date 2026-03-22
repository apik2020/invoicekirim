import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTransactionStatus } from '@/lib/midtrans'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const payment = await prisma.payments.findUnique({
      where: { id },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment tidak ditemukan' }, { status: 404 })
    }

    // Check ownership
    if (payment.userId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If payment is pending, check status from Midtrans
    if (payment.status === 'PENDING' && payment.midtransOrderId) {
      try {
        const midtransStatus = await getTransactionStatus(payment.midtransOrderId)

        // Update status if changed
        if (midtransStatus.transactionStatus === 'settlement' || midtransStatus.transactionStatus === 'capture') {
          await prisma.payments.update({
            where: { id },
            data: {
              status: 'COMPLETED',
              midtransTransactionId: midtransStatus.orderId,
            },
          })

          // Update subscription
          const existingSub = await prisma.subscriptions.findFirst({
            where: { userId: session.id },
          })

          const periodEnd = new Date()
          periodEnd.setMonth(periodEnd.getMonth() + 1)

          if (existingSub) {
            await prisma.subscriptions.update({
              where: { id: existingSub.id },
              data: {
                planType: 'PRO',
                status: 'ACTIVE',
                stripeCurrentPeriodEnd: periodEnd,
              },
            })
          } else {
            await prisma.subscriptions.create({
              data: {
                id: crypto.randomUUID(),
                userId: session.id,
                planType: 'PRO',
                status: 'ACTIVE',
                stripeCurrentPeriodEnd: periodEnd,
                updatedAt: new Date(),
              },
            })
          }

          return NextResponse.json({
            payment: { ...payment, status: 'COMPLETED' },
            statusChanged: true,
          })
        }
      } catch (error) {
        console.error('Failed to check Midtrans status:', error)
      }
    }

    return NextResponse.json({ payment, statusChanged: false })
  } catch (error) {
    console.error('Payment status check error:', error)
    return NextResponse.json(
      { error: 'Gagal mengecek status pembayaran' },
      { status: 500 }
    )
  }
}
