import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createReceipt } from '@/lib/receipt-generator'
import { verifyDOKUSignature } from '@/lib/doku'
import crypto from 'crypto'

/**
 * DOKU Webhook Handler
 * Handles payment notifications from DOKU
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Get DOKU headers
    const clientId = req.headers.get('client-id') || ''
    const signature = req.headers.get('signature') || ''
    const timestamp = req.headers.get('request-timestamp') || ''

    // Verify signature
    const requestBody = JSON.stringify(body)
    const isValidSignature = verifyDOKUSignature(requestBody, signature, timestamp, clientId)

    if (!isValidSignature) {
      console.error('DOKU: Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Get payment details from webhook data
    const {
      order: {
        invoice_number: orderId,
        amount: amount,
      },
      payment: {
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        checkout_method: checkoutMethod,
      },
      transaction: {
        transaction_id: transactionId,
        transaction_date: transactionDate,
      },
      metadata,
    } = body

    // Find payment by order ID
    const payment = await prisma.payments.findFirst({
      where: { dokuOrderId: orderId },
    })

    if (!payment) {
      console.error('DOKU: Payment not found for order:', orderId)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Handle payment statuses
    if (paymentStatus === 'PAYMENT_SUCCESS' || paymentStatus === 'SUCCESS') {
      // Payment successful
      await prisma.payments.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          dokuTransactionId: transactionId,
          paymentMethod: mapDOKUPaymentMethod(paymentMethod),
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
          description: `Pembayaran ${pricingPlan?.name} berhasil melalui DOKU`,
          metadata: {
            paymentMethod: paymentMethod,
            transactionId,
            pricingPlan: pricingPlan?.name,
            amount: amount.toString(),
          },
        },
      })

      // Generate receipt
      try {
        const receiptPdf = await createReceipt(payment.id)

        await prisma.payments.update({
          where: { id: payment.id },
          data: { receiptUrl: receiptPdf },
        })
      } catch (receiptError) {
        console.error('Failed to generate receipt:', receiptError)
      }

      return NextResponse.json({ status: 'success' })
    }

    if (paymentStatus === 'PAYMENT_FAILED' || paymentStatus === 'FAILED') {
      // Payment failed
      await prisma.payments.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          dokuTransactionId: transactionId,
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
          description: `Pembayaran melalui DOKU gagal`,
          metadata: {
            paymentMethod: paymentMethod,
            transactionId,
          },
        },
      })

      return NextResponse.json({ status: 'failed' })
    }

    return NextResponse.json({ status: 'received' })
  } catch (error) {
    console.error('DOKU webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Helper function to map DOKU payment methods to our internal format
function mapDOKUPaymentMethod(dokuMethod: string): string {
  const mapping: Record<string, string> = {
    'VIRTUAL_ACCOUNT_BCA': 'VA_BCA',
    'VIRTUAL_ACCOUNT_MANDIRI': 'VA_MANDIRI',
    'VIRTUAL_ACCOUNT_BNI': 'VA_BNI',
    'VIRTUAL_ACCOUNT_BRI': 'VA_BRI',
    'VIRTUAL_ACCOUNT_CIMB': 'VA_CIMB',
    'VIRTUAL_ACCOUNT_PERMATA': 'VA_PERMATA',
    'QRIS': 'QRIS',
    'CREDIT_CARD': 'CREDIT_CARD',
    'OVO': 'E_WALLET_OVO',
    'DANA': 'E_WALLET_DANA',
    'SHOPEEPAY': 'E_WALLET_SHOPEEPAY',
    'LINKAJA': 'E_WALLET_LINKAJA',
  }

  return mapping[dokuMethod] || dokuMethod
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    status: 'DOKU webhook endpoint is ready',
    message: 'Send POST requests to handle DOKU payment notifications',
  })
}
