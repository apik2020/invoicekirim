import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// NextAuth cookie names to clear when secret rotation is detected
const NEXTAUTH_COOKIES = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  'next-auth.callback-url',
  '__Secure-next-auth.callback-url',
  'next-auth.csrf-token',
  '__Host-next-auth.csrf-token',
  'next-auth.pkce.code_verifier',
  '__Secure-next-auth.pkce.code_verifier',
]

// Marker cookie — once set, we know cleanup is done for this browser
const CLEANUP_DONE_COOKIE = '__nb_secret_v2'

/**
 * Clear all stale NextAuth cookies from a previous NEXTAUTH_SECRET.
 * Runs once per browser until the cleanup marker is set.
 */
function clearStaleNextAuthCookies(req: NextRequest): NextResponse | null {
  // Already cleaned up — skip
  if (req.cookies.get(CLEANUP_DONE_COOKIE)) {
    return null
  }

  // Only run cleanup if user has ANY next-auth cookie (means they had a session before)
  const hasStaleCookie = NEXTAUTH_COOKIES.some(name => req.cookies.get(name))
  if (!hasStaleCookie) {
    // No stale cookies — just set the marker so we never check again
    const resp = NextResponse.next()
    resp.cookies.set(CLEANUP_DONE_COOKIE, '1', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: true,
      sameSite: 'lax',
    })
    return resp
  }

  // Clear all stale NextAuth cookies and set marker
  const resp = NextResponse.next()
  for (const name of NEXTAUTH_COOKIES) {
    if (req.cookies.get(name)) {
      resp.cookies.set(name, '', { maxAge: 0, path: '/' })
    }
  }
  resp.cookies.set(CLEANUP_DONE_COOKIE, '1', {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: 'lax',
  })
  console.log('[MIDDLEWARE] Cleared stale NextAuth cookies (secret rotation cleanup)')
  return resp
}

export default async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl

  // === SECRET ROTATION CLEANUP ===
  // Must run BEFORE any NextAuth processing to prevent decryption errors
  const cleanupResponse = clearStaleNextAuthCookies(req)
  if (cleanupResponse) {
    // If this is a dashboard page request and we just cleared cookies,
    // redirect to login instead of continuing with no session
    if (pathname.startsWith('/dashboard')) {
      const url = new URL('/login', origin)
      url.searchParams.set('callbackUrl', encodeURI(pathname))
      const redirectResp = NextResponse.redirect(url)
      // Preserve the cookie cleanup on redirect
      for (const name of NEXTAUTH_COOKIES) {
        if (req.cookies.get(name)) {
          redirectResp.cookies.set(name, '', { maxAge: 0, path: '/' })
        }
      }
      redirectResp.cookies.set(CLEANUP_DONE_COOKIE, '1', {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: true,
        sameSite: 'lax',
      })
      return redirectResp
    }
    return cleanupResponse
  }

  // Handle static files - force correct MIME types and skip other middleware
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

    // Add cache headers for static files
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')

    return response
  }

  // Skip middleware for other Next.js internal paths
  if (pathname.startsWith('/_next/') || pathname.includes('/__nextjs')) {
    return NextResponse.next()
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
  const isAuthCallback = pathname.startsWith('/api/auth/callback')
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
    // Skip all internal Next.js paths
    '/((?!_next/static|_next/image|favicon.ico|images|fonts).*)',
    '/dashboard/:path*',
    '/client/:path*',
    '/admin/:path*',
    '/api/:path*',
    '/login',
    '/register',
  ],
}
