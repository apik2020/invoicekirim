import { NextRequest, NextResponse } from 'next/server'
import { verifyResetToken } from '@/lib/password-reset'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ valid: false, error: 'Token tidak ditemukan' })
  }

  const email = await verifyResetToken(token)

  if (!email) {
    return NextResponse.json({ valid: false, error: 'Token tidak valid atau sudah kadaluarsa' })
  }

  return NextResponse.json({ valid: true, email })
}
