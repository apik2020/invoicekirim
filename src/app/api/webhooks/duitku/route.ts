import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createReceipt } from '@/lib/receipt-generator'
import { verifyDuitkuCallback } from '@/lib/duitku'
import crypto from 'crypto'

/**
 * Duitku Webhook Handler
 * Handles payment callbacks from Duitku
 *
 * Duitku sends callback with:
 * - merchantCode
 * - amount
 * - merchantOrderId
 * - productDetails
 * - additionalParam
 * - paymentCode
 * - resultCode
 * - signature
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Get Duitku callback parameters
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
    })

    // Find payment by order ID
    const payment = await prisma.payments.findFirst({
      where: { dokuOrderId: merchantOrderId }, // Using same field for compatibility
    })

    if (!payment) {
      console.error('[Duitku Webhook] Payment not found for order:', merchantOrderId)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
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
    // resultCode: 00 = Success, 01 = Pending, 02 = Failed/Expired
    if (resultCode === '00') {
      // Payment successful
      await prisma.payments.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          dokuTransactionId: paymentCode, // Store payment code as transaction ID
          paymentMethod: mapDuitkuPaymentMethod(paymentCode, additionalParam),
        },
      })

      // Get pricing plan info
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

      // Get existing subscription
      const existingSubscription = await prisma.subscriptions.findFirst({
        where: { userId: payment.userId },
        select: {
          id: true,
          status: true,
          trialStartsAt: true,
          trialEndsAt: true,
          pricingPlanId: true,
          stripeCurrentPeriodEnd: true,
        },
      })

      // Determine subscription updates
      const wasTrialing = existingSubscription?.status === 'TRIALING'
      const shouldClearTrialFields = wasTrialing

      // Calculate period end date (1 month from now)
      const periodEndDate = new Date()
      periodEndDate.setMonth(periodEndDate.getMonth() + 1)

      // Update or create subscription
      if (existingSubscription) {
        await prisma.subscriptions.update({
          where: { id: existingSubscription.id },
          data: {
            status: 'ACTIVE',
            planType: 'PRO',
            pricingPlanId: pricingPlan?.id || null,
            stripeCurrentPeriodEnd: periodEndDate,
            trialStartsAt: shouldClearTrialFields ? null : existingSubscription.trialStartsAt,
            trialEndsAt: shouldClearTrialFields ? null : existingSubscription.trialEndsAt,
            updatedAt: new Date(),
          },
        })
      } else {
        await prisma.subscriptions.create({
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
      await prisma.activity_logs.create({
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

      // Generate receipt
      try {
        await createReceipt(payment.id)
      } catch (receiptError) {
        console.error('[Duitku Webhook] Failed to generate receipt:', receiptError)
      }

      console.log('[Duitku Webhook] Payment completed successfully:', merchantOrderId)
      return NextResponse.json({ status: 'success' })
    }

    // Payment pending or failed
    if (resultCode === '01') {
      // Payment still pending
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
  // Duitku payment codes: BC=BCA, M1=Mandiri, B1=BNI, etc.
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

  // QRIS
  if (paymentCode === 'QP' || additionalParam?.includes('QRIS')) {
    return 'QRIS'
  }

  // Check VA mapping
  if (vaMapping[paymentCode]) {
    return vaMapping[paymentCode]
  }

  // Check e-wallet mapping
  if (ewalletMapping[paymentCode]) {
    return ewalletMapping[paymentCode]
  }

  return paymentCode
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    status: 'Duitku webhook endpoint is ready',
    message: 'Send POST requests to handle Duitku payment callbacks',
    expectedFields: [
      'merchantCode',
      'amount',
      'merchantOrderId',
      'productDetails',
      'paymentCode',
      'resultCode',
      'signature',
    ],
  })
}
