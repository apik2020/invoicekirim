import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (!subscription) {
      // Check if user exists first
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true },
      })

      if (!user) {
        // User doesn't exist in database (might be OAuth only session)
        // Return default free subscription without creating DB record
        return NextResponse.json({
          id: 'default',
          userId: session.user.id,
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

      const newSubscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          status: 'TRIALING',
          planType: 'PRO',
          trialStartsAt: now,
          trialEndsAt: trialEndsAt,
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
        const updatedSubscription = await prisma.subscription.update({
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

    // Calculate current month's invoice count for free users
    let invoiceCount = 0
    let invoiceLimit = 10
    let isTrial = subscription.status === 'TRIALING'
    let trialDaysLeft = 0

    if (subscription.planType === 'FREE' && subscription.status !== 'TRIALING') {
      invoiceCount = await prisma.invoice.count({
        where: {
          userId: session.user.id,
          createdAt: {
            gte: new Date(new Date().setDate(1)), // Start of current month
          },
        },
      })
    } else {
      invoiceLimit = -1 // Unlimited for PRO and TRIALING
    }

    // Calculate trial days left
    if (isTrial && subscription.trialEndsAt) {
      const now = new Date()
      const diffMs = subscription.trialEndsAt.getTime() - now.getTime()
      trialDaysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
    }

    return NextResponse.json({
      ...subscription,
      invoiceCount,
      invoiceLimit,
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
