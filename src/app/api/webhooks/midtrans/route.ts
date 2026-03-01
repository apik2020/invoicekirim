import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyNotificationSignature, getTransactionStatus } from '@/lib/midtrans'
import { createReceipt } from '@/lib/receipt-generator'
import { logger } from '@/lib/logger'

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
    const payment = await prisma.payment.findFirst({
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
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            midtransTransactionId: body.transaction_id,
            paymentMethod: mapPaymentType(payment_type),
            vaNumber: va_numbers?.[0]?.va_number || payment.vaNumber,
            vaBank: va_numbers?.[0]?.bank?.toUpperCase() || payment.vaBank,
          },
        })

        // Update or create subscription
        const existingSubscription = await prisma.subscription.findFirst({
          where: { userId: payment.userId },
        })

        const periodEndDate = new Date()
        periodEndDate.setMonth(periodEndDate.getMonth() + 1)

        if (existingSubscription) {
          await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              planType: 'PRO',
              status: 'ACTIVE',
              stripeCurrentPeriodEnd: periodEndDate,
            },
          })
        } else {
          await prisma.subscription.create({
            data: {
              userId: payment.userId,
              planType: 'PRO',
              status: 'ACTIVE',
              stripeCurrentPeriodEnd: periodEndDate,
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
        await prisma.activityLog.create({
          data: {
            userId: payment.userId,
            action: 'UPDATED',
            entityType: 'Subscription',
            entityId: payment.userId,
            title: 'Berlangganan Pro',
            description: `Pembayaran berhasil via ${payment_type}`,
          },
        })

        logger.dev('Midtrans', 'Payment successful for order:', order_id)
      }
    } else if (transaction_status === 'pending') {
      // Payment pending
      await prisma.payment.update({
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
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
        },
      })

      logger.dev('Midtrans', 'Payment failed for order:', order_id)
    } else if (transaction_status === 'expire') {
      // Payment expired
      await prisma.payment.update({
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
