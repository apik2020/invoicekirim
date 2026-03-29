import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const plan = await prisma.pricing_plans.findUnique({
      where: { id },
      include: {
        features: {
          include: {
            feature: true
          },
          orderBy: {
            feature: {
              sortOrder: 'asc'
            }
          }
        }
      }
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    // Transform the data to match the expected format
    const transformedPlan = {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      trialDays: plan.trialDays,
      isFeatured: plan.isFeatured,
      features: plan.features.map(pf => ({
        id: pf.feature.id,
        name: pf.feature.name,
        key: pf.feature.key,
        included: pf.included,
        limitValue: pf.limitValue
      }))
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
