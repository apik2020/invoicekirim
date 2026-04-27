import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FEATURE_DEFINITIONS, parsePlanFeatures } from '@/lib/pricing-features'

export async function GET() {
  try {
    const plans = await prisma.pricing_plans.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    }).catch((err) => {
      console.error('Prisma query error:', err)
      return []
    })

    const transformedPlans = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      yearly_discount_percent: plan.yearly_discount_percent,
      currency: plan.currency,
      stripePriceId: plan.stripePriceId,
      trialDays: plan.trialDays,
      is_popular: plan.is_popular,
      ctaText: plan.ctaText,
      features: FEATURE_DEFINITIONS.map((def) => {
        const featuresJson = parsePlanFeatures(plan.features_json)
        const value = featuresJson[def.key]
        return {
          key: def.key,
          name: def.name,
          nameEn: def.nameEn,
          type: def.type,
          value: value === undefined ? false : value,
        }
      }),
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
