import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

// Cron job to handle trial expiration
// Should be called daily by Vercel Cron or external scheduler

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    let expiredCount = 0
    let reminderCount = 0

    // 1. Find and expire trials that have ended
    const expiredTrials = await prisma.subscription.findMany({
      where: {
        status: 'TRIALING',
        trialEndsAt: {
          lt: now,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    for (const subscription of expiredTrials) {
      // Downgrade to FREE
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'FREE',
          planType: 'FREE',
        },
      })

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: subscription.userId,
          action: 'UPDATED',
          entityType: 'Subscription',
          entityId: subscription.id,
          title: 'Trial Expired',
          description: 'Trial period has expired, downgraded to FREE plan',
        },
      })

      // TODO: Send email notification about trial expiration
      logger.dev('Cron', `Trial expired for user: ${subscription.user.email}`)

      expiredCount++
    }

    // 2. Send reminders for trials expiring in 1 day (if not already sent)
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const trialsExpiringSoon = await prisma.subscription.findMany({
      where: {
        status: 'TRIALING',
        trialEndsAt: {
          gt: now,
          lt: oneDayFromNow,
        },
        trialSentReminder: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    for (const subscription of trialsExpiringSoon) {
      // Mark reminder as sent
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          trialSentReminder: true,
        },
      })

      // TODO: Send email reminder about trial expiring
      logger.dev('Cron', `Trial reminder for user: ${subscription.user.email}`)

      reminderCount++
    }

    // 3. Send reminders for trials expiring in 3 days
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)

    const trialsExpiringIn3Days = await prisma.subscription.findMany({
      where: {
        status: 'TRIALING',
        trialEndsAt: {
          gt: twoDaysFromNow,
          lt: threeDaysFromNow,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    for (const subscription of trialsExpiringIn3Days) {
      // TODO: Send 3-day warning email
      logger.dev('Cron', `3-day trial warning for user: ${subscription.user.email}`)
      reminderCount++
    }

    return NextResponse.json({
      success: true,
      expiredCount,
      reminderCount,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    logger.error('Trial expiration cron error:', error)
    return NextResponse.json(
      { error: 'Failed to process trial expirations' },
      { status: 500 }
    )
  }
}
