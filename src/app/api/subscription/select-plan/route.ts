import { NextRequest, NextResponse } from 'next/server'
import { getUserSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { planSlug } = body

    if (!planSlug || !['free', 'pro'].includes(planSlug.toLowerCase())) {
      return NextResponse.json(
        { error: 'Paket tidak valid' },
        { status: 400 }
      )
    }

    // Get user's subscription
    const subscription = await prisma.subscriptions.findUnique({
      where: { userId: session.id },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription tidak ditemukan' },
        { status: 404 }
      )
    }

    // Get the pricing plan
    const pricingPlan = await prisma.pricing_plans.findFirst({
      where: {
        slug: planSlug.toLowerCase(),
        isActive: true,
      },
    })

    if (!pricingPlan) {
      return NextResponse.json(
        { error: 'Paket tidak ditemukan' },
        { status: 404 }
      )
    }

    // Update subscription
    const planType = planSlug.toUpperCase() === 'FREE' ? 'FREE' : 'PRO'
    const status = planSlug.toUpperCase() === 'FREE' ? 'FREE' : 'ACTIVE'

    const updatedSubscription = await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        status,
        planType,
        pricingPlanId: pricingPlan.id,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
      plan: pricingPlan,
    })
  } catch (error) {
    console.error('Error selecting plan:', error)
    return NextResponse.json(
      { error: 'Gagal memilih paket' },
      { status: 500 }
    )
  }
}
