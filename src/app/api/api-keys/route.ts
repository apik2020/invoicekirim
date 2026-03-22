import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import {
  createApiKey,
  listApiKeys,
  API_SCOPES,
} from '@/lib/api-keys'
import { z } from 'zod'

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  teamId: z.string().optional(),
  scopes: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional(),
})

// GET /api/api-keys - List API keys
export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId') || undefined

    const keys = await listApiKeys({
      userId: teamId ? undefined : session.id,
      teamId,
    })

    return NextResponse.json({ keys, scopes: API_SCOPES })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

// POST /api/api-keys - Create a new API key
export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = createApiKeySchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.flatten() },
        { status: 400 }
      )
    }

    const apiKey = await createApiKey({
      name: validated.data.name,
      userId: validated.data.teamId ? undefined : session.id,
      teamId: validated.data.teamId,
      scopes: validated.data.scopes,
      expiresAt: validated.data.expiresAt ? new Date(validated.data.expiresAt) : undefined,
    })

    // Only return the full key once
    return NextResponse.json({ apiKey }, { status: 201 })
  } catch (error) {
    console.error('Error creating API key:', error)
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    )
  }
}
