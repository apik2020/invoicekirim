import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  // In production, CRON_SECRET is mandatory
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('[CRON] CRON_SECRET is not set in production — rejecting request')
      return false
    }
    // Allow without secret only in development
    logger.warn('[CRON] No CRON_SECRET set — allowed in development only')
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
    logger.dev('Keep-Alive', 'Pinging Neon database...')

    // Simple ping query
    await prisma.$queryRaw`SELECT 1 as ping`

    logger.dev('Keep-Alive', `Database is alive - ${new Date().toISOString()}`)

    return NextResponse.json({
      success: true,
      message: 'Neon database is alive',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.apiError('/api/cron/keep-alive POST', error)
    return NextResponse.json(
      { success: false, error: 'Failed to ping database' },
      { status: 500 }
    )
  }
}
