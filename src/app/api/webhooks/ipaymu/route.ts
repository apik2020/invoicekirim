import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createReceipt } from '@/lib/receipt-generator'
import { getPaymentGateway } from '@/lib/payment'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

/**
 * iPaymu Webhook Handler
 * Handles payment callbacks from iPaymu with idempotency protection
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      trx_id,
      sid,
      reference_id,
      status,
      status_code,
      total,
      sub_total,
      fee,
      via,
      channel,
      signature,
    } = body

    logger.dev('iPaymu Webhook', 'Received callback:', {
      trx_id,
      reference_id,
      status,
      status_code,
      via,
      channel,
    })

    if (!reference_id) {
      logger.error('[iPaymu Webhook] Missing reference_id')
      return NextResponse.json({ error: 'Missing reference_id' }, { status: 400 })
    }

    // Find payment by order ID (stored in dokuOrderId)
    const payment = await prisma.payments.findFirst({
      where: { dokuOrderId: reference_id },
    })

    if (!payment) {
      logger.error('[iPaymu Webhook] Payment not found for order:', reference_id)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // === IDEMPOTENCY CHECK ===
    if (payment.status === 'COMPLETED') {
      logger.dev('iPaymu Webhook', 'Payment already completed, skipping:', reference_id)
      return NextResponse.json({ status: 'success', message: 'Already processed' })
    }

    // Verify callback signature
    const gateway = getPaymentGateway()
    const verification = gateway.verifyCallback(body)

    if (!verification.isValid) {
      logger.error('[iPaymu Webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Handle based on status
    if (verification.status === 'COMPLETED') {
      // === TRANSACTION: Payment update + subscription activation ===
      await prisma.$transaction(async (tx) => {
        await tx.payments.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            dokuTransactionId: trx_id || verification.transactionId,
            gatewaySessionId: sid || payment.gatewaySessionId,
            paymentMethod: mapIpaymuPaymentMethod(via, channel),
          },
        })

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

        const paymentBillingCycle = (payment.metadata as Record<string, unknown>)?.billingCycle as string || 'monthly'

        const periodEndDate = new Date()
        if (paymentBillingCycle === 'yearly') {
          periodEndDate.setFullYear(periodEndDate.getFullYear() + 1)
        } else {
          periodEndDate.setMonth(periodEndDate.getMonth() + 1)
        }

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

        if (existingSubscription) {
          await tx.subscriptions.update({
            where: { id: existingSubscription.id },
            data: {
              status: 'ACTIVE',
              planType: 'PRO',
              pricingPlanId: pricingPlan?.id || null,
              stripeCurrentPeriodEnd: periodEndDate,
              billingCycle: paymentBillingCycle === 'yearly' ? 'YEARLY' : 'MONTHLY',
              trialStartsAt: wasTrialing ? null : existingSubscription.trialStartsAt,
              trialEndsAt: wasTrialing ? null : existingSubscription.trialEndsAt,
              updatedAt: new Date(),
            },
          })
        } else {
          await tx.subscriptions.create({
            data: {
              id: crypto.randomUUID(),
              userId: payment.userId,
              status: 'ACTIVE',
              planType: 'PRO',
              pricingPlanId: pricingPlan?.id || null,
              stripeCurrentPeriodEnd: periodEndDate,
              billingCycle: paymentBillingCycle === 'yearly' ? 'YEARLY' : 'MONTHLY',
              updatedAt: new Date(),
            },
          })
        }

        await tx.activity_logs.create({
          data: {
            id: crypto.randomUUID(),
            userId: payment.userId,
            action: 'CREATED',
            entityType: 'Subscription',
            entityId: payment.id,
            title: 'Pembayaran Berhasil - Langganan Pro Aktif',
            description: `Pembayaran ${pricingPlan?.name} berhasil melalui iPaymu`,
            metadata: {
              paymentMethod: via,
              channel,
              transactionId: trx_id,
              pricingPlan: pricingPlan?.name,
              amount: total,
            },
          },
        })
      })

      // Generate receipt (outside transaction — non-critical)
      try {
        await createReceipt(payment.id)
      } catch (receiptError) {
        logger.error('[iPaymu Webhook] Failed to generate receipt:', receiptError)
      }

      logger.dev('iPaymu Webhook', 'Payment completed successfully:', reference_id)
      return NextResponse.json({ status: 'success' })
    }

    // Payment still pending
    if (verification.status === 'PENDING') {
      return NextResponse.json({ status: 'pending' })
    }

    // EXPIRED or FAILED
    await prisma.payments.update({
      where: { id: payment.id },
      data: {
        status: verification.status === 'EXPIRED' ? 'EXPIRED' : 'FAILED',
        dokuTransactionId: trx_id,
      },
    })

    await prisma.activity_logs.create({
      data: {
        id: crypto.randomUUID(),
        userId: payment.userId,
        action: 'CREATED',
        entityType: 'Payment',
        entityId: payment.id,
        title: 'Pembayaran Gagal',
        description: `Pembayaran melalui iPaymu gagal (status_code: ${status_code})`,
        metadata: {
          paymentMethod: via,
          channel,
          transactionId: trx_id,
          statusCode: status_code,
        },
      },
    })

    logger.dev('iPaymu Webhook', 'Payment failed:', reference_id, status_code)
    return NextResponse.json({ status: 'failed' })
  } catch (error) {
    logger.apiError('/api/webhooks/ipaymu POST', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

function mapIpaymuPaymentMethod(via?: string, channel?: string): string {
  if (!via && !channel) return 'UNKNOWN'

  const viaLower = (via || '').toLowerCase()
  const channelLower = (channel || '').toLowerCase()

  if (channelLower.includes('qris') || viaLower.includes('qris')) return 'QRIS'

  const vaMapping: Record<string, string> = {
    'bca': 'VA_BCA',
    'bni': 'VA_BNI',
    'bri': 'VA_BRI',
    'mandiri': 'VA_MANDIRI',
    'permata': 'VA_PERMATA',
    'cimb': 'VA_CIMB',
    'bsi': 'VA_BSI',
  }

  if (vaMapping[channelLower]) return vaMapping[channelLower]
  if (vaMapping[viaLower]) return vaMapping[viaLower]

  return via || channel || 'UNKNOWN'
}
