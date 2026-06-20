import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requireAdminAuth()
    if (result.error || !result.admin) {
      return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const ticket = await prisma.support_tickets.findUnique({
      where: { id },
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
        support_messages: {
          orderBy: { createdAt: 'asc' },
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
          },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    logger.apiError('/api/admin/support/[id] GET', error)
    return NextResponse.json({ error: 'Failed to fetch support ticket' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requireAdminAuth()
    if (result.error || !result.admin) {
      return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { message, isInternal } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get ticket to check if it's a client ticket
    const ticket = await prisma.support_tickets.findUnique({
      where: { id },
      select: { clientId: true },
    })

    // Create message
    const supportMessage = await prisma.support_messages.create({
      data: {
        id: crypto.randomUUID(),
        ticketId: id,
        adminId: result.admin.id,
        message,
        isInternal: isInternal || false,
      },
    })

    // Update ticket's lastReplyAt
    await prisma.support_tickets.update({
      where: { id },
      data: {
        lastReplyAt: new Date(),
        updatedAt: new Date(),
        status: 'waiting_customer',
      },
    })

    // Create notification for client if this is a client ticket and not internal note
    if (ticket?.clientId && !isInternal) {
      await prisma.client_notifications.create({
        data: {
          id: crypto.randomUUID(),
          clientId: ticket.clientId,
          type: 'support_reply',
          title: 'Balasan dari Support',
          message: `Ada balasan baru untuk tiket bantuan Anda.`,
          data: { ticketId: id },
        },
      })
    }

    return NextResponse.json(supportMessage, { status: 201 })
  } catch (error) {
    logger.apiError('/api/admin/support/[id] POST', error)
    return NextResponse.json({ error: 'Failed to create support message' }, { status: 500 })
  }
}
