import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { createItemSchema } from '@/lib/validations/common'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/items
 *
 * Retrieves all items for the authenticated user, optionally filtered by category.
 *
 * @query category - Optional category filter
 *
 * @returns {Item[]} List of items ordered by creation date (newest first)
 * @throws {401} Unauthorized - User not logged in
 * @throws {500} Internal Server Error
 */
export async function GET(req: NextRequest) {
  let session
  try {
    session = await getUserSession()

    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    const where: any = { userId: session.id }

    if (category) {
      where.category = category
    }

    const items = await prisma.items.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(items)
  } catch (error) {
    logger.apiError('/api/items GET', error, session?.id)
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/items
 *
 * Creates a new item in the authenticated user's catalog.
 *
 * @body {CreateItemSchema} Item data (name, price, optional: description, sku, unit, taxRate, category)
 *
 * @returns {Item} Created item object
 * @throws {401} Unauthorized - User not logged in
 * @throws {422} Validation Error - Invalid item data
 * @throws {400} Bad Request - SKU already used by this user
 * @throws {500} Internal Server Error
 */
export async function POST(req: NextRequest) {
  let session
  try {
    session = await getUserSession()

    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Validate with Zod schema
    const validation = createItemSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        {
          error: firstError?.message || 'Data tidak valid',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 422 }
      )
    }

    const { name, description, unit, price, taxRate, category } = validation.data

    // Normalize empty SKU to null (avoid duplicate empty strings)
    let sku = validation.data.sku ?? null
    if (!sku || sku.trim() === '') {
      sku = null
    }

    // Check if SKU already exists for this user
    if (sku) {
      const existingItem = await prisma.items.findFirst({
        where: {
          userId: session.id,
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

    const item = await prisma.items.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.id,
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

    logger.info('Item created', { userId: session.id, itemId: item.id, itemName: name })

    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    logger.apiError('/api/items POST', error, session?.id)

    // Handle unique constraint violation
    if (error?.code === 'P2002' && error?.meta?.target?.includes('sku')) {
      return NextResponse.json(
        { error: 'SKU sudah digunakan' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    )
  }
}
