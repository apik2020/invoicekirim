import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { createWebhook, listWebhooks, WEBHOOK_EVENTS } from '@/lib/webhooks'
import { z } from 'zod'

const createWebhookSchema = z.object({
  teamId: z.string(),
  name: z.string().min(1).max(100),
  url: z.string().url('Must be a valid URL'),
  events: z.array(z.string()).min(1, 'At least one event is required'),
})

// GET /api/webhooks - List webhooks
export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')

    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 })
    }

    const webhooks = await listWebhooks(teamId)

    return NextResponse.json({ webhooks, events: WEBHOOK_EVENTS })
  } catch (error) {
    console.error('Error fetching webhooks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    )
  }
}

// POST /api/webhooks - Create a new webhook
export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = createWebhookSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.flatten() },
        { status: 400 }
      )
    }

    // Validate events
    const validEvents = Object.keys(WEBHOOK_EVENTS)
    const invalidEvents = validated.data.events.filter(e => !validEvents.includes(e))
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Invalid events: ${invalidEvents.join(', ')}` },
        { status: 400 }
      )
    }

    const webhook = await createWebhook({
      teamId: validated.data.teamId,
      name: validated.data.name,
      url: validated.data.url,
      events: validated.data.events,
    })

    // Only return the secret once
    return NextResponse.json({ webhook }, { status: 201 })
  } catch (error) {
    console.error('Error creating webhook:', error)
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    )
  }
}
