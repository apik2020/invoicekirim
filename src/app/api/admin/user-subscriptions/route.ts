import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'

import { SubscriptionStatus, PlanType } from '@prisma/client'

// GET - List all users with their subscriptions
export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth()

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const planFilter = searchParams.get('plan') || ''
    const statusFilter = searchParams.get('status') || ''

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get pricing plans for dropdown
    const pricingPlans = await prisma.pricing_plans.findMany({
      where: { isActive: true },
      include: {
        features: {
          include: { feature: true },
          orderBy: { feature: { sortOrder: 'asc' } },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    // Build filter for subscription
    if (planFilter || statusFilter) {
      where.subscriptions = {}
      if (planFilter) {
        // Map plan filter to planType
        const planTypeMap: Record<string, string> = {
          'gratis': 'FREE',
          'free': 'FREE',
          'pro': 'PRO',
        }
        where.subscriptions.planType = planTypeMap[planFilter.toLowerCase()] as PlanType
      }
      if (statusFilter) {
        where.subscriptions.status = statusFilter.toUpperCase() as SubscriptionStatus
      }
    }

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        include: {
          subscriptions: {
            include: {
              pricing_plans: {
                include: {
                  features: {
                    include: { feature: true },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              invoices: {
                where: {
                  createdAt: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.users.count({ where }),
    ])

    // Transform data
    const transformedUsers = users.map((user) => {
      const subscription = user.subscriptions
      const invoiceCountThisMonth = user._count?.invoices || 0

      // Find invoice limit from plan features
      const invoiceLimitFeature = subscription?.pricing_plans?.features?.find(
        (f: any) => f.feature?.key === 'invoice_limit'
      )
      const monthlyInvoiceLimit = invoiceLimitFeature?.limitValue || null

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        subscription: subscription ? {
          id: subscription.id,
          planType: subscription.planType,
          status: subscription.status,
          trialEndsAt: subscription.trialEndsAt,
          pricingPlan: subscription.pricing_plans ? {
            id: subscription.pricing_plans.id,
            name: subscription.pricing_plans.name,
            slug: subscription.pricing_plans.slug,
          } : null,
          monthlyInvoiceLimit,
        } : null,
        invoiceCountThisMonth,
      }
    })

    return NextResponse.json({
      users: transformedUsers,
      pricingPlans,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching user subscriptions:', error)
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat data subscription' },
      { status: 500 }
    )
  }
}

// PUT - Update user subscription
export async function PUT(req: NextRequest) {
  try {
    await requireAdminAuth()

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID diperlukan' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { pricingPlanId, status, trialDays } = body

    // Check user exists
    const user = await prisma.users.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Get pricing plan details
    let planType: PlanType = 'FREE'
    if (pricingPlanId) {
      const pricingPlan = await prisma.pricing_plans.findUnique({
        where: { id: pricingPlanId },
      })
      if (pricingPlan) {
        planType = pricingPlan.slug.toUpperCase() === 'PRO' ? 'PRO' : 'FREE'
      }
    }

    // Prepare subscription data
    const subscriptionData: any = {
      planType,
      status: status || 'FREE',
      pricingPlanId: pricingPlanId || null,
    }

    if (trialDays && trialDays > 0) {
      subscriptionData.trialStartsAt = new Date()
      subscriptionData.trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)
    }

    // Update or create subscription
    const existingSubscription = await prisma.subscriptions.findUnique({
      where: { userId },
    })

    let subscription
    if (existingSubscription) {
      subscription = await prisma.subscriptions.update({
        where: { userId },
        data: subscriptionData,
      })
    } else {
      subscription = await prisma.subscriptions.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          ...subscriptionData,
        },
      })
    }

    // Also update user's team planType if they have a team
    await prisma.teams.updateMany({
      where: { ownerId: userId },
      data: { planType },
    })

    return NextResponse.json({
      subscription,
      message: 'Subscription berhasil diupdate'
    })
  } catch (error: any) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: error?.message || 'Gagal mengupdate subscription' },
      { status: 500 }
    )
  }
}

// DELETE - Reset user to free plan
export async function DELETE(req: NextRequest) {
  try {
    await requireAdminAuth()

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID diperlukan' },
        { status: 400 }
      )
    }

    // Reset subscription to free
    await prisma.subscriptions.update({
      where: { userId },
      data: {
        planType: 'FREE',
        status: 'FREE',
        pricingPlanId: null,
        stripeSubscriptionId: null,
        stripePriceId: null,
        trialEndsAt: null,
        trialStartsAt: null,
      },
    })

    // Also reset team planType
    await prisma.teams.updateMany({
      where: { ownerId: userId },
      data: { planType: 'FREE' },
    })

    return NextResponse.json({ message: 'Subscription berhasil direset ke free' })
  } catch (error: any) {
    console.error('Error resetting subscription:', error)
    return NextResponse.json(
      { error: error?.message || 'Gagal mereset subscription' },
      { status: 500 }
    )
  }
}
