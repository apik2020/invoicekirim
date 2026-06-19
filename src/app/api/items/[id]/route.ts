import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// PUT - Update item
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession()
    const { id } = await params

    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify item belongs to user
    const item = await prisma.items.findFirst({
      where: {
        id,
        userId: session.id,
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const body = await req.json()
    let { name, description, sku, unit, price, taxRate, category } = body

    // Normalize empty SKU to null (avoid duplicate empty strings)
    if (!sku || sku.trim() === '') {
      sku = null
    }

    // Check if SKU is being changed and if it conflicts with another item
    if (sku && sku !== item.sku) {
      const existingItem = await prisma.items.findFirst({
        where: {
          userId: session.id,
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

    const updatedItem = await prisma.items.update({
      where: { id },
      data: {
        name,
        description,
        sku,
        unit,
        price,
        taxRate,
        category,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(updatedItem)
  } catch (error: any) {
    console.error('Update item error:', error)

    // Handle unique constraint violation
    if (error?.code === 'P2002' && error?.meta?.target?.includes('sku')) {
      return NextResponse.json(
        { error: 'SKU sudah digunakan' },
        { status: 400 }
      )
    }

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
    const session = await getUserSession()
    const { id } = await params

    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify item belongs to user
    const item = await prisma.items.findFirst({
      where: {
        id,
        userId: session.id,
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    await prisma.items.delete({
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
