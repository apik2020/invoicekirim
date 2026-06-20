import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  // Block this endpoint in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const { email, password } = body

    logger.dev('TEST-LOGIN', 'Attempt:', email)

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
    }

    // Check admin table
    const admin = await prisma.admins.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, password: true }
    })

    logger.dev('TEST-LOGIN', 'Admin found:', !!admin)

    if (admin && admin.password) {
      const isValid = await bcrypt.compare(password, admin.password)
      logger.dev('TEST-LOGIN', 'Admin password valid:', isValid)
      if (isValid) {
        return NextResponse.json({ success: true, user: { id: admin.id, email: admin.email, name: admin.name, type: 'admin' } })
      }
    }

    // Check user table
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, password: true }
    })

    logger.dev('TEST-LOGIN', 'User found:', !!user)

    if (!user || !user.password) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    logger.dev('TEST-LOGIN', 'User password valid:', isValid)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name, type: 'user' } })
  } catch (error) {
    logger.apiError('/api/test-login POST', error)
    return NextResponse.json({
      error: 'Internal server error',
    }, { status: 500 })
  }
}
