import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { disableTwoFactor, verifyTwoFactor } from '@/lib/two-factor'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// POST /api/user/2fa/disable - Disable 2FA
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { code, password } = body

    // Require either 2FA code or password to disable
    if (!code && !password) {
      return NextResponse.json(
        { error: 'Kode 2FA atau password diperlukan untuk menonaktifkan 2FA' },
        { status: 400 }
      )
    }

    // If code is provided, verify it
    if (code) {
      const result = await verifyTwoFactor(session.user.id, code)
      if (!result.success) {
        return NextResponse.json(
          { error: 'Kode 2FA tidak valid' },
          { status: 400 }
        )
      }
    } else if (password) {
      // Verify password (import bcrypt and check)
      const { prisma } = await import('@/lib/prisma')
      const bcrypt = await import('bcryptjs')

      const user = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { password: true },
      })

      if (!user?.password || !(await bcrypt.compare(password, user.password))) {
        return NextResponse.json(
          { error: 'Password tidak valid' },
          { status: 400 }
        )
      }
    }

    // Disable 2FA
    await disableTwoFactor(session.user.id)

    return NextResponse.json({
      success: true,
      message: '2FA berhasil dinonaktifkan',
    })
  } catch (error) {
    console.error('2FA disable error:', error)
    return NextResponse.json(
      { error: 'Gagal menonaktifkan 2FA' },
      { status: 500 }
    )
  }
}
