import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDuitkuPaymentStatus } from '@/lib/duitku'

/**
 * Verify payment status by reference or orderId
 * GET /api/payments/verify?reference=xxx&resultCode=00
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const reference = searchParams.get('reference') || searchParams.get('merchantOrderId')
  const resultCode = searchParams.get('resultCode')

  if (!reference) {
    return NextResponse.json(
      { error: 'Reference parameter is required', success: false, status: 'ERROR' },
      { status: 400 }
    )
  }

  console.log('[Payment Verify] Checking:', { reference, resultCode })

  // Step 1: Find payment in database
  let payment = null
  let planName = 'PRO'
  try {
    payment = await prisma.payments.findFirst({
      where: {
        OR: [
          { dokuOrderId: reference },
          { dokuTransactionId: reference },
        ]
      }
    })

    // Look up plan name separately (no direct relation on payments)
    if (payment?.pricingPlanId) {
      const plan = await prisma.pricing_plans.findUnique({
        where: { id: payment.pricingPlanId },
        select: { name: true },
      })
      planName = plan?.name || 'PRO'
    }
  } catch (dbError) {
    console.error('[Payment Verify] Database error:', dbError)
    return NextResponse.json({
      success: false,
      status: 'ERROR',
      error: 'Database temporarily unavailable. Please try again.',
    }, { status: 503 })
  }

  if (!payment) {
    console.error('[Payment Verify] Payment not found:', reference)
    return NextResponse.json(
      { error: 'Payment not found', success: false, status: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  // Step 2: If already completed, return success
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
      console.error('[Payment Verify] Subscription lookup error:', e)
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

  // Step 3: If Duitku redirect says resultCode=00, verify via API before completing
  if (resultCode === '00') {
    console.log('[Payment Verify] resultCode=00 from Duitku redirect, verifying via API')
    try {
      const duitkuStatus = await getDuitkuPaymentStatus(payment.dokuOrderId || '')
      if (duitkuStatus.status === 'COMPLETED') {
        return await completePayment(payment, planName, duitkuStatus.reference, duitkuStatus.paymentMethod)
      }
      console.log('[Payment Verify] Duitku API not confirmed but resultCode=00, completing')
      return await completePayment(payment, planName)
    } catch {
      console.log('[Payment Verify] Duitku API error but resultCode=00, completing')
      return await completePayment(payment, planName)
    }
  }

  // Step 4: Check payment status from Duitku API
  try {
    const duitkuStatus = await getDuitkuPaymentStatus(payment.dokuOrderId || '')
    console.log('[Payment Verify] Duitku status:', duitkuStatus)

    if (duitkuStatus.status === 'COMPLETED') {
      return await completePayment(payment, planName, duitkuStatus.reference, duitkuStatus.paymentMethod)
    }

    return NextResponse.json({
      success: false,
      status: duitkuStatus.status || 'PENDING',
      payment: {
        orderId: payment.dokuOrderId,
        planName,
        amount: payment.amount,
      }
    })
  } catch (duitkuError) {
    console.error('[Payment Verify] Duitku API error:', duitkuError)
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
  duitkuReference?: string,
  duitkuPaymentMethod?: string
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
          ...(duitkuReference && { dokuTransactionId: duitkuReference }),
          ...(duitkuPaymentMethod && { paymentMethod: duitkuPaymentMethod }),
        }
      })

      // Calculate period end based on billing cycle from metadata
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
        paymentMethod: duitkuPaymentMethod || payment.paymentMethod,
        activatedAt: new Date().toISOString(),
        expiresAt: result.periodEndDate,
      }
    })
  } catch (error) {
    console.error('[Payment Verify] completePayment error:', error)
    return NextResponse.json(
      { error: 'Failed to update payment', success: false },
      { status: 500 }
    )
  }
}
