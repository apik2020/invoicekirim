import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  generateTwoFactorSecret,
  generateQRCode,
  generateBackupCodes,
} from '@/lib/two-factor'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// POST /api/user/2fa/setup - Generate 2FA secret and QR code
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate secret
    const { secret, uri } = generateTwoFactorSecret(session.user.email)

    // Generate QR code
    const qrCodeDataUrl = await generateQRCode(uri)

    // Generate backup codes
    const backupCodes = generateBackupCodes()

    return NextResponse.json({
      secret,
      qrCode: qrCodeDataUrl,
      backupCodes,
      uri, // Include URI for manual entry
    })
  } catch (error) {
    console.error('2FA setup error:', error)
    return NextResponse.json(
      { error: 'Gagal menyiapkan 2FA' },
      { status: 500 }
    )
  }
}
