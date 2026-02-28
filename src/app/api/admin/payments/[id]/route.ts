import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET /api/admin/payments/[id] - Get payment details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const admin = await verifyAdmin()
    if (admin instanceof NextResponse) {
      return admin
    }

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            subscription: true,
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Get related activity logs
    const activityLogs = await prisma.activityLog.findMany({
      where: {
        entityType: 'PAYMENT',
        entityId: params.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({
      payment,
      activityLogs,
    })
  } catch (error) {
    console.error('Error fetching payment details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment details' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/payments/[id] - Update payment status or process refund
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const admin = await verifyAdmin()
    if (admin instanceof NextResponse) {
      return admin
    }

    const body = await req.json()
    const { action, status, refundAmount, refundReason } = body

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        user: true,
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Handle refund action
    if (action === 'refund') {
      if (!payment.stripePaymentIntentId) {
        return NextResponse.json(
          { error: 'This payment cannot be refunded (no Stripe Payment Intent)' },
          { status: 400 }
        )
      }

      // Process refund through Stripe
      try {
        const refund = await stripe().refunds.create({
          payment_intent: payment.stripePaymentIntentId,
          amount: refundAmount ? Math.round(refundAmount * 100) : undefined, // Stripe uses cents
          reason: 'requested_by_customer',
          metadata: {
            refunded_by: admin.email,
            refund_reason: refundReason || 'Admin refund',
          },
        })

        // Update payment status
        const updatedPayment = await prisma.payment.update({
          where: { id: params.id },
          data: {
            status: 'REFUNDED',
            metadata: {
              ...payment.metadata,
              refundId: refund.id,
              refundedBy: admin.email,
              refundedAt: new Date().toISOString(),
              refundReason,
            },
          },
        })

        // Log the refund
        await prisma.activityLog.create({
          data: {
            userId: admin.id,
            action: 'PAYMENT_REFUNDED',
            entityType: 'PAYMENT',
            entityId: payment.id,
            details: `Refunded ${refundAmount || payment.amount} ${payment.currency}. Reason: ${refundReason || 'Admin refund'}`,
          },
        })

        // If user has subscription, handle subscription cancellation if needed
        if (payment.user?.subscriptionId) {
          await prisma.subscription.update({
            where: { stripeSubscriptionId: payment.user.subscriptionId },
            data: {
              status: 'CANCELED',
            },
          })
        }

        return NextResponse.json({
          payment: updatedPayment,
          refund,
        })
      } catch (stripeError: any) {
        console.error('Stripe refund error:', stripeError)
        return NextResponse.json(
          { error: stripeError.message || 'Failed to process refund' },
          { status: 500 }
        )
      }
    }

    // Handle status update
    if (status) {
      const updatedPayment = await prisma.payment.update({
        where: { id: params.id },
        data: { status },
      })

      // Log the status change
      await prisma.activityLog.create({
        data: {
          userId: admin.id,
          action: 'PAYMENT_STATUS_CHANGED',
          entityType: 'PAYMENT',
          entityId: payment.id,
          details: `Changed payment status from ${payment.status} to ${status}`,
        },
      })

      return NextResponse.json(updatedPayment)
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/payments/[id] - Delete payment (use with caution)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const admin = await verifyAdmin()
    if (admin instanceof NextResponse) {
      return admin
    }

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Don't allow deletion of completed payments (for audit trail)
    if (payment.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot delete completed payments. Use refund instead.' },
        { status: 400 }
      )
    }

    // Delete the payment
    await prisma.payment.delete({
      where: { id: params.id },
    })

    // Log the deletion
    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: 'PAYMENT_DELETED',
        entityType: 'PAYMENT',
        entityId: params.id,
        details: `Deleted payment ${payment.receiptNumber || payment.id}`,
      },
    })

    return NextResponse.json({ message: 'Payment deleted successfully' })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json(
      { error: 'Failed to delete payment' },
      { status: 500 }
    )
  }
}
