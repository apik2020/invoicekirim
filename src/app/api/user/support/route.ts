import { NextRequest, NextResponse } from 'next/server'
import { getUserSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - List all tickets for authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const status = url.searchParams.get('status')

    const skip = (page - 1) * limit

    const where: any = {
      userId: session.id,
    }

    if (status) {
      where.status = status
    }

    const [tickets, total, stats] = await Promise.all([
      prisma.support_tickets.findMany({
        where,
        include: {
          _count: {
            select: { support_messages: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.support_tickets.count({ where }),
      // Get stats
      Promise.all([
        prisma.support_tickets.count({ where: { userId: session.id, status: 'open' } }),
        prisma.support_tickets.count({ where: { userId: session.id, status: 'in_progress' } }),
        prisma.support_tickets.count({ where: { userId: session.id, status: 'resolved' } }),
      ]),
    ])

    const [open, inProgress, resolved] = await stats

    return NextResponse.json({
      tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        open,
        inProgress,
        resolved,
      },
    })
  } catch (error) {
    console.error('Error fetching support tickets:', error)
    return NextResponse.json({ error: 'Failed to fetch support tickets' }, { status: 500 })
  }
}

// POST - Create new ticket
export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { subject, description, category, priority } = body

    if (!subject || !description) {
      return NextResponse.json(
      { error: 'Subject and description are required' },
      { status: 400 }
    )
    }

    const ticket = await prisma.support_tickets.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.id,
        subject,
        description,
        category: category || 'general',
        priority: priority || 'normal',
        status: 'open',
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error('Error creating support ticket:', error)
    return NextResponse.json({ error: 'Failed to create support ticket' }, { status: 500 })
  }
}
