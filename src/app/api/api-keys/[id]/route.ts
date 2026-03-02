import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revokeApiKey, deleteApiKey } from '@/lib/api-keys'

// PUT /api/api-keys/[id] - Revoke/regenerate API key
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: keyId } = await params
    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId') || undefined

    const success = await revokeApiKey(keyId, {
      userId: teamId ? undefined : session.user.id,
      teamId,
    })

    if (!success) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking API key:', error)
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    )
  }
}

// DELETE /api/api-keys/[id] - Delete API key
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: keyId } = await params
    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId') || undefined

    const success = await deleteApiKey(keyId, {
      userId: teamId ? undefined : session.user.id,
      teamId,
    })

    if (!success) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting API key:', error)
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    )
  }
}
