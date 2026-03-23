import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
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
