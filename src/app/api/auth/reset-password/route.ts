import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import {
  verifyResetToken,
  deleteResetToken,
  updateUserPassword,
} from '@/lib/password-reset'
import { checkRateLimit, getClientIp, authRateLimit } from '@/lib/rate-limit'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token tidak valid'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
    .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmPassword'],
})

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(req)
    const rateLimit = await checkRateLimit(`reset-password:${ip}`, authRateLimit)

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
          retryAfter: rateLimit.reset,
        },
        { status: 429 }
      )
    }

    const body = await req.json()
    const validation = resetPasswordSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || 'Data tidak valid' },
        { status: 400 }
      )
    }

    const { token, password } = validation.data

    // Verify token
    const email = await verifyResetToken(token)

    if (!email) {
      return NextResponse.json(
        { error: 'Link reset password tidak valid atau sudah kadaluarsa. Silakan minta link baru.' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password
    await updateUserPassword(email, hashedPassword)

    // Delete used token
    await deleteResetToken(token)

    return NextResponse.json({
      message: 'Password berhasil diubah. Silakan login dengan password baru.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
