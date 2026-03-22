import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getClientSession } from '@/lib/client-auth'

// GET - List client notifications
export async function GET(request: NextRequest) {
  try {
    const client = await getClientSession()

    if (!client) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    // If just getting unread count
    if (unreadOnly) {
      const unreadCount = await prisma.client_notifications.count({
        where: { clientId: client.id, isRead: false },
      })
      return NextResponse.json({ unreadCount })
    }

    // Build where clause
    const where: any = { clientId: client.id }
    if (type && type !== 'ALL') {
      where.type = type
    }

    // Get notifications with pagination
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.client_notifications.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.client_notifications.count({ where }),
      prisma.client_notifications.count({
        where: { clientId: client.id, isRead: false },
      }),
    ])

    return NextResponse.json({
      notifications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      unreadCount,
    })
  } catch (error) {
    console.error('Get client notifications error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// POST - Mark notification(s) as read
export async function POST(request: NextRequest) {
  try {
    const client = await getClientSession()

    if (!client) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationId, markAllRead } = body

    if (markAllRead) {
      await prisma.client_notifications.updateMany({
        where: { clientId: client.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      })
      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 })
    }

    await prisma.client_notifications.update({
      where: { id: notificationId, clientId: client.id },
      data: { isRead: true, readAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark notification read error:', error)
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 })
  }
}

// DELETE - Delete a notification
export async function DELETE(request: NextRequest) {
  try {
    const client = await getClientSession()

    if (!client) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 })
    }

    await prisma.client_notifications.delete({
      where: { id: notificationId, clientId: client.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete notification error:', error)
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
  }
}
