import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminCredentials, createAdminSession } from '@/lib/admin-session'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password harus diisi' },
        { status: 400 }
      )
    }

    // Verify admin credentials
    const admin = await verifyAdminCredentials(email, password)

    if (!admin) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    // Create admin session
    await createAdminSession(admin)

    return NextResponse.json({
      success: true,
      message: 'Login berhasil',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat login' },
      { status: 500 }
    )
  }
}
