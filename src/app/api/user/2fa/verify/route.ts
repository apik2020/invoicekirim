import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyTwoFactorCode, enableTwoFactor } from '@/lib/two-factor'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// POST /api/user/2fa/verify - Verify 2FA code and enable 2FA
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { code, secret, backupCodes } = body

    if (!code || !secret || !backupCodes || !Array.isArray(backupCodes)) {
      return NextResponse.json(
        { error: 'Code, secret, dan backup codes diperlukan' },
        { status: 400 }
      )
    }

    // Verify the code
    if (!verifyTwoFactorCode(secret, code)) {
      return NextResponse.json(
        { error: 'Kode verifikasi tidak valid' },
        { status: 400 }
      )
    }

    // Enable 2FA for the user
    await enableTwoFactor(session.user.id, secret, backupCodes)

    return NextResponse.json({
      success: true,
      message: '2FA berhasil diaktifkan',
    })
  } catch (error) {
    console.error('2FA verify error:', error)
    return NextResponse.json(
      { error: 'Gagal memverifikasi 2FA' },
      { status: 500 }
    )
  }
}
