import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'

/**
 * Verify user is authenticated and NOT an admin
 * Use this for user dashboard API routes
 */
export async function verifyRegularUser(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      session: null,
    }
  }

  // Check if user is admin
  const admin = await prisma.admin.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  })

  if (admin) {
    return {
      error: NextResponse.json(
        { error: 'Akses ditolak. Gunakan /admin untuk akses admin dashboard' },
        { status: 403 }
      ),
      session: null,
    }
  }

  return { error: null, session }
}

/**
 * Verify user is authenticated (can be admin or regular user)
 */
export async function verifyAuthenticated(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      session: null,
    }
  }

  return { error: null, session }
}

/**
 * Check if session belongs to admin
 */
export async function isAdminSession(session: { email?: string | null }) {
  if (!session?.email) return false

  const admin = await prisma.admin.findUnique({
    where: { email: session.email },
    select: { id: true },
  })

  return !!admin
}
