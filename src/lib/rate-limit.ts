import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

// Rate limit configurations per endpoint type
interface RateLimitConfig {
  limit: number
  windowMs: number // Window in milliseconds
  prefix: string
}

const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints - very strict
  auth: {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 5 requests per 15 minutes
    prefix: 'ratelimit:auth',
  },

  // Password reset - extremely strict
  passwordReset: {
    limit: 3,
    windowMs: 60 * 60 * 1000, // 3 requests per hour
    prefix: 'ratelimit:password-reset',
  },

  // General API endpoints - moderate
  api: {
    limit: 30,
    windowMs: 60 * 1000, // 30 requests per minute
    prefix: 'ratelimit:api',
  },

  // Read-heavy endpoints - lenient
  read: {
    limit: 100,
    windowMs: 60 * 1000, // 100 requests per minute
    prefix: 'ratelimit:read',
  },

  // Write endpoints - stricter
  write: {
    limit: 20,
    windowMs: 60 * 1000, // 20 requests per minute
    prefix: 'ratelimit:write',
  },

  // Public endpoints - lenient but tracked
  public: {
    limit: 60,
    windowMs: 60 * 1000, // 60 requests per minute
    prefix: 'ratelimit:public',
  },

  // Webhooks - moderate (legitimate webhooks shouldn't spam)
  webhook: {
    limit: 100,
    windowMs: 60 * 1000, // 100 requests per minute
    prefix: 'ratelimit:webhook',
  },

  // Payment endpoints - strict
  payment: {
    limit: 10,
    windowMs: 60 * 1000, // 10 requests per minute
    prefix: 'ratelimit:payment',
  },

  // Email sending - very strict
  email: {
    limit: 5,
    windowMs: 60 * 60 * 1000, // 5 emails per hour per IP
    prefix: 'ratelimit:email',
  },

  // File uploads - strict
  upload: {
    limit: 10,
    windowMs: 60 * 1000, // 10 uploads per minute
    prefix: 'ratelimit:upload',
  },

  // Search endpoints - moderate
  search: {
    limit: 30,
    windowMs: 60 * 1000, // 30 searches per minute
    prefix: 'ratelimit:search',
  },
} as const satisfies Record<string, RateLimitConfig>

/**
 * Check rate limit using PostgreSQL
 */
async function checkPostgresRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  const key = `${config.prefix}:${identifier}`
  const now = new Date()
  const resetAt = new Date(now.getTime() + config.windowMs)

  try {
    // Use upsert for atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // Clean up expired entries first
      await tx.rateLimitEntry.deleteMany({
        where: {
          resetAt: { lt: now },
        },
      })

      // Get or create entry
      let entry = await tx.rateLimitEntry.findUnique({
        where: { key },
      })

      if (!entry || entry.resetAt < now) {
        // Create new entry or reset expired entry
        entry = await tx.rateLimitEntry.upsert({
          where: { key },
          create: {
            key,
            count: 1,
            resetAt,
          },
          update: {
            count: 1,
            resetAt,
          },
        })
      } else {
        // Increment count
        entry = await tx.rateLimitEntry.update({
          where: { key },
          data: {
            count: { increment: 1 },
          },
        })
      }

      return entry
    })

    const remaining = Math.max(0, config.limit - result.count)
    const success = result.count <= config.limit

    return {
      success,
      limit: config.limit,
      remaining,
      reset: resetAt.getTime(),
    }
  } catch (error) {
    console.error('Rate limit error:', error)
    // Fail open - allow request if database error
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      reset: resetAt.getTime(),
    }
  }
}

// Legacy exports for backward compatibility
export const authRateLimit = {
  limit: async (identifier: string) => {
    const result = await checkPostgresRateLimit(identifier, RATE_LIMIT_CONFIGS.auth)
    return result
  },
}

export const apiRateLimit = {
  limit: async (identifier: string) => {
    const result = await checkPostgresRateLimit(identifier, RATE_LIMIT_CONFIGS.api)
    return result
  },
}

