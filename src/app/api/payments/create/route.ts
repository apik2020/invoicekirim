import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPaymentGateway, generateOrderId } from '@/lib/payment'
import { validateUpgradeRequest } from '@/lib/subscription-upgrade'
import { logger } from '@/lib/logger'
import { createCheckoutSchema } from '@/lib/validations/common'

/**
 * POST /api/payments/create
 *
 * Initiates a subscription upgrade payment for the authenticated user via the
 * active payment gateway (iPaymu) and returns a redirect payment URL.
 *
 * @body {CreateCheckoutSchema} Checkout data (pricingPlanId, planSlug, optional billingCycle)
 *
 * @returns {{ success: boolean, payment: { id, orderId, amount, paymentUrl, expiredAt } }}
 * @throws {401} Unauthorized - User not logged in
 * @throws {422} Validation Error - Invalid checkout data
 * @throws {404} Not Found - Pricing plan or user not found
 * @throws {400} Bad Request - Plan mismatch or upgrade not allowed
 * @throws {500} Internal Server Error
 */
export async function POST(req: NextRequest) {
  let session
  try {
    session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = createCheckoutSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]
      return NextResponse.json(
        {
          error: firstError?.message || 'Paket tidak valid',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      )
    }

    const { pricingPlanId, planSlug, billingCycle } = parsed.data

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
      logger.apiError('/api/payments/create gateway', gatewayError, session?.id)
      throw gatewayError
    }
  } catch (error) {
    logger.apiError('/api/payments/create POST', error, session?.id)

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
      { error: errorMessage },
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
