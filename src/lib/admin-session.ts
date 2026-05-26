import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

// Admin session cookie name
const ADMIN_SESSION_COOKIE = 'admin_session'
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface AdminSession {
  id: string
  email: string
  name: string
}

// Get JWT secret key
function getSecretKey(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET environment variable is required')
  }
  return new TextEncoder().encode(secret)
}

/**
 * Verify admin credentials and create session
 */
export async function verifyAdminCredentials(email: string, password: string) {
  const admin = await prisma.admins.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, password: true },
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
 * Create admin session cookie — signed JWT instead of plain base64
 */
export async function createAdminSession(admin: AdminSession) {
  const cookieStore = await cookies()

  // Create signed JWT
  const token = await new SignJWT({
    id: admin.id,
    email: admin.email,
    name: admin.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_MAX_AGE}s`)
    .sign(getSecretKey())

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: '/',
  })

  return token
}

/**
 * Get current admin session from cookies
 * Supports both new JWT format and legacy base64 format for backward compatibility
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)

  if (!sessionToken?.value) {
    return null
  }

  // Try new JWT format first
  try {
    const { payload } = await jwtVerify(sessionToken.value, getSecretKey(), {
      algorithms: ['HS256'],
    })

    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
    }
  } catch {
    // JWT verification failed — try legacy base64 format for backward compatibility
    try {
      const sessionData = JSON.parse(
        Buffer.from(sessionToken.value, 'base64').toString()
      )

      // Check if session expired (legacy format)
      if (sessionData.expiresAt && sessionData.expiresAt < Date.now()) {
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
  const admin = await prisma.admins.findUnique({
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
