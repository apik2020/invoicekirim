import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { SignJWT } from 'jose'

export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requireAdminAuth()
    if (result.error || !result.admin) {
      return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 })
    }

    const { id: userId } = await params
    const body = await req.json().catch(() => ({}))
    const { reason } = body

    // Get user
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create impersonation token
    const token = crypto.randomUUID()

    // Create impersonation session record
    await prisma.impersonation_sessions.create({
      data: {
        id: crypto.randomUUID(),
        adminId: result.admin.id,
        targetUserId: userId,
        token,
        reason: reason || null,
      },
    })

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: crypto.randomUUID(),
        userId: userId,
        action: 'CREATED',
        entityType: 'impersonation_session',
        entityId: token,
        title: `Admin ${result.admin.email} started impersonating user ${user.email}`,
        description: reason || 'No reason provided',
        metadata: {
          adminId: result.admin.id,
          adminEmail: result.admin.email,
          userEmail: user.email,
        },
      },
    })

    // Create a session token for the user
    const secretKey = new TextEncoder().encode(JWT_SECRET)
    const sessionToken = await new SignJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
      impersonating: true,
      impersonationToken: token,
      adminId: result.admin.id,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h') // Short-lived session for impersonation
      .sign(secretKey)

    return NextResponse.json({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      redirectUrl: `/dashboard?impersonating=true`,
    })
  } catch (error) {
    console.error('Error creating impersonation session:', error)
    return NextResponse.json({ error: 'Failed to create impersonation session' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requireAdminAuth()
    if (result.error || !result.admin) {
      return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 })
    }

    const { id: userId } = await params
    const url = new URL(req.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find and end the impersonation session
    const session = await prisma.impersonation_sessions.findFirst({
      where: {
        token,
        targetUserId: userId,
        endedAt: null,
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Impersonation session not found' }, { status: 404 })
    }

    // End the session
    await prisma.impersonation_sessions.update({
      where: { id: session.id },
      data: {
        endedAt: new Date(),
        endReason: 'Admin ended session',
      },
    })

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: crypto.randomUUID(),
        userId: userId,
        action: 'UPDATED',
        entityType: 'impersonation_session',
        entityId: session.id,
        title: `Admin ${result.admin.email} ended impersonation session`,
        metadata: {
          adminId: result.admin.id,
          adminEmail: result.admin.email,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error ending impersonation session:', error)
    return NextResponse.json({ error: 'Failed to end impersonation session' }, { status: 500 })
  }
}
