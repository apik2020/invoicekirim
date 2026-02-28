import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET - Get all items for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    const where: any = { userId: session.user.id }

    if (category) {
      where.category = category
    }

    const items = await prisma.item.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Get items error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    )
  }
}

// POST - Create new item
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, sku, unit, price, taxRate, category } = body

    // Validation
    if (!name || !price) {
      return NextResponse.json(
        { error: 'Nama dan harga wajib diisi' },
        { status: 400 }
      )
    }

    // Check if SKU already exists for this user
    if (sku) {
      const existingItem = await prisma.item.findFirst({
        where: {
          userId: session.user.id,
          sku,
        },
      })

      if (existingItem) {
        return NextResponse.json(
          { error: 'SKU sudah digunakan' },
          { status: 400 }
        )
      }
    }

    const item = await prisma.item.create({
      data: {
        userId: session.user.id,
        name,
        description,
        sku,
        unit,
        price,
        taxRate,
        category,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Create item error:', error)
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    )
  }
}
