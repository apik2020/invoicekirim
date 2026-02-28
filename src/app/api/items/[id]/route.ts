import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// PUT - Update item
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify item belongs to user
    const item = await prisma.item.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const body = await req.json()
    const { name, description, sku, unit, price, taxRate, category } = body

    // Check if SKU is being changed and if it conflicts with another item
    if (sku && sku !== item.sku) {
      const existingItem = await prisma.item.findFirst({
        where: {
          userId: session.user.id,
          sku,
          id: { not: id },
        },
      })

      if (existingItem) {
        return NextResponse.json(
          { error: 'SKU sudah digunakan oleh item lain' },
          { status: 400 }
        )
      }
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        name,
        description,
        sku,
        unit,
        price,
        taxRate,
        category,
      },
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Update item error:', error)
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    )
  }
}

// DELETE - Delete item
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify item belongs to user
    const item = await prisma.item.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    await prisma.item.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Delete item error:', error)
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    )
  }
}
