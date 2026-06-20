import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getClientSession } from '@/lib/client-auth'
import { logger } from '@/lib/logger'

// GET - Get client notification preferences
export async function GET() {
  let client
  try {
    client = await getClientSession()

    if (!client) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let preferences = await prisma.client_notification_preferences.findUnique({
      where: { clientId: client.id },
    })

    // Create default preferences if not exist
    if (!preferences) {
      preferences = await prisma.client_notification_preferences.create({
        data: { clientId: client.id },
      })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    logger.apiError('/api/client/preferences GET', error, client?.id)
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
  }
}

// PUT - Update client notification preferences
export async function PUT(request: NextRequest) {
  let client
  try {
    client = await getClientSession()

    if (!client) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      emailNotification,
      invoiceSent,
      paymentReminder,
      paymentReceived,
      overdueAlert,
      newMessage,
    } = body

    const preferences = await prisma.client_notification_preferences.upsert({
      where: { clientId: client.id },
      update: {
        emailNotification,
        invoiceSent,
        paymentReminder,
        paymentReceived,
        overdueAlert,
        newMessage,
        updatedAt: new Date(),
      },
      create: {
        clientId: client.id,
        emailNotification,
        invoiceSent,
        paymentReminder,
        paymentReceived,
        overdueAlert,
        newMessage,
      },
    })

    return NextResponse.json(preferences)
  } catch (error) {
    logger.apiError('/api/client/preferences PUT', error, client?.id)
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
  }
}
