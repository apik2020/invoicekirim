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

  // Step 1: Try to find payment in database
  let payment = null
  try {
    payment = await prisma.payments.findFirst({
      where: {
        OR: [
          { dokuOrderId: reference },
          { dokuTransactionId: reference },
        ]
      },
      include: {
        pricing_plan: {
          select: {
            name: true,
            slug: true,
          }
        }
      }
    })
  } catch (dbError) {
    console.error('[Payment Verify] Database error:', dbError)

    // If database unreachable but Duitku says success, trust it
    if (resultCode === '00') {
      console.log('[Payment Verify] DB unreachable but resultCode=00, returning success')
      return NextResponse.json({
        success: true,
        status: 'COMPLETED',
        payment: {
          orderId: reference,
          planName: 'PRO',
        }
      })
    }

    return NextResponse.json({
      success: false,
      status: 'ERROR',
      error: 'Database temporarily unavailable',
    }, { status: 500 })
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
        planName: payment.pricing_plan?.name || 'PRO',
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        activatedAt: subscription?.updatedAt || payment.updatedAt,
        expiresAt: subscription?.stripeCurrentPeriodEnd,
      }
    })
  }

  // Step 3: If Duitku redirect says resultCode=00 (success), trust it and complete payment
  if (resultCode === '00') {
    console.log('[Payment Verify] resultCode=00 from Duitku redirect, completing payment')
    const result = await completePayment(payment)
    // If completePayment failed due to DB, still return success to client
    if (result.status === 500) {
      console.log('[Payment Verify] completePayment failed but resultCode=00, returning success anyway')
      return NextResponse.json({
        success: true,
        status: 'COMPLETED',
        payment: {
          orderId: payment.dokuOrderId,
          planName: payment.pricing_plan?.name || 'PRO',
          amount: payment.amount,
        }
      })
    }
    return result
  }

  // Step 4: Check payment status from Duitku API
  try {
    const duitkuStatus = await getDuitkuPaymentStatus(payment.dokuOrderId || '')
    console.log('[Payment Verify] Duitku status:', duitkuStatus)

    if (duitkuStatus.status === 'COMPLETED') {
      return await completePayment(payment, duitkuStatus.reference, duitkuStatus.paymentMethod)
    }

    return NextResponse.json({
      success: false,
      status: duitkuStatus.status || 'PENDING',
      payment: {
        orderId: payment.dokuOrderId,
        planName: payment.pricing_plan?.name,
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
        planName: payment.pricing_plan?.name,
        amount: payment.amount,
      }
    })
  }
}

/**
 * Complete a payment and activate subscription
 */
async function completePayment(
  payment: any,
  duitkuReference?: string,
  duitkuPaymentMethod?: string
): Promise<NextResponse> {
  try {
    // Update payment status
    await prisma.payments.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        ...(duitkuReference && { dokuTransactionId: duitkuReference }),
        ...(duitkuPaymentMethod && { paymentMethod: duitkuPaymentMethod }),
      }
    })

    // Calculate period end date (1 month from now)
    const periodEndDate = new Date()
    periodEndDate.setMonth(periodEndDate.getMonth() + 1)

    // Update or create subscription
    const existingSubscription = await prisma.subscriptions.findFirst({
      where: { userId: payment.userId }
    })

    if (existingSubscription) {
      await prisma.subscriptions.update({
        where: { id: existingSubscription.id },
        data: {
          status: 'ACTIVE',
          planType: 'PRO',
          pricingPlanId: payment.pricingPlanId,
          stripeCurrentPeriodEnd: periodEndDate,
          trialStartsAt: null,
          trialEndsAt: null,
          updatedAt: new Date(),
        }
      })
    } else {
      await prisma.subscriptions.create({
        data: {
          id: crypto.randomUUID(),
          userId: payment.userId,
          status: 'ACTIVE',
          planType: 'PRO',
          pricingPlanId: payment.pricingPlanId,
          stripeCurrentPeriodEnd: periodEndDate,
          updatedAt: new Date(),
        }
      })
    }

    return NextResponse.json({
      success: true,
      status: 'COMPLETED',
      payment: {
        orderId: payment.dokuOrderId,
        planName: payment.pricing_plan?.name || 'PRO',
        amount: payment.amount,
        paymentMethod: duitkuPaymentMethod || payment.paymentMethod,
        activatedAt: new Date().toISOString(),
        expiresAt: periodEndDate.toISOString(),
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
