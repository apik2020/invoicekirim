import { NextResponse } from 'next/server'
import { getClientSession } from '@/lib/client-auth'

export async function GET() {
  try {
    const client = await getClientSession()

    if (!client) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Get client me error:', error)
    return NextResponse.json(
      { error: 'Failed to get client data' },
      { status: 500 }
    )
  }
}
