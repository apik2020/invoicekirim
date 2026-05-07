import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPaymentGateway, generateOrderId } from '@/lib/payment'
import { validateUpgradeRequest } from '@/lib/subscription-upgrade'

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { pricingPlanId, planSlug } = body

    if (!pricingPlanId || !planSlug) {
      return NextResponse.json(
        { error: 'Paket tidak valid' },
        { status: 400 }
      )
    }

    const { billingCycle = 'monthly' } = body

    const pricingPlan = await prisma.pricing_plans.findUnique({
      where: { id: pricingPlanId },
      select: {
        id: true,
        slug: true,
        name: true,
        price_monthly: true,
        price_yearly: true,
        currency: true,
        trialDays: true,
      },
    })

    if (!pricingPlan) {
      return NextResponse.json({ error: 'Paket tidak ditemukan' }, { status: 404 })
    }

    if (pricingPlan.slug !== planSlug) {
      return NextResponse.json({ error: 'Paket tidak cocok' }, { status: 400 })
    }

    const validation = await validateUpgradeRequest(session.id, planSlug)
    if (!validation.allowed) {
      await prisma.activity_logs.create({
        data: {
          id: crypto.randomUUID(),
          userId: session.id,
          action: 'CREATED',
          entityType: 'Checkout',
          entityId: pricingPlanId,
          title: 'Checkout Ditolak - Upgrade Tidak Valid',
          description: validation.reason || 'Upgrade tidak diizinkan',
          metadata: {
            targetPlanSlug: planSlug,
            pricingPlanId,
            attemptedAt: new Date().toISOString(),
          },
        },
      })

      return NextResponse.json(
        { error: validation.reason || 'Upgrade tidak diizinkan' },
        { status: 400 }
      )
    }

    const amount = billingCycle === 'yearly' ? pricingPlan.price_yearly : pricingPlan.price_monthly
    const orderId = generateOrderId()

    const user = await prisma.users.findUnique({
      where: { id: session.id },
      select: { name: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    const payment = await prisma.payments.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.id,
        dokuOrderId: orderId,
        amount,
        currency: pricingPlan.currency,
        description: `NotaBener ${pricingPlan.name}`,
        status: 'PENDING',
        paymentMethod: 'REDIRECT',
        paymentGateway: 'iPaymu',
        pricingPlanId,
        metadata: { billingCycle },
        updatedAt: new Date(),
      },
    })

    const gateway = getPaymentGateway()

    try {
      const result = await gateway.createRedirectTransaction({
        orderId,
        amount,
        customerName: user.name || 'Customer',
        customerEmail: user.email,
        description: `NotaBener ${pricingPlan.name}`,
      })

      await prisma.payments.update({
        where: { id: payment.id },
        data: {
          dokuOrderId: orderId,
          dokuTransactionId: result.transactionId,
          gatewaySessionId: result.sessionId,
          paymentUrl: result.paymentUrl,
          expiredAt: result.expiredAt,
        },
      })

      return NextResponse.json({
        success: true,
        payment: {
          id: payment.id,
          orderId,
          amount,
          paymentUrl: result.paymentUrl,
          expiredAt: result.expiredAt,
        },
      })
    } catch (gatewayError) {
      console.error('[Payment] Gateway error:', gatewayError)
      throw gatewayError
    }
  } catch (error) {
    console.error('Payment creation error:', error)

    let errorMessage = 'Gagal membuat transaksi pembayaran'
    if (error) {
      if (typeof error === 'string') {
        errorMessage = error
      } else if (error instanceof Error) {
        errorMessage = error.message
      } else if ((error as any).message) {
        errorMessage = (error as any).message
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? JSON.stringify(error, null, 2) : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  const gateway = getPaymentGateway()
  const methods = gateway.getAvailablePaymentMethods()

  return NextResponse.json({
    paymentMethods: [
      { value: 'REDIRECT', label: 'iPaymu Payment Page', description: 'Virtual Account, QRIS, dan metode lainnya' },
    ],
    methods,
  })
}
