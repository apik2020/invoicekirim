import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPaymentGateway } from '@/lib/payment'
import { getUserSession } from '@/lib/session'
import { logger } from '@/lib/logger'

/**
 * Verify payment status by reference or orderId
 * GET /api/payments/verify?reference=xxx&trx_id=yyy
 * Requires authenticated session
 */
export async function GET(req: NextRequest) {
  const session = await getUserSession()
  if (!session?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const reference = searchParams.get('reference') || searchParams.get('reference_id')
  const trxId = searchParams.get('trx_id')

  if (!reference) {
    return NextResponse.json(
      { error: 'Reference parameter is required', success: false, status: 'ERROR' },
      { status: 400 }
    )
  }

  logger.dev('Payment Verify', 'Checking:', { reference, trxId })

  let payment = null
  let planName = 'PRO'
  try {
    payment = await prisma.payments.findFirst({
      where: {
        OR: [
          { dokuOrderId: reference },
          { dokuTransactionId: reference },
          { dokuTransactionId: trxId || undefined },
        ].filter(clause => {
          // Filter out undefined values from OR clause
          return Object.values(clause).every(v => v !== undefined)
        })
      }
    })

    if (payment?.pricingPlanId) {
      const plan = await prisma.pricing_plans.findUnique({
        where: { id: payment.pricingPlanId },
        select: { name: true },
      })
      planName = plan?.name || 'PRO'
    }
  } catch (dbError) {
    logger.apiError('/api/payments/verify db', dbError, session.id)
    return NextResponse.json({
      success: false,
      status: 'ERROR',
      error: 'Database temporarily unavailable. Please try again.',
    }, { status: 503 })
  }

  if (!payment) {
    logger.warn('[Payment Verify] Payment not found', { reference, userId: session.id })
    return NextResponse.json(
      { error: 'Payment not found', success: false, status: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  // If already completed, return success
  if (payment.status === 'COMPLETED') {
    let subscription = null
    try {
      subscription = await prisma.subscriptions.findFirst({
        where: { userId: payment.userId },
        select: {
          stripeCurrentPeriodEnd: true,
          updatedAt: true,
        }
      })
    } catch (e) {
      logger.error('[Payment Verify] Subscription lookup error', e, { userId: payment.userId })
    }

    return NextResponse.json({
      success: true,
      status: 'COMPLETED',
      payment: {
        orderId: payment.dokuOrderId,
        planName,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        activatedAt: subscription?.updatedAt || payment.updatedAt,
        expiresAt: subscription?.stripeCurrentPeriodEnd,
      }
    })
  }

  // Try to check payment status from iPaymu API
  // For redirect payments: prefer trx_id (from URL), then dokuTransactionId, then gatewaySessionId
  const gatewayId = trxId || payment.dokuTransactionId || payment.gatewaySessionId || payment.dokuOrderId

  try {
    const gateway = getPaymentGateway()
    const txStatus = await gateway.checkTransactionStatus(gatewayId)
    logger.dev('Payment Verify', 'Gateway status:', txStatus)

    if (txStatus.status === 'COMPLETED') {
      // Store trx_id if we got it from URL params and payment doesn't have it yet
      if (trxId && !payment.dokuTransactionId) {
        await prisma.payments.update({
          where: { id: payment.id },
          data: { dokuTransactionId: trxId },
        })
      }
      return await completePayment(payment, planName, txStatus.transactionId || trxId, txStatus.paymentMethod)
    }

    return NextResponse.json({
      success: false,
      status: txStatus.status || 'PENDING',
      payment: {
        orderId: payment.dokuOrderId,
        planName,
        amount: payment.amount,
      }
    })
  } catch (gatewayError) {
    logger.error('[Payment Verify] Gateway API error', gatewayError, { userId: session.id })
    // Don't fail — return PENDING so the success page keeps polling
    return NextResponse.json({
      success: false,
      status: payment.status || 'PENDING',
      payment: {
        orderId: payment.dokuOrderId,
        planName,
        amount: payment.amount,
      }
    })
  }
}

async function completePayment(
  payment: any,
  planName: string,
  gatewayReference?: string,
  gatewayPaymentMethod?: string
): Promise<NextResponse> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const currentPayment = await tx.payments.findUnique({
        where: { id: payment.id },
        select: { status: true },
      })

      if (currentPayment?.status === 'COMPLETED') {
        return { alreadyCompleted: true }
      }

      await tx.payments.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          ...(gatewayReference && { dokuTransactionId: gatewayReference }),
          ...(gatewayPaymentMethod && { paymentMethod: gatewayPaymentMethod }),
        }
      })

      const billingCycle = (payment.metadata as Record<string, unknown>)?.billingCycle as string || 'monthly'
      const periodEndDate = new Date()
      if (billingCycle === 'yearly') {
        periodEndDate.setFullYear(periodEndDate.getFullYear() + 1)
      } else {
        periodEndDate.setMonth(periodEndDate.getMonth() + 1)
      }

      const existingSubscription = await tx.subscriptions.findFirst({
        where: { userId: payment.userId }
      })

      if (existingSubscription) {
        await tx.subscriptions.update({
          where: { id: existingSubscription.id },
          data: {
            status: 'ACTIVE',
            planType: 'PRO',
            pricingPlanId: payment.pricingPlanId,
            stripeCurrentPeriodEnd: periodEndDate,
            billingCycle: billingCycle === 'yearly' ? 'YEARLY' : 'MONTHLY',
            trialStartsAt: null,
            trialEndsAt: null,
            updatedAt: new Date(),
          }
        })
      } else {
        await tx.subscriptions.create({
          data: {
            id: crypto.randomUUID(),
            userId: payment.userId,
            status: 'ACTIVE',
            planType: 'PRO',
            pricingPlanId: payment.pricingPlanId,
            stripeCurrentPeriodEnd: periodEndDate,
            billingCycle: billingCycle === 'yearly' ? 'YEARLY' : 'MONTHLY',
            updatedAt: new Date(),
          }
        })
      }

      return {
        alreadyCompleted: false,
        periodEndDate: periodEndDate.toISOString(),
      }
    })

    if (result.alreadyCompleted) {
      return NextResponse.json({
        success: true,
        status: 'COMPLETED',
        payment: {
          orderId: payment.dokuOrderId,
          planName,
          amount: payment.amount,
        }
      })
    }

    return NextResponse.json({
      success: true,
      status: 'COMPLETED',
      payment: {
        orderId: payment.dokuOrderId,
        planName,
        amount: payment.amount,
        paymentMethod: gatewayPaymentMethod || payment.paymentMethod,
        activatedAt: new Date().toISOString(),
        expiresAt: result.periodEndDate,
      }
    })
  } catch (error) {
    logger.error('[Payment Verify] completePayment error', error, { userId: payment.userId })
    return NextResponse.json(
      { error: 'Failed to update payment', success: false },
      { status: 500 }
    )
  }
}
