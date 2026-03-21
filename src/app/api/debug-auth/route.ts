import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.users.count()

    // Test finding a user
    const testUser = await prisma.users.findUnique({
      where: { email: 'test@example.com' },
      select: { id: true, email: true, password: true }
    })

    // Test bcrypt
    const testHash = await bcrypt.hash('test', 12)
    const bcryptWorks = await bcrypt.compare('test', testHash)

    // Test password comparison with actual user
    let passwordMatch = false
    if (testUser?.password) {
      passwordMatch = await bcrypt.compare('password123', testUser.password)
    }

    return NextResponse.json({
      status: 'ok',
      userCount,
      testUser: testUser ? {
        id: testUser.id,
        email: testUser.email,
        hasPassword: !!testUser.password,
        passwordLength: testUser.password?.length
      } : null,
      bcryptWorks,
      passwordMatch
    })
  } catch (error) {
    console.error('Debug auth error:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
