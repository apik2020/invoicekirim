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

    // === IDEMPOTENCY CHECK ===
    if (payment.status === 'COMPLETED') {
      logger.dev('Midtrans', 'Payment already completed, skipping:', order_id)
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    // Handle different transaction statuses
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (fraud_status === 'accept' || !fraud_status) {
        // === TRANSACTION: Payment + Subscription in atomic operation ===
        await prisma.$transaction(async (tx) => {
          // Update payment status
          await tx.payments.update({
            where: { id: payment.id },
            data: {
              status: 'COMPLETED',
              midtransTransactionId: body.transaction_id,
              paymentMethod: mapPaymentType(payment_type),
              vaNumber: va_numbers?.[0]?.va_number || payment.vaNumber,
              vaBank: va_numbers?.[0]?.bank?.toUpperCase() || payment.vaBank,
            },
          })

          // Get pricing plan info
          const pricingPlan = payment.pricingPlanId
            ? await tx.pricing_plans.findUnique({
                where: { id: payment.pricingPlanId },
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  trialDays: true,
                },
              })
            : null

          // Determine billing cycle from payment metadata
          const paymentBillingCycle = (payment.metadata as Record<string, unknown>)?.billingCycle as string || 'monthly'

          // Get existing subscription
          const existingSubscription = await tx.subscriptions.findFirst({
            where: { userId: payment.userId },
            select: {
              id: true,
              status: true,
              trialStartsAt: true,
              trialEndsAt: true,
              pricingPlanId: true,
            },
          })

          const wasTrialing = existingSubscription?.status === 'TRIALING'
          const shouldClearTrialFields = wasTrialing

          let periodEndDate: Date | null = null
          let planType: PlanType = 'PRO'
          let subscriptionStatus: SubscriptionStatus = 'ACTIVE'

          periodEndDate = new Date()
          if (paymentBillingCycle === 'yearly') {
            periodEndDate.setFullYear(periodEndDate.getFullYear() + 1)
          } else {
            periodEndDate.setMonth(periodEndDate.getMonth() + 1)
          }

          if (existingSubscription) {
            await tx.subscriptions.update({
              where: { id: existingSubscription.id },
              data: {
                planType,
                status: subscriptionStatus,
                pricingPlanId: pricingPlan?.id || existingSubscription.pricingPlanId,
                stripeCurrentPeriodEnd: periodEndDate,
                billingCycle: paymentBillingCycle === 'yearly' ? 'YEARLY' : 'MONTHLY',
                trialStartsAt: false
                  ? new Date()
                  : (shouldClearTrialFields ? null : existingSubscription.trialStartsAt),
                trialEndsAt: false
                  ? periodEndDate
                  : (shouldClearTrialFields ? null : existingSubscription.trialEndsAt),
              },
            })
          } else {
            await tx.subscriptions.create({
              data: {
                id: crypto.randomUUID(),
                userId: payment.userId,
                planType,
                status: subscriptionStatus,
                pricingPlanId: pricingPlan?.id || null,
                stripeCurrentPeriodEnd: periodEndDate,
                billingCycle: paymentBillingCycle === 'yearly' ? 'YEARLY' : 'MONTHLY',
                trialStartsAt: false ? new Date() : null,
                trialEndsAt: false ? periodEndDate : null,
                updatedAt: new Date(),
              },
            })
          }

          // Log activity
          await tx.activity_logs.create({
            data: {
              id: crypto.randomUUID(),
              userId: payment.userId,
              action: 'UPDATED',
              entityType: 'Subscription',
              entityId: payment.userId,
              title: false ? 'Trial PRO Dimulai' : 'Berlangganan Pro',
              description: `Pembayaran berhasil via ${payment_type}${wasTrialing ? ' setelah trial' : ''}`,
              metadata: {
                pricingPlanId: pricingPlan?.id,
                pricingPlanSlug: pricingPlan?.slug,
                upgradedFromTrial: wasTrialing,
              },
            },
          })
        })

        // Generate receipt (outside transaction — non-critical)
        try {
          await createReceipt(payment.id)
        } catch (receiptError) {
          console.error('Failed to generate receipt:', receiptError)
        }

        logger.dev('Midtrans', 'Payment successful for order:', order_id)
      }
    } else if (transaction_status === 'pending') {
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
      await prisma.payments.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      })

      logger.dev('Midtrans', 'Payment failed for order:', order_id)
    } else if (transaction_status === 'expire') {
      await prisma.payments.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
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
