import { Ratelimit, type RatelimitConfig } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import type { NextRequest } from 'next/server'

// Check if Redis is configured
const isRedisConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
)

// Create Redis client (lazy initialization)
let redis: Redis | null = null
function getRedis(): Redis | null {
  if (!isRedisConfigured) return null
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return redis
}

// Rate limit configurations per endpoint type
interface RateLimitConfig {
  limiter: RatelimitConfig['limiter']
  prefix: string
  analytics?: boolean
  timeout?: number
}

const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints - very strict
  auth: {
    limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 requests per 15 minutes
    prefix: 'ratelimit:auth',
    analytics: true,
    timeout: 5000,
  },

  // Password reset - extremely strict
  passwordReset: {
    limiter: Ratelimit.slidingWindow(3, '1 h'), // 3 requests per hour
    prefix: 'ratelimit:password-reset',
    analytics: true,
  },

  // General API endpoints - moderate
  api: {
    limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 requests per minute
    prefix: 'ratelimit:api',
    analytics: true,
  },

  // Read-heavy endpoints - lenient
  read: {
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
    prefix: 'ratelimit:read',
    analytics: true,
  },

  // Write endpoints - stricter
  write: {
    limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 requests per minute
    prefix: 'ratelimit:write',
    analytics: true,
  },

  // Public endpoints - lenient but tracked
  public: {
    limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute
    prefix: 'ratelimit:public',
    analytics: true,
  },

  // Webhooks - moderate (legitimate webhooks shouldn't spam)
  webhook: {
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
    prefix: 'ratelimit:webhook',
    analytics: true,
  },

  // Payment endpoints - strict
  payment: {
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
    prefix: 'ratelimit:payment',
    analytics: true,
  },

  // Email sending - very strict
  email: {
    limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 emails per hour per IP
    prefix: 'ratelimit:email',
    analytics: true,
  },

  // File uploads - strict
  upload: {
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 uploads per minute
    prefix: 'ratelimit:upload',
    analytics: true,
  },

  // Search endpoints - moderate
  search: {
    limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 searches per minute
    prefix: 'ratelimit:search',
    analytics: true,
  },
} as const satisfies Record<string, RateLimitConfig>

// Create rate limiters (lazy initialization)
const rateLimiters = new Map<string, Ratelimit>()

function getRateLimiter(config: RateLimitConfig): Ratelimit | null {
  const redisClient = getRedis()
  if (!redisClient) return null

  let limiter = rateLimiters.get(config.prefix)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redisClient,
      limiter: config.limiter,
      prefix: config.prefix,
      analytics: config.analytics ?? true,
      timeout: config.timeout,
    })
    rateLimiters.set(config.prefix, limiter)
  }
  return limiter
}

// Legacy exports for backward compatibility
export const authRateLimit = {
  limit: async (identifier: string) => {
    const limiter = getRateLimiter(RATE_LIMIT_CONFIGS.auth)
    if (!limiter) return createFallbackResult()
    return limiter.limit(identifier)
  },
}

export const apiRateLimit = {
  limit: async (identifier: string) => {
    const limiter = getRateLimiter(RATE_LIMIT_CONFIGS.api)
    if (!limiter) return createFallbackResult()
    return limiter.limit(identifier)
  },
}

export const publicRateLimit = {
  limit: async (identifier: string) => {
    const limiter = getRateLimiter(RATE_LIMIT_CONFIGS.public)
    if (!limiter) return createFallbackResult()
    return limiter.limit(identifier)
  },
}

export const webhookRateLimit = {
  limit: async (identifier: string) => {
    const limiter = getRateLimiter(RATE_LIMIT_CONFIGS.webhook)
    if (!limiter) return createFallbackResult()
    return limiter.limit(identifier)
  },
}

// Helper function to create fallback result
function createFallbackResult() {
  return {
    success: true,
    limit: 0,
    remaining: 0,
    reset: 0,
    pending: Promise.resolve(),
  }
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
    pending?: Promise<unknown>
  }>
}

/**
 * Check rate limit for a specific endpoint type
 * Supports both new string-based type and legacy rate limiter objects
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
  const limiter = getRateLimiter(config)

  if (!limiter) {
    // Fail open if Redis is not configured
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
      headers: {},
    }
  }

  try {
    const result = await limiter.limit(identifier)

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
    // Log error but fail open
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
