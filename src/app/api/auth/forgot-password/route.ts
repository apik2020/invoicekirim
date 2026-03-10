import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import {
  findUserByEmail,
  createPasswordResetToken,
} from '@/lib/password-reset'
import { sendPasswordResetEmail } from '@/lib/email'
import { checkRateLimit, getClientIp, authRateLimit } from '@/lib/rate-limit'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email tidak valid'),
})

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(req)
    const rateLimit = await checkRateLimit(`forgot-password:${ip}`, authRateLimit)

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
    const validation = forgotPasswordSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Email tidak valid' },
        { status: 400 }
      )
    }

    const { email } = validation.data

    // Find user by email
    const user = await findUserByEmail(email)

    // Return error if email not registered
    if (!user) {
      return NextResponse.json(
        { error: 'Email tidak terdaftar dalam sistem kami' },
        { status: 400 }
      )
    }

    // Generate reset token
    const resetData = await createPasswordResetToken(email)

    // Create reset URL
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${resetData.token}`

    // Send password reset email
    await sendPasswordResetEmail({
      to: email,
      userName: user.name || 'Pengguna',
      resetUrl,
      expiresIn: '1 jam',
    })

    return NextResponse.json({
      message: 'Link reset password telah dikirim ke email Anda',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
