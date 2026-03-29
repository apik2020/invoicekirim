import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const cookieStore = await cookies()

    // First, check NextAuth session (for Google OAuth users)
    const nextAuthSession = await getServerSession(authOptions)

    if (nextAuthSession?.user?.email) {
      // User is authenticated via NextAuth (Google OAuth)
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
