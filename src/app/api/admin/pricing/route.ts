import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminAuth } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'

const planSchema = z.object({
  name: z.string().min(1, 'Nama paket harus diisi'),
  slug: z.string().min(1, 'Slug harus diisi').regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung'),
  description: z.string().optional().nullable(),
  price_monthly: z.number().min(0, 'Harga bulanan tidak boleh negatif'),
  price_yearly: z.number().min(0, 'Harga tahunan tidak boleh negatif'),
  yearly_discount_percent: z.number().min(0).max(100).optional().nullable(),
  stripePriceId: z.string().optional().nullable(),
  trialDays: z.number().min(0).default(0),
  is_popular: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
  ctaText: z.string().optional().nullable(),
  features: z.object({}).passthrough(),
}).refine((data) => {
  if (data.price_monthly > 0 && data.price_yearly > 0) {
    return data.price_yearly < data.price_monthly * 12
  }
  return true
}, {
  message: 'Harga tahunan harus lebih murah dari harga bulanan × 12',
})

// GET - List all plans (admin)
export async function GET() {
  try {
    const plans = await prisma.pricing_plans.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ plans })
  } catch (error: any) {
    console.error('Error fetching pricing:', error)
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat data pricing' },
      { status: 500 }
    )
  }
}

// POST - Create new plan
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminAuth()
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }
    const body = await req.json()
    const validation = planSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || 'Data tidak valid' },
        { status: 400 }
      )
    }

    const { features: featuresJson, ...planData } = validation.data

    const existingPlan = await prisma.pricing_plans.findUnique({
      where: { slug: planData.slug },
    })

    if (existingPlan) {
      return NextResponse.json(
        { error: 'Slug sudah digunakan' },
        { status: 400 }
      )
    }

    // Auto-calculate discount if not provided and both prices are set
    if (!planData.yearly_discount_percent && planData.price_monthly > 0 && planData.price_yearly > 0) {
      const fullYearly = planData.price_monthly * 12
      const discount = Math.round(((fullYearly - planData.price_yearly) / fullYearly) * 100)
      planData.yearly_discount_percent = discount > 0 ? discount : null
    }

    const plan = await prisma.pricing_plans.create({
      data: {
        name: planData.name,
        slug: planData.slug,
        description: planData.description || null,
        price_monthly: planData.price_monthly,
        price_yearly: planData.price_yearly,
        yearly_discount_percent: planData.yearly_discount_percent || null,
        stripePriceId: planData.stripePriceId || null,
        trialDays: planData.trialDays,
        is_popular: planData.is_popular,
        isActive: planData.isActive,
        sortOrder: planData.sortOrder,
        ctaText: planData.ctaText || null,
        features_json: featuresJson as Record<string, boolean | number | null>,
      },
    })

    return NextResponse.json({ plan })
  } catch (error: any) {
    console.error('Error creating plan:', error)
    return NextResponse.json(
      { error: error?.message || 'Gagal membuat paket' },
      { status: 500 }
    )
  }
}
