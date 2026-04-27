import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminAuth } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'

const planUpdateSchema = z.object({
  name: z.string().min(1, 'Nama paket harus diisi').optional(),
  slug: z.string().min(1, 'Slug harus diisi').regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung').optional(),
  description: z.string().optional().nullable(),
  price_monthly: z.number().min(0, 'Harga bulanan tidak boleh negatif').optional(),
  price_yearly: z.number().min(0, 'Harga tahunan tidak boleh negatif').optional(),
  yearly_discount_percent: z.number().min(0).max(100).optional().nullable(),
  stripePriceId: z.string().optional().nullable(),
  trialDays: z.number().min(0).optional(),
  is_popular: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
  ctaText: z.string().optional().nullable(),
  features: z.object({}).passthrough().optional(),
})

// GET - Get single plan
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminAuth()
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }
    const { id } = await params

    const plan = await prisma.pricing_plans.findUnique({
      where: { id },
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Paket tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Error fetching plan:', error)
    return NextResponse.json(
      { error: 'Gagal memuat data paket' },
      { status: 500 }
    )
  }
}

// PUT - Update plan
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminAuth()
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }
    const { id } = await params

    const body = await req.json()
    const validation = planUpdateSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || 'Data tidak valid' },
        { status: 400 }
      )
    }

    const { features: featuresJson, ...planData } = validation.data

    if (planData.stripePriceId === '') {
      planData.stripePriceId = null
    }

    const existingPlan = await prisma.pricing_plans.findUnique({
      where: { id },
    })

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Paket tidak ditemukan' },
        { status: 404 }
      )
    }

    if (planData.slug && planData.slug !== existingPlan.slug) {
      const slugExists = await prisma.pricing_plans.findUnique({
        where: { slug: planData.slug },
      })
      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug sudah digunakan' },
          { status: 400 }
        )
      }
    }

    // Auto-calculate discount
    const monthly = planData.price_monthly ?? existingPlan.price_monthly
    const yearly = planData.price_yearly ?? existingPlan.price_yearly
    if (planData.price_monthly !== undefined || planData.price_yearly !== undefined) {
      if (monthly > 0 && yearly > 0 && yearly < monthly * 12) {
        planData.yearly_discount_percent = Math.round(((monthly * 12 - yearly) / (monthly * 12)) * 100)
      } else {
        planData.yearly_discount_percent = null
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = { ...planData }
    if (featuresJson) {
      updateData.features_json = featuresJson
    }

    const plan = await prisma.pricing_plans.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Error updating plan:', error)
    return NextResponse.json(
      { error: 'Gagal mengupdate paket' },
      { status: 500 }
    )
  }
}

// DELETE - Delete plan
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminAuth()
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }
    const { id } = await params

    const existingPlan = await prisma.pricing_plans.findUnique({
      where: { id },
    })

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Paket tidak ditemukan' },
        { status: 404 }
      )
    }

    await prisma.pricing_plans.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Paket berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting plan:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus paket' },
      { status: 500 }
    )
  }
}
