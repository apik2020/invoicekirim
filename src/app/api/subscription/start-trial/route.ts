import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has a subscription
    const existingSubscription = await prisma.subscriptions.findUnique({
      where: { userId: session.id },
    })

    if (!existingSubscription) {
      // Create new trial subscription
      const now = new Date()
      const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

      const subscription = await prisma.subscriptions.create({
        data: {
          id: crypto.randomUUID(),
          userId: session.id,
          status: 'TRIALING',
          planType: 'PRO',
          trialStartsAt: now,
          trialEndsAt: trialEndsAt,
          updatedAt: new Date(),
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
      return NextResponse.json({
        error: 'Anda sudah memiliki langganan aktif atau sedang dalam masa trial',
      }, { status: 400 })
    }

    // Check if user has already used trial before
    if (existingSubscription.trialStartsAt) {
      return NextResponse.json({
        error: 'Anda sudah pernah menggunakan trial. Silakan upgrade ke PRO untuk melanjutkan.',
      }, { status: 400 })
    }

    // Start trial for existing FREE user
    const now = new Date()
    const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const subscription = await prisma.subscriptions.update({
      where: { id: existingSubscription.id },
      data: {
        status: 'TRIALING',
        planType: 'PRO',
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
