import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'error'
  timestamp: string
  version: string
  uptime: number
  checks: {
    database: { status: string; latency?: number; error?: string }
    redis: { status: string; error?: string }
  }
}

export async function GET() {
  const startTime = Date.now()
  const health: HealthCheckResult = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    uptime: process.uptime(),
    checks: {
      database: { status: 'pending' },
      redis: { status: 'pending' },
    },
  }

  // Check database connection
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    health.checks.database = {
      status: 'ok',
      latency: Date.now() - dbStart,
    }
  } catch (error) {
    health.status = 'error'
    health.checks.database = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  // Check Redis connection
  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!redisUrl || !redisToken) {
      health.checks.redis = {
        status: 'not_configured',
      }
    } else {
      const redisStart = Date.now()
      const response = await fetch(`${redisUrl}/ping`, {
        headers: {
          Authorization: `Bearer ${redisToken}`,
        },
      })

      if (response.ok) {
        health.checks.redis = {
          status: 'ok',
        }
      } else {
        throw new Error('Redis ping failed')
      }
    }
  } catch (error) {
    health.status = 'degraded' // Redis is not critical
    health.checks.redis = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  // Set overall status
  if (health.checks.database.status === 'error') {
    health.status = 'error'
  } else if (health.checks.redis.status === 'error') {
    health.status = 'degraded'
  }

  const statusCode = health.status === 'error' ? 503 : 200

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Response-Time': `${Date.now() - startTime}ms`,
    },
  })
}
