import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTransactionStatus } from '@/lib/midtrans'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const payment = await prisma.payment.findUnique({
      where: { id },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment tidak ditemukan' }, { status: 404 })
    }

    // Check ownership
    if (payment.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If payment is pending, check status from Midtrans
    if (payment.status === 'PENDING' && payment.midtransOrderId) {
      try {
        const midtransStatus = await getTransactionStatus(payment.midtransOrderId)

        // Update status if changed
        if (midtransStatus.transactionStatus === 'settlement' || midtransStatus.transactionStatus === 'capture') {
          await prisma.payment.update({
            where: { id },
            data: {
              status: 'COMPLETED',
              midtransTransactionId: midtransStatus.orderId,
            },
          })

          // Update subscription
          const existingSub = await prisma.subscription.findFirst({
            where: { userId: session.user.id },
          })

          const periodEnd = new Date()
          periodEnd.setMonth(periodEnd.getMonth() + 1)

          if (existingSub) {
            await prisma.subscription.update({
              where: { id: existingSub.id },
              data: {
                planType: 'PRO',
                status: 'ACTIVE',
                stripeCurrentPeriodEnd: periodEnd,
              },
            })
          } else {
            await prisma.subscription.create({
              data: {
                userId: session.user.id,
                planType: 'PRO',
                status: 'ACTIVE',
                stripeCurrentPeriodEnd: periodEnd,
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
