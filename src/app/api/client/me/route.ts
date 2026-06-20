import { NextResponse } from 'next/server'
import { getClientSession } from '@/lib/client-auth'
import { logger } from '@/lib/logger'

export async function GET() {
  let client
  try {
    client = await getClientSession()

    if (!client) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    logger.apiError('/api/client/me GET', error, client?.id)
    return NextResponse.json(
      { error: 'Failed to get client data' },
      { status: 500 }
    )
  }
}
