import { getUserSession } from '@/lib/session'
import { NextResponse } from 'next/server'
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
    const session = await getUserSession()
    if (!session?.id || !session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate secret
    const { secret, uri } = generateTwoFactorSecret(session.email)

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
