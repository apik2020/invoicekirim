import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminAuth } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'

const planSchema = z.object({
  name: z.string().min(1, 'Nama paket harus diisi'),
  slug: z.string().min(1, 'Slug harus diisi').regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung'),
  description: z.string().optional().nullable(),
  price: z.number().min(0, 'Harga tidak boleh negatif'),
  stripePriceId: z.string().optional().nullable(),
  trialDays: z.number().min(0).default(0),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
  ctaText: z.string().optional().nullable(),
  features: z.array(z.object({
    featureId: z.string(),
    included: z.boolean(),
    limitValue: z.number().nullable().optional(),
  })),
})

// GET - List all plans and features (public endpoint - no auth required)
export async function GET() {
  try {
    const plans = await prisma.pricing_plans.findMany({
      include: {
        features: {
          include: {
            feature: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    const features = await prisma.pricing_features.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ plans, features })
  } catch (error: any) {
    console.error('Error fetching pricing:', error)
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat data pricing' },
      { status: 500 }
    )
  }
}

// POST - Create new plan (requires admin auth)
export async function POST(req: NextRequest) {
  try {
    await requireAdminAuth()
    const body = await req.json()
    const validation = planSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || 'Data tidak valid' },
        { status: 400 }
      )
    }

    const { features: planFeatures, ...planData } = validation.data

    // Check if slug already exists
    const existingPlan = await prisma.pricing_plans.findUnique({
      where: { slug: planData.slug },
    })

    if (existingPlan) {
      return NextResponse.json(
        { error: 'Slug sudah digunakan' },
        { status: 400 }
      )
    }

    // Create plan
    const plan = await prisma.pricing_plans.create({
      data: {
        name: planData.name,
        slug: planData.slug,
        description: planData.description || null,
        price: planData.price,
        stripePriceId: planData.stripePriceId || null,
        trialDays: planData.trialDays,
        isFeatured: planData.isFeatured,
        isActive: planData.isActive,
        sortOrder: planData.sortOrder,
        ctaText: planData.ctaText || null,
      },
    })

    // Create features
    if (planFeatures && planFeatures.length > 0) {
      await prisma.pricing_plan_features.createMany({
        data: planFeatures.map((pf) => ({
          planId: plan.id,
          featureId: pf.featureId,
          included: pf.included,
          limitValue: pf.limitValue,
        })),
      })
    }

    // Fetch the complete plan with features
    const completePlan = await prisma.pricing_plans.findUnique({
      where: { id: plan.id },
      include: {
        features: {
          include: {
            feature: true,
          },
        },
      },
    })

    return NextResponse.json({ plan: completePlan })
  } catch (error: any) {
    console.error('Error creating plan:', error)
    return NextResponse.json(
      { error: error?.message || 'Gagal membuat paket' },
      { status: 500 }
    )
  }
}
