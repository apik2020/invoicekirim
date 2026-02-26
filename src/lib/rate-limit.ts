import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Create Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

// Rate limiters for different use cases

// Strict rate limiter for auth endpoints (10 requests per 10 minutes)
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 m'),
  analytics: true,
  prefix: 'auth',
})

// Medium rate limiter for API endpoints (20 requests per minute)
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: true,
  prefix: 'api',
})

// Lenient rate limiter for public endpoints (100 requests per minute)
export const publicRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'public',
})

// Stripe webhook rate limiter (50 requests per minute)
export const webhookRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, '1 m'),
  analytics: true,
  prefix: 'webhook',
})

/**
 * Check rate limit and return appropriate response if exceeded
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param rateLimiter - The rate limiter instance to use
 * @returns Object with success status and rate limit info
 */
export async function checkRateLimit(
  identifier: string,
  rateLimiter: Ratelimit
) {
  try {
    const result = await rateLimiter.limit(identifier)

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    }
  } catch (error) {
    // If Redis is not configured, allow the request (fail open)
    console.error('Rate limit error:', error)
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    }
  }
}

/**
 * Get client IP address from request
 */
export function getClientIp(req: Request): string {
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