export const publicRateLimit = {
  limit: async (identifier: string) => {
    const result = await checkPostgresRateLimit(identifier, RATE_LIMIT_CONFIGS.public)
    return result
  },
}

export const webhookRateLimit = {
  limit: async (identifier: string) => {
    const result = await checkPostgresRateLimit(identifier, RATE_LIMIT_CONFIGS.webhook)
    return result
  },
}

// Endpoint-specific rate limiting
export type RateLimitType = keyof typeof RATE_LIMIT_CONFIGS

// Type for legacy rate limiter objects
type LegacyRateLimiter = {
  limit: (identifier: string) => Promise<{
    success: boolean
    limit: number
    remaining: number
    reset: number
  }>
}

/**
 * Check rate limit for a specific endpoint type
 */
export async function checkRateLimit(
  identifier: string,
  typeOrLimiter: RateLimitType | LegacyRateLimiter = 'api'
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
  headers: Record<string, string>
}> {
  // Handle legacy rate limiter object
  if (typeof typeOrLimiter === 'object' && 'limit' in typeOrLimiter) {
    try {
      const result = await typeOrLimiter.limit(identifier)
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        headers: {
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': String(result.reset),
        },
      }
    } catch (error) {
      console.error('Rate limit error:', error)
      return {
        success: true,
        limit: 0,
        remaining: 0,
        reset: 0,
        headers: {},
      }
    }
  }

  // Handle new string-based type
  const config = RATE_LIMIT_CONFIGS[typeOrLimiter]
  const result = await checkPostgresRateLimit(identifier, config)

  return {
    ...result,
    headers: {
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(result.reset),
    },
  }
}

/**
 * Determine rate limit type based on request path and method
 */
export function getRateLimitType(pathname: string, method: string): RateLimitType {
  // Authentication routes
  if (pathname.includes('/auth/') || pathname === '/api/auth/[...nextauth]') {
    return 'auth'
  }

  // Password reset
  if (pathname.includes('/reset-password') || pathname.includes('/forgot-password')) {
    return 'passwordReset'
  }

  // Payment routes
  if (pathname.includes('/payments') || pathname.includes('/checkout')) {
    return 'payment'
  }

  // Webhook routes
  if (pathname.includes('/webhooks/')) {
    return 'webhook'
  }

  // Email routes
  if (pathname.includes('/email') || pathname.includes('/send')) {
    return 'email'
  }

  // Upload routes
  if (pathname.includes('/upload') || pathname.includes('/files')) {
    return 'upload'
  }

  // Search routes
  if (pathname.includes('/search')) {
    return 'search'
  }

  // Write operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return 'write'
  }

  // Read operations
  if (method === 'GET') {
    return 'read'
  }

  // Default to API
  return 'api'
}

/**
 * Get client IP address from request
 */
export function getClientIp(req: Request | NextRequest): string {
  // Try various headers for IP address
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const cfConnectingIp = req.headers.get('cf-connecting-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIp) {
    return realIp
  }

  if (cfConnectingIp) {
    return cfConnectingIp
  }

  return 'anonymous'
}

/**
 * Create a rate limit response with proper headers
 */
export function createRateLimitResponse(
  result: Awaited<ReturnType<typeof checkRateLimit>>
): Response | null {
  if (result.success) {
    return null
  }

  const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))

  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        ...result.headers,
      },
    }
  )
}

/**
 * Higher-order function to wrap API handlers with rate limiting
 */
export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  type?: RateLimitType
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const pathname = new URL(req.url).pathname
    const rateLimitType = type || getRateLimitType(pathname, req.method)
    const identifier = getClientIp(req)

    const result = await checkRateLimit(identifier, rateLimitType)
    const rateLimitResponse = createRateLimitResponse(result)

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const response = await handler(req)

    // Add rate limit headers to response
    Object.entries(result.headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }
}

/**
 * Clean up expired rate limit entries (can be called by cron job)
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  const result = await prisma.rateLimitEntry.deleteMany({
    where: {
      resetAt: { lt: new Date() },
    },
  })
  return result.count
}
