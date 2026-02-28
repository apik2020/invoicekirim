import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Verify that the current session belongs to an admin user
 * @returns Promise that resolves to the admin record or rejects with an error response
 */
export async function verifyAdmin() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 })
  }

  // Admin role check from Admin table (separate from User table)
  const admin = await prisma.admin.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, name: true },
  })

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized - Not admin' }, { status: 403 })
  }

  return admin
}

/**
 * Verify that the current session belongs to an admin user
 * Returns null if not authenticated/admin, instead of throwing error
 * Useful for client-side checks
 */
export async function checkAdmin() {
  try {
    const admin = await verifyAdmin()
    // If admin is a NextResponse, it means verification failed
    if (admin instanceof NextResponse) {
      return null
    }
    return admin
  } catch {
    return null
  }
}

/**
 * Get the current session
 */
export async function getSession() {
  return await getServerSession(authOptions)
}
