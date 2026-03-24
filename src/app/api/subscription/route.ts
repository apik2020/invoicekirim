import { NextRequest, NextResponse } from 'next/server'
import { getUserSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { getUserSubscriptionLimits } from '@/lib/subscription-limits'

export async function GET(_req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await prisma.subscriptions.findUnique({
      where: { userId: session.id },
    })

    if (!subscription) {
      // Check if user exists first
      const user = await prisma.users.findUnique({
        where: { id: session.id },
        select: { id: true },
      })

      if (!user) {
        // User doesn't exist in database (might be OAuth only session)
        // Return default free subscription without creating DB record
        return NextResponse.json({
          id: 'default',
          userId: session.id,
          planType: 'FREE',
          status: 'FREE',
          invoiceLimit: 10,
          invoiceCount: 0,
          isTrial: false,
          trialDaysLeft: 0,
        })
      }

      // Create default subscription with 7-day trial
      const now = new Date()
      const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const newSubscription = await prisma.subscriptions.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          status: 'TRIALING',
          planType: 'PRO',
          trialStartsAt: now,
          trialEndsAt: trialEndsAt,
          updatedAt: new Date(),
        },
      })

      // Calculate trial days left
      const trialDaysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      return NextResponse.json({
        ...newSubscription,
        invoiceLimit: -1, // Unlimited during trial
        invoiceCount: 0,
        isTrial: true,
        trialDaysLeft,
      })
    }

    // Check if trial has expired
    if (subscription.status === 'TRIALING' && subscription.trialEndsAt) {
      const now = new Date()
      if (now > subscription.trialEndsAt) {
        // Trial expired, downgrade to FREE
        const updatedSubscription = await prisma.subscriptions.update({
          where: { id: subscription.id },
          data: {
            status: 'FREE',
            planType: 'FREE',
          },
        })
        subscription.status = updatedSubscription.status
        subscription.planType = updatedSubscription.planType
      }
    }

    // Get dynamic subscription limits from pricing_plans
    const limits = await getUserSubscriptionLimits(session.id)
    const isTrial = subscription.status === 'TRIALING'
    let trialDaysLeft = 0

    // Calculate trial days left
    if (isTrial && subscription.trialEndsAt) {
      const now = new Date()
      const diffMs = subscription.trialEndsAt.getTime() - now.getTime()
      trialDaysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
    }

    // Calculate current month's invoice count
    let invoiceCount = 0
    if (limits.invoiceLimit !== -1) {
      invoiceCount = await prisma.invoices.count({
        where: {
          userId: session.id,
          createdAt: {
            gte: new Date(new Date().setDate(1)), // Start of current month
          },
        },
      })
    }

    return NextResponse.json({
      ...subscription,
      invoiceCount,
      invoiceLimit: limits.invoiceLimit,
      planName: limits.planName,
      isTrial,
      trialDaysLeft,
    })
  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil subscription' },
      { status: 500 }
    )
  }
}
