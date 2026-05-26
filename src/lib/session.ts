import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'
import { SignJWT, jwtVerify } from 'jose'

export interface UserSession {
  id: string
  email: string
  name: string
  image?: string | null
  isAdmin: boolean
}

const SESSION_COOKIE = 'user_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function getSecretKey(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET environment variable is required')
  }
  return new TextEncoder().encode(secret)
}

/**
 * Encrypt session data into a signed JWT
 */
export async function encryptSession(session: UserSession): Promise<string> {
  return new SignJWT({
    id: session.id,
    email: session.email,
    name: session.name,
    image: session.image || null,
    isAdmin: session.isAdmin,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecretKey())
}

/**
 * Decrypt a signed JWT session token
 * Also supports legacy plain JSON format for backward compatibility
 */
export async function decryptSession(token: string): Promise<UserSession | null> {
  // Try new JWT format first
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ['HS256'],
    })

    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      image: payload.image as string | null,
      isAdmin: (payload.isAdmin as boolean) || false,
    }
  } catch {
    // JWT verification failed — try legacy plain JSON format for backward compatibility
    try {
      const session = JSON.parse(token) as UserSession
      if (!session?.id) return null
      return session
    } catch {
      return null
    }
  }
}

/**
 * Set the user session cookie (signed JWT)
 */
export async function setUserSessionCookie(session: UserSession): Promise<string> {
  const token = await encryptSession(session)
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })

  return token
}

/**
 * Get the current user session from either NextAuth (OAuth) or custom user_session cookie
 * This provides a unified session interface for all API routes
 */
export async function getUserSession(): Promise<UserSession | null> {
  try {
    // First, try NextAuth session (for Google OAuth, etc.)
    const nextAuthSession = await getServerSession(authOptions)

    if (nextAuthSession?.user?.id) {
      // Get fresh user data from database
      const dbUser = await prisma.users.findUnique({
        where: { id: nextAuthSession.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        }
      })

      if (dbUser) {
        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name || '',
          image: dbUser.image,
          isAdmin: nextAuthSession.user.isAdmin || false
        }
      }
    }

    // Fallback: Check custom user_session cookie (for credentials login)
    const cookieStore = await cookies()
    const userSessionCookie = cookieStore.get(SESSION_COOKIE)

    if (!userSessionCookie?.value) {
      return null
    }

    return await decryptSession(userSessionCookie.value)
  } catch (error) {
    console.error('[getUserSession] Error:', error)
    return null
  }
}

/**
 * Require authentication - returns session or throws a response
 * Use this in API routes that require authentication
 */
export async function requireAuth(): Promise<UserSession> {
  const session = await getUserSession()

  if (!session) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return session
}
