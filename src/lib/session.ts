import { cookies } from 'next/headers'

export interface UserSession {
  id: string
  email: string
  name: string
  image?: string | null
  isAdmin: boolean
}

/**
 * Get the current user session from the user_session cookie
 * Use this instead of getServerSession(authOptions) for API routes
 */
export async function getUserSession(): Promise<UserSession | null> {
  try {
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
