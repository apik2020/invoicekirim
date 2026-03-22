import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest) {
  try {
    const session = await getUserSession()

    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's subscription
    const subscription = await prisma.subscriptions.findUnique({
      where: { userId: session.id },
    })

    if (!subscription?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Cancel subscription at period end via Stripe
    const stripeSubscription = await stripe().subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    )

    // Update in database
    await prisma.subscriptions.update({
      where: { userId: session.id },
      data: {
        status: 'CANCELED',
      },
    })

    return NextResponse.json({
      message: 'Subscription will be canceled at period end',
      cancelAt: new Date((stripeSubscription as any).current_period_end * 1000),
    })
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
