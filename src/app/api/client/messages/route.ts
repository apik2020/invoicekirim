import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getClientSession } from '@/lib/client-auth'

// Get messages for an invoice
export async function GET(request: NextRequest) {
  try {
    const client = await getClientSession()

    if (!client) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('invoiceId')

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    // Check if client has access to this invoice
    const access = await prisma.client_invoice_access.findFirst({
      where: {
        invoiceId,
        client: { email: client.email },
      },
    })

    if (!access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get messages for this invoice
    const messages = await prisma.invoice_messages.findMany({
      where: { invoiceId },
      orderBy: { createdAt: 'asc' },
    })

    // Mark client's messages as read
    await prisma.invoice_messages.updateMany({
      where: {
        invoiceId,
        senderType: 'vendor',
        isRead: false,
      },
      data: { isRead: true },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Get client messages error:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const client = await getClientSession()

    if (!client) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { invoiceId, message, attachments } = body

    if (!invoiceId || !message) {
      return NextResponse.json({ error: 'Invoice ID and message are required' }, { status: 400 })
    }

    // Get or create client account
    let clientAccount = await prisma.client_accounts.findFirst({
      where: { email: client.email },
    })

    if (!clientAccount) {
      clientAccount = await prisma.client_accounts.create({
        data: {
          email: client.email,
          name: client.name,
        },
      })
    }

    // Check if client has access to this invoice
    const access = await prisma.client_invoice_access.findFirst({
      where: {
        invoiceId,
        clientId: clientAccount.id,
      },
    })

    if (!access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get invoice for notification
    const invoice = await prisma.invoices.findFirst({
      where: { id: invoiceId },
    })

    // Create the message
    const newMessage = await prisma.invoice_messages.create({
      data: {
        invoiceId,
        senderType: 'client',
        senderId: clientAccount.id,
        message,
        attachments: attachments || null,
      },
    })

    // Create notification for the vendor (user)
    if (invoice) {
      await prisma.client_notifications.create({
        data: {
          clientId: clientAccount.id,
          type: 'new_message',
          title: `Pesan Baru dari ${client.name}`,
          message: `${client.name} mengirim pesan pada invoice ${invoice.invoiceNumber}`,
          data: {
            invoiceId: invoice.id,
            clientName: client.name,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: newMessage,
    })
  } catch (error) {
    console.error('Send client message error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

// DELETE - Delete a message
export async function DELETE(request: NextRequest) {
  try {
    const client = await getClientSession()

    if (!client) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('id')

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
    }

    // Get client account
    const clientAccount = await prisma.client_accounts.findFirst({
      where: { email: client.email },
    })

    if (!clientAccount) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Delete the message (only if sent by this client)
    await prisma.invoice_messages.deleteMany({
      where: {
        id: messageId,
        senderType: 'client',
        senderId: clientAccount.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete client message error:', error)
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
  }
}
