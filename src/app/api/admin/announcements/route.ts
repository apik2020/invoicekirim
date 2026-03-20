import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const result = await requireAdminAuth()
    if (result.error || !result.admin) {
      return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const search = url.searchParams.get('search') || ''
    const isActive = url.searchParams.get('isActive')
    const type = url.searchParams.get('type')
    const sortBy = url.searchParams.get('sortBy') || 'createdAt'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    if (type) {
      where.type = type
    }

    const [announcements, total] = await Promise.all([
      prisma.announcements.findMany({
        where,
        include: {
          _count: {
            select: { announcement_reads: true },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.announcements.count({ where }),
    ])

    return NextResponse.json({
      announcements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const result = await requireAdminAuth()
    if (result.error || !result.admin) {
      return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      title,
      message,
      type,
      targetType,
      targetUsers,
      displayType,
      isDismissible,
      isActive,
      startsAt,
      endsAt,
    } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
    }

    const announcement = await prisma.announcements.create({
      data: {
        id: crypto.randomUUID(),
        title,
        message,
        type: type || 'info',
        targetType: targetType || 'all',
        targetUsers: targetUsers || null,
        displayType: displayType || 'banner',
        isDismissible: isDismissible ?? true,
        isActive: isActive ?? true,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  }
}
