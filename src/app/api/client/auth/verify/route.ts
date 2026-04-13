import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSignedSessionToken } from '@/lib/client-auth'

// Verify magic link token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Find client with this token
    const client = await prisma.client_accounts.findFirst({
      where: {
        magicLinkToken: token,
        magicLinkExpires: {
          gte: new Date(),
        },
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      )
    }

    // Clear magic link token
    await prisma.client_accounts.update({
      where: { id: client.id },
      data: {
        magicLinkToken: null,
        magicLinkExpires: null,
      },
    })

    // Create HMAC-signed session token
    const sessionToken = createSignedSessionToken({
      clientId: client.id,
      email: client.email,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    // Redirect to client dashboard with session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

    const response = NextResponse.redirect(`${baseUrl}/client/dashboard`)
    response.cookies.set('client_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Client verify error:', error)
    return NextResponse.json(
      { error: 'Failed to verify token' },
      { status: 500 }
    )
  }
}
