import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { SignJWT } from 'jose'

const log = (...args: any[]) => console.log('[AUTH-CREDS]', ...args)

// Secret for JWT signing
const getSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET || 'default-secret-key-min-32-chars-long'
  return new TextEncoder().encode(secret)
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    log('Login attempt:', email)

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
    }

    // Check Admin table first
    const admin = await prisma.admins.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, password: true }
    })

    log('Admin found:', !!admin)

    if (admin && admin.password) {
      const isValid = await bcrypt.compare(password, admin.password)
      log('Admin password valid:', isValid)
      if (isValid) {
        const token = await new SignJWT({
          id: admin.id,
          email: admin.email,
          name: admin.name,
          isAdmin: true
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('7d')
          .sign(getSecret())

        const response = NextResponse.redirect(new URL('/admin', request.url))
        response.cookies.set('next-auth.session-token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7 // 7 days
        })
        return response
      }
    }

    // Check User table
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, image: true, password: true }
    })

    log('User found:', !!user)

    if (!user || !user.password) {
      return NextResponse.redirect(new URL('/login?error=InvalidCredentials', request.url))
    }

    const isValid = await bcrypt.compare(password, user.password)
    log('User password valid:', isValid)

    if (!isValid) {
      return NextResponse.redirect(new URL('/login?error=InvalidCredentials', request.url))
    }

    // Check if admin
    const isAdmin = await prisma.admins.findUnique({
      where: { email: user.email },
      select: { id: true }
    })

    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      isAdmin: !!isAdmin
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(getSecret())

    const response = NextResponse.redirect(new URL('/dashboard', request.url))
    response.cookies.set('next-auth.session-token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    return response
  } catch (error) {
    log('Auth error:', error)
    return NextResponse.redirect(new URL('/login?error=ServerError', request.url))
  }
}
