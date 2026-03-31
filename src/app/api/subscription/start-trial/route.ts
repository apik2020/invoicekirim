import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, apiRateLimit } from '@/lib/rate-limit'

export async function POST(_req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting check for trial activation
    const rateLimit = await checkRateLimit(`trial-start:${session.id}`, apiRateLimit)

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Terlalu banyak percobaan. Silakan coba lagi dalam 1 jam.',
        },
        { status: 429 }
      )
    }

    // Check if user already has a subscription
    const existingSubscription = await prisma.subscriptions.findUnique({
      where: { userId: session.id },
    })

    if (!existingSubscription) {
      // Create new trial subscription
      const now = new Date()
      const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

      // Get the pro trial plan ID
      const proTrialPlan = await prisma.pricing_plans.findFirst({
        where: { slug: 'plan-pro-trial', isActive: true },
        select: { id: true },
      })

      const subscription = await prisma.subscriptions.create({
        data: {
          id: crypto.randomUUID(),
          userId: session.id,
          status: 'TRIALING',
          planType: 'PRO',
          pricingPlanId: proTrialPlan?.id || null,
          trialStartsAt: now,
          trialEndsAt: trialEndsAt,
          updatedAt: new Date(),
        },
      })

      // Log successful trial activation
      await prisma.activity_logs.create({
        data: {
          id: crypto.randomUUID(),
          userId: session.id,
          action: 'CREATED',
          entityType: 'Subscription',
          entityId: subscription.id,
          title: 'Trial PRO Dimulai',
          description: 'Memulai trial PRO 7 hari gratis',
          metadata: {
            trialStartsAt: now.toISOString(),
            trialEndsAt: trialEndsAt.toISOString(),
          },
        },
      })

      return NextResponse.json({
        success: true,
        subscription,
        message: 'Trial PRO 7 hari telah dimulai',
      })
    }

    // Check if user is currently on FREE plan
    if (existingSubscription.planType !== 'FREE' || existingSubscription.status !== 'FREE') {
      // Log failed trial attempt (already has active subscription)
      await prisma.activity_logs.create({
        data: {
          id: crypto.randomUUID(),
          userId: session.id,
          action: 'CREATED',
          entityType: 'Subscription',
          entityId: existingSubscription.id,
          title: 'Percobaan Trial Gagal - Langganan Aktif',
          description: `Pengguna dengan ${existingSubscription.planType}/${existingSubscription.status} mencoba mulai trial`,
          metadata: {
            currentPlan: existingSubscription.planType,
            currentStatus: existingSubscription.status,
            attempted: 'start_trial',
          },
        },
      })

      return NextResponse.json({
        error: 'Anda sudah memiliki langganan aktif atau sedang dalam masa trial',
      }, { status: 400 })
    }

    // Check if user has already used trial before
    if (existingSubscription.trialStartsAt) {
      // Log failed trial attempt (trial already used)
      await prisma.activity_logs.create({
        data: {
          id: crypto.randomUUID(),
          userId: session.id,
          action: 'CREATED',
          entityType: 'Subscription',
          entityId: existingSubscription.id,
          title: 'Percobaan Trial Gagal - Sudah Digunakan',
          description: 'Pengguna mencoba mulai trial kedua kali',
          metadata: {
            trialStartsAt: existingSubscription.trialStartsAt.toISOString(),
            trialEndsAt: existingSubscription.trialEndsAt?.toISOString(),
          },
        },
      })

      return NextResponse.json({
        error: 'Anda sudah pernah menggunakan trial. Silakan upgrade ke PRO untuk melanjutkan.',
      }, { status: 400 })
    }

    // Start trial for existing FREE user
    const now = new Date()
    const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Get the pro trial plan ID
    const proTrialPlan = await prisma.pricing_plans.findFirst({
      where: { slug: 'plan-pro-trial', isActive: true },
      select: { id: true },
    })

    const subscription = await prisma.subscriptions.update({
      where: { id: existingSubscription.id },
      data: {
        status: 'TRIALING',
        planType: 'PRO',
        pricingPlanId: proTrialPlan?.id || null,
        trialStartsAt: now,
        trialEndsAt: trialEndsAt,
        trialSentReminder: false,
      },
    })

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.id,
        action: 'UPDATED',
        entityType: 'Subscription',
        entityId: subscription.id,
        title: 'Trial PRO Dimulai',
        description: 'Memulai trial PRO 7 hari gratis',
        metadata: {
          trialStartsAt: now.toISOString(),
          trialEndsAt: trialEndsAt.toISOString(),
        },
      },
    })

    return NextResponse.json({
      success: true,
      subscription,
      message: 'Trial PRO 7 hari telah dimulai',
    })
  } catch (error) {
    console.error('Start trial error:', error)
    return NextResponse.json(
      { error: 'Gagal memulai trial' },
      { status: 500 }
    )
  }
}
