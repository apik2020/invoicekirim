import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * Check if the current session belongs to an admin user
 * Returns the admin record if true, null otherwise
 */
export async function isAdminUser(session?: { email?: string | null }) {
  if (!session?.email) {
    return false
  }

  const admin = await prisma.admin.findUnique({
    where: { email: session.email },
    select: { id: true, email: true },
  })

  return !!admin
}

/**
 * Check if the current session belongs to a regular user
 * Returns the user record if true, null otherwise
 */
export async function isRegularUser(session?: { id?: string | null }) {
  if (!session?.id) {
    return false
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true },
  })

  return !!user
}

/**
 * Get user type from session
 * Returns 'ADMIN' | 'USER' | null
 */
export async function getUserType(session?: { id?: string | null; email?: string | null }) {
  if (!session) {
    return null
  }

  // Check if admin first
  if (session.email) {
    const admin = await prisma.admin.findUnique({
      where: { email: session.email },
      select: { id: true },
    })
    if (admin) return 'ADMIN'
  }

  // Check if regular user
  if (session.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true },
    })
    if (user) return 'USER'
  }

  return null
}

/**
 * Middleware response for admin-only routes
 */
export function adminOnlyResponse() {
  return NextResponse.json(
    { error: 'Akses ditolak. Halaman ini hanya untuk user biasa.' },
    { status: 403 }
  )
}

/**
 * Middleware response for user-only routes
 */
export function userOnlyResponse() {
  return NextResponse.json(
    { error: 'Akses ditolak. Halaman ini hanya untuk admin. Silakan login ke /admin/login' },
    { status: 403 }
  )
}
