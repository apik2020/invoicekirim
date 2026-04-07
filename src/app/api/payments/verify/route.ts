import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDuitkuPaymentStatus } from '@/lib/duitku'

/**
 * Verify payment status by reference or orderId
 * GET /api/payments/verify?reference=xxx&resultCode=00
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    // Accept both 'reference' and 'merchantOrderId' params
    const reference = searchParams.get('reference') || searchParams.get('merchantOrderId')
    const resultCode = searchParams.get('resultCode')

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference parameter is required' },
        { status: 400 }
      )
    }

    console.log('[Payment Verify] Checking:', { reference, resultCode })

    // Find payment by orderId (merchantOrderId) or transaction reference
    const payment = await prisma.payments.findFirst({
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

    if (!payment) {
      console.error('[Payment Verify] Payment not found:', reference)
      return NextResponse.json(
        { error: 'Payment not found', success: false, status: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // If payment is already completed, return success
    if (payment.status === 'COMPLETED') {
      const subscription = await prisma.subscriptions.findFirst({
        where: { userId: payment.userId },
        select: {
          stripeCurrentPeriodEnd: true,
          updatedAt: true,
        }
      })

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

    // If Duitku redirect says resultCode=00 (success), trust it and complete the payment
    if (resultCode === '00') {
      console.log('[Payment Verify] resultCode=00 from Duitku redirect, completing payment')
      return await completePayment(payment)
    }

    // Otherwise, check payment status from Duitku API
    try {
      const duitkuStatus = await getDuitkuPaymentStatus(payment.dokuOrderId || '')
      console.log('[Payment Verify] Duitku status:', duitkuStatus)

      if (duitkuStatus.status === 'COMPLETED') {
        return await completePayment(payment, duitkuStatus.reference, duitkuStatus.paymentMethod)
      }

      // Return pending status
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

      // If resultCode is 00 but Duitku API failed, still complete the payment
      if (resultCode === '00') {
        console.log('[Payment Verify] Completing payment based on resultCode=00 despite API error')
        return await completePayment(payment)
      }

      // Return current payment status if Duitku check fails
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

  } catch (error) {
    console.error('[Payment Verify] Error:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment', success: false, status: 'ERROR' },
      { status: 500 }
    )
  }
}

/**
 * Complete a payment and activate subscription
 */
async function completePayment(
  payment: any,
  duitkuReference?: string,
  duitkuPaymentMethod?: string
) {
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
}
