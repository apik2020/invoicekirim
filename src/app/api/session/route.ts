import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// NextAuth cookie names that may need clearing on decryption failure
const NEXTAUTH_COOKIES = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  'next-auth.callback-url',
  '__Secure-next-auth.callback-url',
  'next-auth.csrf-token',
  '__Host-next-auth.csrf-token',
  'next-auth.pkce.code_verifier',
  '__Secure-next-auth.pkce.code_verifier',
]

export async function GET() {
  try {
    const cookieStore = await cookies()

    // First, check NextAuth session (for Google OAuth users)
    let nextAuthSession = null
    try {
      nextAuthSession = await getServerSession(authOptions)
    } catch (err: any) {
      // JWT decryption failed — stale cookie from old NEXTAUTH_SECRET
      // Clear all NextAuth cookies so user can re-login cleanly
      if (err?.message?.includes('decryption') || err?.code === 'ERR_JWE_DECRYPTION_FAILED') {
        console.warn('[SESSION] Stale session cookie detected, clearing all NextAuth cookies')
        const response = NextResponse.json({ authenticated: false, user: null }, { status: 401 })
        for (const name of NEXTAUTH_COOKIES) {
          if (cookieStore.get(name)) {
            response.cookies.set(name, '', { maxAge: 0, path: '/' })
          }
        }
        return response
      }
      throw err
    }

    if (nextAuthSession?.user?.email) {
      // User is authenticated via NextAuth (Google OAuth)
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
        return NextResponse.json({
          authenticated: true,
          user: {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            image: dbUser.image,
            isAdmin: nextAuthSession.user.isAdmin || false
          }
        })
      }
    }

    // Fallback: Check custom user_session cookie (for credentials login)
    const userSessionCookie = cookieStore.get('user_session')

    if (!userSessionCookie?.value) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 })
    }

    const user = JSON.parse(userSessionCookie.value)

    if (!user?.id) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        isAdmin: user.isAdmin || false
      }
    })
  } catch (error) {
    console.error('[SESSION] Error:', error)
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 })
  }
}
