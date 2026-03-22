import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { SignJWT } from 'jose'

// Simple login endpoint that bypasses NextAuth
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log('[LOGIN] Attempt:', email)

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password harus diisi' }, { status: 400 })
    }

    // Check Admin table first
    const admin = await prisma.admins.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, password: true }
    })

    if (admin && admin.password) {
      const isValid = await bcrypt.compare(password, admin.password)
      if (isValid) {
        console.log('[LOGIN] Admin login successful')
        const response = NextResponse.json({
          success: true,
          user: { id: admin.id, email: admin.email, name: admin.name, isAdmin: true }
        })
        // Set a simple session cookie
        response.cookies.set('user_session', JSON.stringify({
          id: admin.id,
          email: admin.email,
          name: admin.name,
          isAdmin: true
        }), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7 // 7 days
        })
        return response
      }
    }

    // Check User table
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, password: true, image: true }
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
    }

    console.log('[LOGIN] User login successful')

    // Check if admin
    const isAdmin = await prisma.admins.findUnique({
      where: { email },
      select: { id: true }
    }).then(a => !!a)

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        isAdmin
      }
    })

    // Set a simple session cookie
    response.cookies.set('user_session', JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      isAdmin
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error) {
    console.error('[LOGIN] Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
