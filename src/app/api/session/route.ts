import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userSessionCookie = cookieStore.get('user_session')

    if (!userSessionCookie) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 })
    }

    const userSession = userSessionCookie.value

    if (!userSession) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 })
    }

    // Parse the session data
    const user = JSON.parse(userSession)

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
