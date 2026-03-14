import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Public API for active pricing plans
export async function GET() {
  try {
    const plans = await prisma.pricing_plans.findMany({
      where: { isActive: true },
      include: {
        features: {
          include: {
            feature: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    }).catch((err) => {
      console.error('Prisma query error:', err)
      return []
    })

    // Transform data for frontend
    const transformedPlans = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      stripePriceId: plan.stripePriceId,
      trialDays: plan.trialDays,
      isFeatured: plan.isFeatured,
      ctaText: plan.ctaText,
      features: plan.features
        .sort((a, b) => a.feature.sortOrder - b.feature.sortOrder)
        .map((pf) => ({
          id: pf.feature.id,
          name: pf.feature.name,
          key: pf.feature.key,
          included: pf.included,
          limitValue: pf.limitValue,
        })),
    }))

    return NextResponse.json({ plans: transformedPlans })
  } catch (error) {
    console.error('Error fetching public pricing:', error)
    return NextResponse.json(
      { error: 'Gagal memuat data pricing' },
      { status: 500 }
    )
  }
}
