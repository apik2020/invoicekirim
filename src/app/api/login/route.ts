import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { encryptSession } from '@/lib/session'

// Simple login endpoint that bypasses NextAuth
const isDev = process.env.NODE_ENV !== 'production'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (isDev) console.log('[LOGIN] Attempt:', email)
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
        if (isDev) console.log('[LOGIN] Admin login successful')
        const response = NextResponse.json({
          success: true,
          user: { id: admin.id, email: admin.email, name: admin.name, isAdmin: true }
        })

        // Set encrypted session cookie
        const token = await encryptSession({
          id: admin.id,
          email: admin.email,
          name: admin.name,
          isAdmin: true
        })
        response.cookies.set('user_session', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7
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

    if (isDev) console.log('[LOGIN] User login successful')

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

    // Set encrypted session cookie
    const token = await encryptSession({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      isAdmin
    })
    response.cookies.set('user_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    })

    return response
  } catch (error) {
    console.error('[LOGIN] Error:', error)
    return NextResponse.json({
      error: 'Terjadi kesalahan saat login. Silakan coba lagi.',
    }, { status: 500 })
  }
}
