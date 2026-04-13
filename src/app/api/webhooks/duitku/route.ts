import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createReceipt } from '@/lib/receipt-generator'
import { verifyDuitkuCallback } from '@/lib/duitku'
import crypto from 'crypto'

/**
 * Duitku Webhook Handler
 * Handles payment callbacks from Duitku with idempotency protection
 */
export async function POST(req: NextRequest) {
  try {
    // Duitku sends callback as form-urlencoded, not JSON
    const contentType = req.headers.get('content-type') || ''
    let body: Record<string, string>

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData()
      body = {}
      formData.forEach((value, key) => {
        body[key] = value.toString()
      })
    } else {
      body = await req.json()
    }

    const {
      merchantCode,
      amount,
      merchantOrderId,
      productDetails,
      additionalParam,
      paymentCode,
      resultCode,
      signature,
    } = body

    console.log('[Duitku Webhook] Received callback:', {
      merchantCode,
      merchantOrderId,
      amount,
      resultCode,
      paymentCode,
      contentType,
    })

    // Find payment by order ID
    const payment = await prisma.payments.findFirst({
      where: { dokuOrderId: merchantOrderId },
    })

    if (!payment) {
      console.error('[Duitku Webhook] Payment not found for order:', merchantOrderId)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // === IDEMPOTENCY CHECK ===
    // If payment is already COMPLETED, return success without reprocessing
    if (payment.status === 'COMPLETED') {
      console.log('[Duitku Webhook] Payment already completed, skipping:', merchantOrderId)
      return NextResponse.json({ status: 'success', message: 'Already processed' })
    }

    // Verify signature
    const isValidSignature = verifyDuitkuCallback(
      merchantOrderId,
      parseFloat(amount),
      signature
    )

    if (!isValidSignature) {
      console.error('[Duitku Webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Handle payment result
    if (resultCode === '00') {
      // === TRANSACTION: Payment update + subscription activation ===
      await prisma.$transaction(async (tx) => {
        // Update payment status
        await tx.payments.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            dokuTransactionId: paymentCode,
            paymentMethod: mapDuitkuPaymentMethod(paymentCode, additionalParam),
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
                price: true,
                trialDays: true,
              },
            })
          : null

        // Calculate period end date
        const periodEndDate = new Date()
        periodEndDate.setMonth(periodEndDate.getMonth() + 1)

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

        if (existingSubscription) {
          await tx.subscriptions.update({
            where: { id: existingSubscription.id },
            data: {
              status: 'ACTIVE',
              planType: 'PRO',
              pricingPlanId: pricingPlan?.id || null,
              stripeCurrentPeriodEnd: periodEndDate,
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
              updatedAt: new Date(),
            },
          })
        }

        // Log activity
        await tx.activity_logs.create({
          data: {
            id: crypto.randomUUID(),
            userId: payment.userId,
            action: 'CREATED',
            entityType: 'Subscription',
            entityId: payment.id,
            title: 'Pembayaran Berhasil - Langganan Pro Aktif',
            description: `Pembayaran ${pricingPlan?.name} berhasil melalui Duitku`,
            metadata: {
              paymentMethod: paymentCode,
              transactionId: paymentCode,
              pricingPlan: pricingPlan?.name,
              amount: amount,
            },
          },
        })
      })

      // Generate receipt (outside transaction — non-critical)
      try {
        await createReceipt(payment.id)
      } catch (receiptError) {
        console.error('[Duitku Webhook] Failed to generate receipt:', receiptError)
      }

      console.log('[Duitku Webhook] Payment completed successfully:', merchantOrderId)
      return NextResponse.json({ status: 'success' })
    }

    // Payment pending
    if (resultCode === '01') {
      return NextResponse.json({ status: 'pending' })
    }

    // resultCode 02 or others = Failed/Expired
    await prisma.payments.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        dokuTransactionId: paymentCode,
      },
    })

    // Log failed payment
    await prisma.activity_logs.create({
      data: {
        id: crypto.randomUUID(),
        userId: payment.userId,
        action: 'CREATED',
        entityType: 'Payment',
        entityId: payment.id,
        title: 'Pembayaran Gagal',
        description: `Pembayaran melalui Duitku gagal (resultCode: ${resultCode})`,
        metadata: {
          paymentMethod: paymentCode,
          transactionId: paymentCode,
          resultCode,
        },
      },
    })

    console.log('[Duitku Webhook] Payment failed:', merchantOrderId, resultCode)
    return NextResponse.json({ status: 'failed' })
  } catch (error) {
    console.error('[Duitku Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Helper function to map Duitku payment methods
function mapDuitkuPaymentMethod(paymentCode: string, additionalParam?: string): string {
  const vaMapping: Record<string, string> = {
    'BC': 'VA_BCA',
    'M1': 'VA_MANDIRI',
    'B1': 'VA_BNI',
    'BR': 'VA_BRI',
    'C1': 'VA_CIMB',
    'A1': 'VA_PERMATA',
    'B2': 'VA_DANAMON',
    'D1': 'VA_DIGIBANK',
  }

  const ewalletMapping: Record<string, string> = {
    'OV': 'E_WALLET_OVO',
    'DA': 'E_WALLET_DANA',
    'SP': 'E_WALLET_SHOPEEPAY',
    'GQ': 'E_WALLET_GOPAY',
  }

  if (paymentCode === 'QP' || additionalParam?.includes('QRIS')) {
    return 'QRIS'
  }

  if (vaMapping[paymentCode]) return vaMapping[paymentCode]
  if (ewalletMapping[paymentCode]) return ewalletMapping[paymentCode]

  return paymentCode
}
