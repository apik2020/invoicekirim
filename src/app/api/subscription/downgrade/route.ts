import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (!subscription?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Cancel subscription at period end via Stripe
    await stripe().subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })

    // Update in database immediately (will take effect at period end)
    await prisma.subscription.update({
      where: { userId: session.user.id },
      data: {
        status: 'CANCELED',
        planType: 'FREE',
      },
    })

    return NextResponse.json({
      message: 'Subscription will be downgraded to FREE at period end',
      planType: 'FREE',
    })
  } catch (error) {
    console.error('Error downgrading subscription:', error)
    return NextResponse.json(
      { error: 'Failed to downgrade subscription' },
      { status: 500 }
    )
  }
}
