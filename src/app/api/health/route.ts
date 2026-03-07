import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'error'
  timestamp: string
  version: string
  uptime: number
  checks: {
    database: { status: string; latency?: number; error?: string }
    rateLimit: { status: string; latency?: number; error?: string }
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
      rateLimit: { status: 'pending' },
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

  // Check rate limiting (PostgreSQL-based)
  try {
    const rateLimitStart = Date.now()

    // Check if rate_limit_entries table exists and is accessible
    await prisma.rateLimitEntry.count()
    health.checks.rateLimit = {
      status: 'ok',
      latency: Date.now() - rateLimitStart,
    }
  } catch (error) {
    health.status = 'degraded' // Rate limiting is not critical
    health.checks.rateLimit = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  // Set overall status
  if (health.checks.database.status === 'error') {
    health.status = 'error'
  } else if (health.checks.rateLimit.status === 'error') {
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
