import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import {
  sendTrialExpiredEmail,
  sendTrialExpiringSoonEmail,
  sendTrialWarningEmail,
} from '@/lib/email'

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

    // === CONCURRENCY GUARD ===
    // Use a lightweight DB-based lock to prevent concurrent execution
    const lockId = `trial-expiration-${new Date().toISOString().split('T')[0]}`
    const existingLock = await prisma.activity_logs.findFirst({
      where: {
        action: 'CRON_LOCK',
        entityType: 'trial_expiration',
        entityId: lockId,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) }, // Lock valid for 10 min
      },
    })

    if (existingLock) {
      return NextResponse.json({
        success: true,
        message: 'Trial expiration already processed recently',
        skipped: true,
      })
    }

    // Create lock entry
    await prisma.activity_logs.create({
      data: {
        id: crypto.randomUUID(),
        userId: 'system',
        action: 'CRON_LOCK',
        entityType: 'trial_expiration',
        entityId: lockId,
        title: 'Trial expiration cron lock',
        description: 'Processing started',
      },
    })

    const now = new Date()
    let expiredCount = 0
    let reminderCount = 0
    const dashboardUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // 1. Find and expire trials that have ended
    const expiredTrials = await prisma.subscriptions.findMany({
      where: {
        status: 'TRIALING',
        trialEndsAt: {
          lt: now,
        },
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    for (const subscription of expiredTrials) {
      const user = subscription.users

      // Downgrade to FREE
      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: {
          status: 'FREE',
          planType: 'FREE',
        },
      })

      // Log activity
      await prisma.activity_logs.create({
        data: {
          id: crypto.randomUUID(),
          userId: subscription.userId,
          action: 'UPDATED',
          entityType: 'Subscription',
          entityId: subscription.id,
          title: 'Trial Expired',
          description: 'Trial period has expired, downgraded to FREE plan',
        },
      })

      // Send email notification about trial expiration
      if (user?.email) {
        try {
          await sendTrialExpiredEmail({
            to: user.email,
            userName: user.name || 'Pengguna',
            dashboardUrl: `${dashboardUrl}/dashboard/settings/billing`,
          })
          logger.dev('Cron', `Trial expired email sent to: ${user.email}`)
        } catch (emailError) {
          logger.error(`Failed to send trial expired email to ${user.email}:`, emailError)
        }
      }

      expiredCount++
    }

    // 2. Send reminders for trials expiring in 1 day (if not already sent)
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const trialsExpiringSoon = await prisma.subscriptions.findMany({
      where: {
        status: 'TRIALING',
        trialEndsAt: {
          gt: now,
          lt: oneDayFromNow,
        },
        trialSentReminder: false,
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    for (const subscription of trialsExpiringSoon) {
      const user = subscription.users

      // Mark reminder as sent
      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: {
          trialSentReminder: true,
        },
      })

      // Send email reminder about trial expiring in 1 day
      if (user?.email) {
        try {
          await sendTrialExpiringSoonEmail({
            to: user.email,
            userName: user.name || 'Pengguna',
            daysLeft: 1,
            expiryDate: subscription.trialEndsAt?.toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }) || '',
            dashboardUrl: `${dashboardUrl}/dashboard/settings/billing`,
          })
          logger.dev('Cron', `Trial reminder (1 day) sent to: ${user.email}`)
        } catch (emailError) {
          logger.error(`Failed to send trial reminder to ${user.email}:`, emailError)
        }
      }

      reminderCount++
    }

    // 3. Send reminders for trials expiring in 3 days
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)

    const trialsExpiringIn3Days = await prisma.subscriptions.findMany({
      where: {
        status: 'TRIALING',
        trialEndsAt: {
          gt: twoDaysFromNow,
          lt: threeDaysFromNow,
        },
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    for (const subscription of trialsExpiringIn3Days) {
      const user = subscription.users

      // Send 3-day warning email
      if (user?.email) {
        try {
          await sendTrialWarningEmail({
            to: user.email,
            userName: user.name || 'Pengguna',
            daysLeft: 3,
            expiryDate: subscription.trialEndsAt?.toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }) || '',
            dashboardUrl: `${dashboardUrl}/dashboard/settings/billing`,
          })
          logger.dev('Cron', `3-day trial warning sent to: ${user.email}`)
        } catch (emailError) {
          logger.error(`Failed to send 3-day warning to ${user.email}:`, emailError)
        }
      }
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
