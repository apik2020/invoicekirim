import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

// Admin session cookie name
const ADMIN_SESSION_COOKIE = 'admin_session'
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface AdminSession {
  id: string
  email: string
  name: string
}

/**
 * Verify admin credentials and create session
 */
export async function verifyAdminCredentials(email: string, password: string) {
  const admin = await prisma.admin.findUnique({
    where: { email },
  })

  if (!admin || !admin.password) {
    return null
  }

  const isValidPassword = await bcrypt.compare(password, admin.password)
  if (!isValidPassword) {
    return null
  }

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
  }
}

/**
 * Create admin session cookie
 */
export async function createAdminSession(admin: AdminSession) {
  const cookieStore = await cookies()

  // Create session token (simple base64 encoded JSON)
  const sessionToken = Buffer.from(JSON.stringify({
    ...admin,
    expiresAt: Date.now() + ADMIN_SESSION_MAX_AGE * 1000,
  })).toString('base64')

  cookieStore.set(ADMIN_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: '/',
  })

  return sessionToken
}

/**
 * Get current admin session from cookies
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)

  if (!sessionToken) {
    return null
  }

  try {
    const sessionData = JSON.parse(Buffer.from(sessionToken.value, 'base64').toString())

    // Check if session expired
    if (sessionData.expiresAt < Date.now()) {
      return null
    }

    return {
      id: sessionData.id,
      email: sessionData.email,
      name: sessionData.name,
    }
  } catch {
    return null
  }
}

/**
 * Clear admin session
 */
export async function clearAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_SESSION_COOKIE)
}

/**
 * Middleware to verify admin session
 * Returns object with error if not authenticated
 */
export async function requireAdminAuth() {
  const session = await getAdminSession()

  if (!session) {
    return {
      error: 'Unauthorized - Please login as admin',
      session: null,
      admin: null,
    }
  }

  // Verify admin still exists in database
  const admin = await prisma.admin.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true },
  })

  if (!admin) {
    await clearAdminSession()
    return {
      error: 'Admin not found',
      session: null,
      admin: null,
    }
  }

  return { error: null, session, admin }
}
