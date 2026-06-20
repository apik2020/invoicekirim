import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  let session
  try {
    session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const [logs, total] = await Promise.all([
      prisma.activity_logs.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.activity_logs.count({
        where: { userId: session.id },
      }),
    ])

    return NextResponse.json({
      logs,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    })
  } catch (error) {
    logger.apiError('/api/user/activity-logs GET', error, session?.id)
    return NextResponse.json(
      { error: 'Gagal mengambil activity logs' },
      { status: 500 }
    )
  }
}
