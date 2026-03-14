import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminAuth } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'

const planUpdateSchema = z.object({
  name: z.string().min(1, 'Nama paket harus diisi').optional(),
  slug: z.string().min(1, 'Slug harus diisi').regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung').optional(),
  description: z.string().optional().nullable(),
  price: z.number().min(0, 'Harga tidak boleh negatif').optional(),
  stripePriceId: z.string().optional().nullable(),
  trialDays: z.number().min(0).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
  ctaText: z.string().optional().nullable(),
  features: z.array(z.object({
    featureId: z.string(),
    included: z.boolean(),
    limitValue: z.number().nullable().optional(),
  })).optional(),
})

// GET - Get single plan
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth()
    const { id } = await params

    const plan = await prisma.pricing_plans.findUnique({
      where: { id },
      include: {
        features: {
          include: {
            feature: true,
          },
        },
      },
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
    await requireAdminAuth()
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

    const { features: planFeatures, ...planData } = validation.data

    // Check if plan exists
    const existingPlan = await prisma.pricing_plans.findUnique({
      where: { id },
    })

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Paket tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check slug uniqueness if slug is being updated
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

    // Update features if provided
    if (planFeatures) {
      // Delete existing features
      await prisma.pricing_plan_features.deleteMany({
        where: { planId: id },
      })

      // Create new features
      await prisma.pricing_plan_features.createMany({
        data: planFeatures.map((pf) => ({
          planId: id,
          featureId: pf.featureId,
          included: pf.included,
          limitValue: pf.limitValue,
        })),
      })
    }

    const plan = await prisma.pricing_plans.update({
      where: { id },
      data: planData,
      include: {
        features: {
          include: {
            feature: true,
          },
        },
      },
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
    await requireAdminAuth()
    const { id } = await params

    // Check if plan exists
    const existingPlan = await prisma.pricing_plans.findUnique({
      where: { id },
    })

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Paket tidak ditemukan' },
        { status: 404 }
      )
    }

    // Delete plan (features will be cascade deleted)
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
