import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FEATURE_DEFINITIONS, parsePlanFeatures } from '@/lib/pricing-features'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const plan = await prisma.pricing_plans.findUnique({
      where: { id },
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    const featuresJson = parsePlanFeatures(plan.features_json)

    const transformedPlan = {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      yearly_discount_percent: plan.yearly_discount_percent,
      currency: plan.currency,
      trialDays: plan.trialDays,
      is_popular: plan.is_popular,
      ctaText: plan.ctaText,
      features: FEATURE_DEFINITIONS.map((def) => ({
        key: def.key,
        name: def.name,
        type: def.type,
        value: featuresJson[def.key] === undefined ? false : featuresJson[def.key],
      })),
    }

    return NextResponse.json(transformedPlan)
  } catch (error) {
    console.error('[pricing-plan] Error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data plan' },
      { status: 500 }
    )
  }
}
