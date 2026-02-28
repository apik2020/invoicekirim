import { NextRequest, NextResponse } from 'next/server'
import { clearAdminSession } from '@/lib/admin-session'

export async function POST(req: NextRequest) {
  try {
    await clearAdminSession()

    return NextResponse.json({
      success: true,
      message: 'Logout berhasil',
    })
  } catch (error) {
    console.error('Admin logout error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat logout' },
      { status: 500 }
    )
  }
}
