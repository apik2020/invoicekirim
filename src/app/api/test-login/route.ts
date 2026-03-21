import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log('[TEST-LOGIN] Attempt:', email)

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
    }

    // Check admin table
    const admin = await prisma.admins.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, password: true }
    })

    console.log('[TEST-LOGIN] Admin found:', !!admin)

    if (admin && admin.password) {
      const isValid = await bcrypt.compare(password, admin.password)
      console.log('[TEST-LOGIN] Admin password valid:', isValid)
      if (isValid) {
        return NextResponse.json({ success: true, user: { id: admin.id, email: admin.email, name: admin.name, type: 'admin' } })
      }
    }

    // Check user table
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, password: true }
    })

    console.log('[TEST-LOGIN] User found:', !!user)

    if (!user || !user.password) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    console.log('[TEST-LOGIN] User password valid:', isValid)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name, type: 'user' } })
  } catch (error) {
    console.error('[TEST-LOGIN] Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
