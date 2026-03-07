import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkRateLimit, getRateLimitType, getClientIp, createRateLimitResponse } from '@/lib/rate-limit'

// Security configuration
const SECURITY_CONFIG = {
  // Routes that don't require authentication
  publicRoutes: ['/login', '/register', '/pricing', '/invoice', '/client'],
  // Routes that require authentication
  protectedRoutes: ['/dashboard'],
  // API routes that need auth
  protectedAPIRoutes: ['/api/invoices', '/api/templates', '/api/payments', '/api/subscriptions'],
  // Routes that should never be accessible
  blockedRoutes: ['/api/admin', '/admin'],
}

export default async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl
  const response = NextResponse.next()

  // 0. Rate Limiting for API routes
  if (pathname.startsWith('/api/')) {
    const rateLimitType = getRateLimitType(pathname, req.method)
    const identifier = getClientIp(req)
    const rateLimitResult = await checkRateLimit(identifier, rateLimitType)

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit))
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining))
    response.headers.set('X-RateLimit-Reset', String(rateLimitResult.reset))

    // Block if rate limit exceeded
    if (!rateLimitResult.success) {
      const retryAfter = Math.max(1, Math.ceil((rateLimitResult.reset - Date.now()) / 1000))
      return new NextResponse(
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
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitResult.reset),
          },
        }
      )
    }
  }

  // 1. Security Headers (additional to next.config.ts)
  // Remove server information
  response.headers.delete('Server')
  response.headers.delete('X-Powered-By')

  // Add request ID for tracing
  const requestId = crypto.randomUUID()
  response.headers.set('X-Request-Id', requestId)

  // CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [process.env.NEXT_PUBLIC_APP_URL || '*']
    const requestOrigin = req.headers.get('origin')

    if (requestOrigin && (allowedOrigins.includes('*') || allowedOrigins.includes(requestOrigin))) {
      response.headers.set('Access-Control-Allow-Origin', requestOrigin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
      response.headers.set('Access-Control-Max-Age', '86400')
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers })
    }
  }

  // 2. CSRF Protection for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const contentType = req.headers.get('content-type') || ''
    const origin = req.headers.get('origin') || ''
    const referer = req.headers.get('referer') || ''
    const host = req.headers.get('host') || ''

    // Skip CSRF for API webhooks (they have their own signature verification)
    if (pathname.includes('/webhooks/')) {
      // Continue to auth check
    } else if (pathname.startsWith('/api/')) {
      // For API routes, check Origin/Referer matches host
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [`https://${host}`, `http://${host}`]
      const isValidOrigin = allowedOrigins.some(allowed => origin === allowed)
      const isValidReferer = allowedOrigins.some(allowed => referer.startsWith(allowed))

      // Allow if origin or referer is valid, or if it's a JSON API request from same origin
      if (!isValidOrigin && !isValidReferer && !contentType.includes('application/json')) {
        return new NextResponse(
          JSON.stringify({ error: 'CSRF validation failed' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }
  }

  // 3. Authentication check
  const sessionToken = req.cookies.get('next-auth.session-token') ||
                      req.cookies.get('__Secure-next-auth.session-token')
  const adminSessionToken = req.cookies.get('admin_session')

  const isAuth = !!sessionToken
  const isAdminAuth = !!adminSessionToken
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isDashboardPage = pathname.startsWith('/dashboard')
  const isClientPortal = pathname.startsWith('/client')
  const isClientAPI = pathname.startsWith('/api/client')
  const isProtectedAPI = pathname.startsWith('/api/invoices') ||
                         pathname.startsWith('/api/templates') ||
                         pathname.startsWith('/api/payments') ||
                         pathname.startsWith('/api/subscriptions')

  // Allow access to auth pages
  if (isAuthPage) {
    return response
  }

  // Client portal and client API are public
  if (isClientPortal || isClientAPI) {
    return response
  }

  // Redirect unauthenticated users to login
  if ((isDashboardPage || isProtectedAPI) && !isAuth) {
    if (isProtectedAPI) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL('/login', origin)
    url.searchParams.set('callbackUrl', encodeURI(pathname))
    return NextResponse.redirect(url)
  }

  // 4. Admin route protection
  const isAdminLoginPage = pathname === '/admin/login'
  const isAdminLoginAPI = pathname === '/api/admin/login'
  const isAdminAPI = pathname.startsWith('/api/admin')

  // Allow admin login page and API without auth
  if (isAdminLoginPage || isAdminLoginAPI) {
    return response
  }

  if (isAdminAPI || pathname.startsWith('/admin')) {
    // Admin routes use their own session cookie (admin_session)
    // The actual admin check happens in the API handler
    if (!isAdminAuth) {
      if (isAdminAPI) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return NextResponse.redirect(new URL('/admin/login', origin))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/client/:path*',
    '/admin/:path*',
    '/api/:path*',
    '/login',
    '/register',
  ],
}
