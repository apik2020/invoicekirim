import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminAuth } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'

const featureSchema = z.object({
  name: z.string().min(1, 'Nama fitur harus diisi'),
  key: z.string().min(1, 'Key fitur harus diisi').regex(/^[a-z0-9_]+$/, 'Key hanya boleh huruf kecil, angka, dan underscore'),
  description: z.string().optional().nullable(),
  sortOrder: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
})

// GET - List all features
export async function GET() {
  try {
    const features = await prisma.pricing_features.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ features })
  } catch (error: any) {
    console.error('Error fetching features:', error)
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat data fitur' },
      { status: 500 }
    )
  }
}

// POST - Create new feature (requires admin auth)
export async function POST(req: NextRequest) {
  try {
    await requireAdminAuth()
    const body = await req.json()
    const validation = featureSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || 'Data tidak valid' },
        { status: 400 }
      )
    }

    // Check if key already exists
    const existingFeature = await prisma.pricing_features.findUnique({
      where: { key: validation.data.key },
    })

    if (existingFeature) {
      return NextResponse.json(
        { error: 'Key fitur sudah digunakan' },
        { status: 400 }
      )
    }

    const feature = await prisma.pricing_features.create({
      data: {
        name: validation.data.name,
        key: validation.data.key,
        description: validation.data.description || null,
        sortOrder: validation.data.sortOrder,
        isActive: validation.data.isActive,
      },
    })

    return NextResponse.json({ feature })
  } catch (error: any) {
    console.error('Error creating feature:', error)
    return NextResponse.json(
      { error: error?.message || 'Gagal membuat fitur' },
      { status: 500 }
    )
  }
}

// PUT - Update feature
export async function PUT(req: NextRequest) {
  try {
    await requireAdminAuth()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID fitur diperlukan' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const validation = featureSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || 'Data tidak valid' },
        { status: 400 }
      )
    }

    // Check if feature exists
    const existingFeature = await prisma.pricing_features.findUnique({
      where: { id },
    })

    if (!existingFeature) {
      return NextResponse.json(
        { error: 'Fitur tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check key uniqueness if key is being updated
    if (validation.data.key !== existingFeature.key) {
      const keyExists = await prisma.pricing_features.findUnique({
        where: { key: validation.data.key },
      })
      if (keyExists) {
        return NextResponse.json(
          { error: 'Key fitur sudah digunakan' },
          { status: 400 }
        )
      }
    }

    const feature = await prisma.pricing_features.update({
      where: { id },
      data: {
        name: validation.data.name,
        key: validation.data.key,
        description: validation.data.description || null,
        sortOrder: validation.data.sortOrder,
        isActive: validation.data.isActive,
      },
    })

    return NextResponse.json({ feature })
  } catch (error: any) {
    console.error('Error updating feature:', error)
    return NextResponse.json(
      { error: error?.message || 'Gagal mengupdate fitur' },
      { status: 500 }
    )
  }
}

// DELETE - Delete feature
export async function DELETE(req: NextRequest) {
  try {
    await requireAdminAuth()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID fitur diperlukan' },
        { status: 400 }
      )
    }

    // Check if feature exists
    const existingFeature = await prisma.pricing_features.findUnique({
      where: { id },
    })

    if (!existingFeature) {
      return NextResponse.json(
        { error: 'Fitur tidak ditemukan' },
        { status: 404 }
      )
    }

    // Delete feature (will cascade delete from plan_features)
    await prisma.pricing_features.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Fitur berhasil dihapus' })
  } catch (error: any) {
    console.error('Error deleting feature:', error)
    return NextResponse.json(
      { error: error?.message || 'Gagal menghapus fitur' },
      { status: 500 }
    )
  }
}
