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
    const status = url.searchParams.get('status')
    const priority = url.searchParams.get('priority')
    const category = url.searchParams.get('category')
    const sortBy = url.searchParams.get('sortBy') || 'createdAt'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { users: { email: { contains: search, mode: 'insensitive' } } },
        { users: { name: { contains: search, mode: 'insensitive' } } },
        { client: { email: { contains: search, mode: 'insensitive' } } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (status) where.status = status
    if (priority) where.priority = priority
    if (category) where.category = category

    const [tickets, total] = await Promise.all([
      prisma.support_tickets.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: { support_messages: true },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.support_tickets.count({ where }),
    ])

    return NextResponse.json({
      tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching support tickets:', error)
    return NextResponse.json({ error: 'Failed to fetch support tickets' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const result = await requireAdminAuth()
    if (result.error || !result.admin) {
      return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { ticketId, status, priority, assignedTo } = body

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 })
    }

    const updateData: any = { updatedAt: new Date() }
    if (status !== undefined) {
      updateData.status = status
      if (status === 'resolved') updateData.resolvedAt = new Date()
      if (status === 'closed') updateData.closedAt = new Date()
    }
    if (priority !== undefined) updateData.priority = priority
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo

    const ticket = await prisma.support_tickets.update({
      where: { id: ticketId },
      data: updateData,
    })

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Error updating support ticket:', error)
    return NextResponse.json({ error: 'Failed to update support ticket' }, { status: 500 })
  }
}
