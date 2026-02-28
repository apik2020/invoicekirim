/**
 * Cache configuration and utilities
 */

// Cache durations in seconds
export const CACHE_DURATIONS = {
  // Short cache - 30 seconds
  SHORT: 30,
  // Medium cache - 5 minutes
  MEDIUM: 300,
  // Long cache - 1 hour
  LONG: 3600,
  // Very long cache - 1 day
  VERY_LONG: 86400,
}

/**
 * Cache headers for different resource types
 */
export const CACHE_HEADERS = {
  // Static assets that rarely change
  static: {
    'Cache-Control': 'public, max-age=31536000, immutable',
  },
  // API responses that change infrequently
  'api-static': {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  },
  // API responses that change frequently
  'api-dynamic': {
    'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
  },
  // User-specific data - no cache
  private: {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
  },
  // PDF downloads
  download: {
    'Cache-Control': 'private, max-age=86400',
  },
} as const

/**
 * Get cache headers for a specific type
 */
export function getCacheHeaders(type: keyof typeof CACHE_HEADERS) {
  return CACHE_HEADERS[type]
}

/**
 * Wrap fetch with cache configuration
 */
export function fetchWithCache(
  url: string,
  options: RequestInit = {},
  revalidate?: number
) {
  return fetch(url, {
    ...options,
    next: {
      revalidate: revalidate ?? CACHE_DURATIONS.MEDIUM,
    },
  })
}

/**
 * Create a cached response
 */
export function createCachedResponse(
  data: any,
  cacheType: keyof typeof CACHE_HEADERS = 'api-dynamic'
): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...CACHE_HEADERS[cacheType],
    },
  })
}

/**
 * Cache tags for revalidation
 */
export const CACHE_TAGS = {
  INVOICES: 'invoices',
  USERS: 'users',
  PRODUCTS: 'products',
  ANALYTICS: 'analytics',
  ACTIVITY_LOGS: 'activity-logs',
} as const

/**
 * Create a response with cache tags for Next.js revalidation
 */
export function createTaggedResponse(
  data: any,
  tags: string[]
): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'Next-Tags': tags.join(','),
    },
  })
}
