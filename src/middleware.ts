import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl

  // Handle static files - force correct MIME types
  if (pathname.startsWith('/_next/static/')) {
    const response = NextResponse.next()

    // Force correct Content-Type for JavaScript files
    if (pathname.endsWith('.js') || pathname.endsWith('.mjs')) {
      response.headers.set('Content-Type', 'application/javascript; charset=utf-8')
    }

    // Force correct Content-Type for CSS files
    if (pathname.endsWith('.css')) {
      response.headers.set('Content-Type', 'text/css; charset=utf-8')
    }

    return response
  }

  const response = NextResponse.next()

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
    // Also skip for OAuth callbacks (Google, GitHub, etc.) and NextAuth endpoints
    // Also skip for auth-simple test endpoint
    // Also skip for file upload endpoint (uses multipart/form-data)
    // Also skip for cron endpoints (they use CRON_SECRET for authorization)
    if (pathname.includes('/webhooks/') || pathname.includes('/api/auth') || pathname.includes('/api/auth-simple') || pathname.includes('/api/cron/') || pathname === '/api/upload') {
      // Continue without CSRF check
    } else if (pathname.startsWith('/api/')) {
      // For API routes, check Origin/Referer matches host
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [`https://${host}`, `http://${host}`]
      const isValidOrigin = allowedOrigins.some(allowed => origin === allowed)
      const isValidReferer = allowedOrigins.some(allowed => referer.startsWith(allowed))

      // Allow if origin or referer is valid, or if it's a JSON/multipart API request from same origin
      const isValidContentType = contentType.includes('application/json') || contentType.includes('multipart/form-data')
      if (!isValidOrigin && !isValidReferer && !isValidContentType) {
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
  const userSessionToken = req.cookies.get('user_session')
  const adminSessionToken = req.cookies.get('admin_session')

  // Check if user has any valid authentication (NextAuth OR custom session)
  const isAuth = !!sessionToken || !!userSessionToken
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
  // Also allow webhooks (they have their own signature verification)
  const isWebhook = pathname.includes('/webhooks/')
  if (isClientPortal || isClientAPI || isWebhook) {
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
    '/_next/static/:path*',
  ],
}
