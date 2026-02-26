import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Get session token from cookies
  const sessionToken = req.cookies.get('next-auth.session-token') ||
                      req.cookies.get('__Secure-next-auth.session-token')

  const isAuth = !!sessionToken
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isDashboardPage = pathname.startsWith('/dashboard')
  const isClientPortal = pathname.startsWith('/client')
  const isClientAPI = pathname.startsWith('/api/client')
  const isProtectedAPI = pathname.startsWith('/api/invoices') || pathname.startsWith('/api/templates')

  // Redirect authenticated users away from auth pages
  if (isAuthPage && isAuth) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Client portal and client API are public - no authentication needed
  if (isClientPortal || isClientAPI) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users to login
  if ((isDashboardPage || isProtectedAPI) && !isAuth) {
    const url = new URL('/login', req.url)
    url.searchParams.set('callbackUrl', encodeURI(pathname))
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/client/:path*',
    '/api/invoices/:path*',
    '/api/templates/:path*',
    '/api/client/:path*',
    '/login',
    '/register',
  ],
}
