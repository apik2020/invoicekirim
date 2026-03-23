import { NextRequest, NextResponse } from 'next/server'
import { getUserSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Get ticket detail with all messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const ticket = await prisma.support_tickets.findFirst({
      where: { id, userId: session.id },
      include: {
        support_messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            users: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Filter out internal notes for user view
    const visibleMessages = ticket.support_messages.filter(
      (msg) => !msg.isInternal
    )

    return NextResponse.json({
      ticket: {
        ...ticket,
        support_messages: visibleMessages,
      },
    })
  } catch (error) {
    console.error('Error fetching support ticket:', error)
    return NextResponse.json({ error: 'Failed to fetch support ticket' }, { status: 500 })
  }
}

// POST - Add reply to ticket
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { message, attachments } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Verify ticket ownership
    const ticket = await prisma.support_tickets.findFirst({
      where: { id, userId: session.id },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check if ticket is closed
    if (ticket.status === 'closed') {
      return NextResponse.json(
        { error: 'Cannot reply to closed ticket' },
        { status: 400 }
      )
    }

    // Create message
    const supportMessage = await prisma.support_messages.create({
      data: {
        id: crypto.randomUUID(),
        ticketId: id,
        userId: session.id,
        message,
        attachments: attachments || null,
        isInternal: false,
      },
      include: {
        users: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Update ticket's lastReplyAt and status
    await prisma.support_tickets.update({
      where: { id },
      data: {
        lastReplyAt: new Date(),
        updatedAt: new Date(),
        status: 'open', // Set back to open when user replies
      },
    })

    return NextResponse.json(supportMessage, { status: 201 })
  } catch (error) {
    console.error('Error creating support message:', error)
    return NextResponse.json({ error: 'Failed to create support message' }, { status: 500 })
  }
}
