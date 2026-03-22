import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Get user_session cookie
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => c.trim().split('=')).filter(([k, v]) => k && v)
    )

    const userSession = cookies['user_session']

    if (!userSession) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 })
    }

    // Parse the session data
    const user = JSON.parse(decodeURIComponent(userSession))

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
