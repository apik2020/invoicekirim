import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPaymentStatus } from '@/lib/doku'

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

    // If payment is pending, check status from DOKU
    if (payment.status === 'PENDING' && payment.dokuOrderId) {
      try {
        const dokuStatus = await getPaymentStatus(payment.dokuOrderId)

        // Map DOKU payment statuses to our internal status
        const statusMapping: Record<string, 'COMPLETED' | 'FAILED' | 'PENDING'> = {
          'SUCCESS': 'COMPLETED',
          'PAYMENT_SUCCESS': 'COMPLETED',
          'PAYMENT_FAILED': 'FAILED',
          'FAILED': 'FAILED',
          'PENDING': 'PENDING',
          'EXPIRED': 'FAILED',
        }

        const newStatus = statusMapping[dokuStatus.payment_status] || 'PENDING'

        // Update status if changed
        if (newStatus !== 'PENDING' && newStatus !== payment.status) {
          await prisma.payments.update({
            where: { id },
            data: {
              status: newStatus,
              dokuTransactionId: dokuStatus.transaction?.transaction_id,
            },
          })

          // If payment completed, update subscription
          if (newStatus === 'COMPLETED') {
            const existingSub = await prisma.subscriptions.findFirst({
              where: { userId: session.id },
            })

            const pricingPlan = payment.pricingPlanId
              ? await prisma.pricing_plans.findUnique({
                  where: { id: payment.pricingPlanId },
                  select: {
                    id: true,
                    slug: true,
                    name: true,
                    price: true,
                    trialDays: true,
                  },
                })
              : null

            const periodEnd = new Date()
            periodEnd.setMonth(periodEnd.getMonth() + 1)

            if (existingSub) {
              await prisma.subscriptions.update({
                where: { id: existingSub.id },
                data: {
                  status: 'ACTIVE',
                  planType: 'PRO',
                  pricingPlanId: pricingPlan?.id || null,
                  stripeCurrentPeriodEnd: periodEnd,
                  updatedAt: new Date(),
                },
              })
            } else {
              await prisma.subscriptions.create({
                data: {
                  id: crypto.randomUUID(),
                  userId: session.id,
                  status: 'ACTIVE',
                  planType: 'PRO',
                  pricingPlanId: pricingPlan?.id || null,
                  stripeCurrentPeriodEnd: periodEnd,
                  updatedAt: new Date(),
                },
              })
            }

            // Log activity
            await prisma.activity_logs.create({
              data: {
                id: crypto.randomUUID(),
                userId: session.id,
                action: 'CREATED',
                entityType: 'Subscription',
                entityId: payment.id,
                title: 'Pembayaran Berhasil - Langganan Pro Aktif',
                description: `Pembayaran ${pricingPlan?.name} berhasil melalui DOKU`,
                metadata: {
                  paymentId: payment.id,
                  dokuOrderId: payment.dokuOrderId,
                  pricingPlan: pricingPlan?.name,
                  amount: payment.amount.toString(),
                },
              },
            })
          }

          return NextResponse.json({
            payment: { ...payment, status: newStatus },
            statusChanged: true,
            dokuStatus: dokuStatus,
          })
        }
      } catch (error) {
        console.error('Failed to check DOKU status:', error)
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
