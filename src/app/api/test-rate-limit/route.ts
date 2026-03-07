import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Very strict rate limit for testing: 5 requests per minute
const TEST_RATE_LIMIT = 5
const WINDOW_MS = 60 * 1000 // 1 minute

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')

  if (forwarded) return forwarded.split(',')[0].trim()
  if (realIp) return realIp
  return 'unknown'
}

export async function GET(req: NextRequest) {
  const identifier = getClientIp(req)
  const key = `test-rate-limit:${identifier}`
  const now = new Date()
  const resetAt = new Date(now.getTime() + WINDOW_MS)

  try {
    // Use transaction for atomic operation
    const entry = await prisma.$transaction(async (tx) => {
      let record = await tx.rateLimitEntry.findUnique({
        where: { key },
      })

      if (!record || record.resetAt < now) {
        // Create or reset entry
        record = await tx.rateLimitEntry.upsert({
          where: { key },
          create: { key, count: 1, resetAt },
          update: { count: 1, resetAt },
        })
      } else {
        // Increment count
        record = await tx.rateLimitEntry.update({
          where: { key },
          data: { count: { increment: 1 } },
        })
      }

      return record
    })

    const remaining = Math.max(0, TEST_RATE_LIMIT - entry.count)
    const success = entry.count <= TEST_RATE_LIMIT

    const headers = {
      'X-RateLimit-Limit': String(TEST_RATE_LIMIT),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(resetAt.getTime()),
    }

    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000))
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. You made ${entry.count} requests, limit is ${TEST_RATE_LIMIT} per minute.`,
          retryAfter,
          resetAt: resetAt.toISOString(),
        },
        { status: 429, headers: { ...headers, 'Retry-After': String(retryAfter) } }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Request allowed',
        yourIp: identifier,
        requestNumber: entry.count,
        rateLimit: {
          limit: TEST_RATE_LIMIT,
          remaining,
          resetAt: resetAt.toISOString(),
        },
      },
      { headers }
    )
  } catch (error) {
    console.error('Rate limit test error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
