import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  // In production, CRON_SECRET is mandatory
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[CRON] CRON_SECRET is not set in production — rejecting request')
      return false
    }
    // Allow without secret only in development
    console.warn('[CRON] No CRON_SECRET set — allowed in development only')
    return true
  }

  return authHeader === `Bearer ${secret}`
}

// Ping Neon database to prevent cold start
// Call this endpoint every 5 minutes from an external cron service (cron-job.org, EasyCron, GitHub Actions)
export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Keep-Alive] Pinging Neon database...')

    // Simple ping query
    await prisma.$queryRaw`SELECT 1 as ping`

    console.log(`[Keep-Alive] Database is alive - ${new Date().toISOString()}`)

    return NextResponse.json({
      success: true,
      message: 'Neon database is alive',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Keep-Alive] Error pinging Neon:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to ping database' },
      { status: 500 }
    )
  }
}
