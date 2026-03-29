import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyNotificationSignature } from '@/lib/midtrans'
import { createReceipt } from '@/lib/receipt-generator'
import { logger } from '@/lib/logger'
import { PlanType, SubscriptionStatus } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      va_numbers,
    } = body

    // Verify signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY || ''
    const isValidSignature = verifyNotificationSignature(
      order_id,
      status_code,
      gross_amount,
      serverKey,
      signature_key
    )

    if (!isValidSignature) {
      console.error('Invalid signature for order:', order_id)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Find payment by order ID
    const payment = await prisma.payments.findFirst({
      where: { midtransOrderId: order_id },
    })

    if (!payment) {
      console.error('Payment not found for order:', order_id)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Handle different transaction statuses
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      // Payment successful
      if (fraud_status === 'accept' || !fraud_status) {
        // Update payment status
        await prisma.payments.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            midtransTransactionId: body.transaction_id,
            paymentMethod: mapPaymentType(payment_type),
            vaNumber: va_numbers?.[0]?.va_number || payment.vaNumber,
            vaBank: va_numbers?.[0]?.bank?.toUpperCase() || payment.vaBank,
          },
        })

        // Get pricing plan info if available
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

        // Get existing subscription to check if upgrading from trial
        const existingSubscription = await prisma.subscriptions.findFirst({
          where: { userId: payment.userId },
          select: {
            id: true,
            status: true,
            trialStartsAt: true,
            trialEndsAt: true,
            pricingPlanId: true,
          },
        })

        // Determine if we need to clear trial fields
        const wasTrialing = existingSubscription?.status === 'TRIALING'
        const shouldClearTrialFields = wasTrialing

        // Calculate period end date (1 month from now for paid plans)
        let periodEndDate: Date | null = null
        let planType: PlanType = 'PRO'
        let subscriptionStatus: SubscriptionStatus = 'ACTIVE'

        if (pricingPlan?.slug === 'plan-pro-trial') {
          // Trial plan - set trial dates
          const trialStartsAt = new Date()
          const trialEndsAt = new Date(trialStartsAt)
          trialEndsAt.setDate(trialEndsAt.getDate() + (pricingPlan.trialDays || 7))

          periodEndDate = trialEndsAt
          planType = 'PRO'
          subscriptionStatus = 'TRIALING'
        } else {
          // Paid plan - set period end to 1 month from now
          periodEndDate = new Date()
          periodEndDate.setMonth(periodEndDate.getMonth() + 1)
          planType = 'PRO'
          subscriptionStatus = 'ACTIVE'
        }

        // Update or create subscription
        if (existingSubscription) {
          await prisma.subscriptions.update({
            where: { id: existingSubscription.id },
            data: {
              planType,
              status: subscriptionStatus,
              pricingPlanId: pricingPlan?.id || existingSubscription.pricingPlanId,
              stripeCurrentPeriodEnd: periodEndDate,
              // Set trial dates for trial plan
              trialStartsAt: pricingPlan?.slug === 'plan-pro-trial'
                ? new Date()
                : (shouldClearTrialFields ? null : existingSubscription.trialStartsAt),
              trialEndsAt: pricingPlan?.slug === 'plan-pro-trial'
                ? periodEndDate
                : (shouldClearTrialFields ? null : existingSubscription.trialEndsAt),
            },
          })
        } else {
          await prisma.subscriptions.create({
            data: {
              id: crypto.randomUUID(),
              userId: payment.userId,
              planType,
              status: subscriptionStatus,
              pricingPlanId: pricingPlan?.id || null,
              stripeCurrentPeriodEnd: periodEndDate,
              trialStartsAt: pricingPlan?.slug === 'plan-pro-trial' ? new Date() : null,
              trialEndsAt: pricingPlan?.slug === 'plan-pro-trial' ? periodEndDate : null,
              updatedAt: new Date(),
            },
          })
        }

        // Generate receipt
        try {
          await createReceipt(payment.id)
        } catch (receiptError) {
          console.error('Failed to generate receipt:', receiptError)
        }

        // Log activity
        await prisma.activity_logs.create({
          data: {
            id: crypto.randomUUID(),
            userId: payment.userId,
            action: 'UPDATED',
            entityType: 'Subscription',
            entityId: payment.userId,
            title: pricingPlan?.slug === 'plan-pro-trial' ? 'Trial PRO Dimulai' : 'Berlangganan Pro',
            description: `Pembayaran berhasil via ${payment_type}${wasTrialing ? ' setelah trial' : ''}`,
            metadata: {
              pricingPlanId: pricingPlan?.id,
              pricingPlanSlug: pricingPlan?.slug,
              upgradedFromTrial: wasTrialing,
            },
          },
        })

        logger.dev('Midtrans', 'Payment successful for order:', order_id)
      }
    } else if (transaction_status === 'pending') {
      // Payment pending
      await prisma.payments.update({
        where: { id: payment.id },
        data: {
          status: 'PENDING',
          vaNumber: va_numbers?.[0]?.va_number || payment.vaNumber,
          vaBank: va_numbers?.[0]?.bank?.toUpperCase() || payment.vaBank,
        },
      })

      logger.dev('Midtrans', 'Payment pending for order:', order_id)
    } else if (transaction_status === 'deny' || transaction_status === 'cancel') {
      // Payment denied or cancelled
      await prisma.payments.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
        },
      })

      logger.dev('Midtrans', 'Payment failed for order:', order_id)
    } else if (transaction_status === 'expire') {
      // Payment expired
      await prisma.payments.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
        },
      })

      logger.dev('Midtrans', 'Payment expired for order:', order_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Map Midtrans payment types to our internal format
function mapPaymentType(paymentType: string): string {
  const mapping: Record<string, string> = {
    bank_transfer: 'BANK_TRANSFER',
    qris: 'QRIS',
    gopay: 'EWALLET',
    shopeepay: 'EWALLET',
    ovo: 'EWALLET',
    dana: 'EWALLET',
    credit_card: 'CREDIT_CARD',
  }
  return mapping[paymentType] || paymentType.toUpperCase()
}
