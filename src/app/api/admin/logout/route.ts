import { NextRequest, NextResponse } from 'next/server'
import { clearAdminSession } from '@/lib/admin-session'
import { logger } from '@/lib/logger'

export async function POST(_req: NextRequest) {
  try {
    await clearAdminSession()

    return NextResponse.json({
      success: true,
      message: 'Logout berhasil',
    })
  } catch (error) {
    logger.apiError('/api/admin/logout POST', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat logout' },
      { status: 500 }
    )
  }
}
