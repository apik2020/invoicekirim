import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'

export interface UserSession {
  id: string
  email: string
  name: string
  image?: string | null
  isAdmin: boolean
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
    const userSessionCookie = cookieStore.get('user_session')

    if (!userSessionCookie?.value) {
      return null
    }

    const session = JSON.parse(userSessionCookie.value) as UserSession

    if (!session?.id) {
      return null
    }

    return session
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
