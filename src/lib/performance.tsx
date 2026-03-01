import React from 'react'
import { logger } from './logger'

/**
 * Performance monitoring utilities
 */

/**
 * Measure performance of a function
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  try {
    return await fn()
  } finally {
    const duration = performance.now() - start
    logger.dev('Performance', `${name}: ${duration.toFixed(2)}ms`)

    // Log slow operations as warnings
    if (duration > 1000) {
      logger.warn(`[Performance Warning] ${name} took ${duration.toFixed(2)}ms`)
    }
  }
}

/**
 * Report Web Vitals
 */
export function reportWebVitals(metric: any) {
  const { name, value, id } = metric

  // Log in development only
  logger.dev('Web Vitals', `${name}:`, value)

  // Send to analytics in production (if configured)
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to your analytics service
    // fetch('/api/analytics/web-vitals', {
    //   method: 'POST',
    //   body: JSON.stringify({ name, value, id }),
    // })
  }
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Lazy load component with loading state
 */
export function withLoadingState<P extends object>(
  Component: React.ComponentType<P>,
  LoadingComponent: React.ComponentType = () => <div>Loading...</div>
) {
  return function LazyLoadedComponent(props: P) {
    return (
      <React.Suspense fallback={<LoadingComponent />}>
        <Component {...props} />
      </React.Suspense>
    )
  }
}

/**
 * Memoize expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}
