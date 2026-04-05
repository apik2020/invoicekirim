import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Ping Neon database to prevent cold start
// Call this endpoint every 5 minutes from an external cron service (cron-job.org, EasyCron, GitHub Actions)
export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret')

  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
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