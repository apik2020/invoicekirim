import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'
import { verifyApiKey } from './api-keys'
import { checkRateLimit, getRateLimitType } from './rate-limit'

/**
 * Verify user is authenticated and NOT an admin
 * Use this for user dashboard API routes
 */
export async function verifyRegularUser(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      session: null,
    }
  }

  // Check if user is admin
  const admin = await prisma.admin.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  })

  if (admin) {
    return {
      error: NextResponse.json(
        { error: 'Akses ditolak. Gunakan /admin untuk akses admin dashboard' },
        { status: 403 }
      ),
      session: null,
    }
  }

  return { error: null, session }
}

/**
 * Verify user is authenticated (can be admin or regular user)
 */
export async function verifyAuthenticated(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      session: null,
    }
  }

  return { error: null, session }
}

/**
 * Check if session belongs to admin
 */
export async function isAdminSession(session: { email?: string | null }) {
  if (!session?.email) return false

  const admin = await prisma.admin.findUnique({
    where: { email: session.email },
    select: { id: true },
  })

  return !!admin
}

// ============================================
// API KEY AUTHENTICATION
// ============================================

export interface ApiKeyContext {
  id: string
  userId?: string
  teamId?: string
  scopes: string[]
}

/**
 * Authenticate with API key
 */
export async function authenticateApiKey(req: NextRequest): Promise<{
  valid: boolean
  apiKey?: ApiKeyContext
  error?: NextResponse
}> {
  // Get API key from Authorization header
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      ),
    }
  }

  const key = authHeader.slice(7) // Remove 'Bearer ' prefix

  // Verify the API key
  const result = await verifyApiKey(key)
  if (!result.valid || !result.apiKey) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      ),
    }
  }

  return { valid: true, apiKey: result.apiKey }
}

/**
 * Check if API key has required scope
 */
export function hasScope(apiKey: { scopes: string[] }, requiredScope: string): boolean {
  // Check for wildcard scope
  if (apiKey.scopes.includes('*')) {
    return true
  }

  // Check for exact scope match
  if (apiKey.scopes.includes(requiredScope)) {
    return true
  }

  // Check for resource-level wildcard (e.g., 'invoices:*' matches 'invoices:read')
  const [resource] = requiredScope.split(':')
  if (apiKey.scopes.includes(`${resource}:*`)) {
    return true
  }

  return false
}

/**
 * Higher-order function to wrap API handlers with API key auth
 */
export function withApiKeyAuth(
  handler: (req: NextRequest, context: { apiKey: ApiKeyContext }) => Promise<NextResponse>,
  options?: { scopes?: string[] }
) {
  return async (req: NextRequest) => {
    const authResult = await authenticateApiKey(req)

    if (!authResult.valid || !authResult.apiKey) {
      return authResult.error!
    }

    // Check required scopes
    if (options?.scopes) {
      for (const scope of options.scopes) {
        if (!hasScope(authResult.apiKey, scope)) {
          return NextResponse.json(
            { error: `Missing required scope: ${scope}` },
            { status: 403 }
          )
        }
      }
    }

    // Rate limiting
    const identifier = authResult.apiKey.id
    const pathname = new URL(req.url).pathname
    const rateLimitType = getRateLimitType(pathname, req.method)
    const rateLimitResult = await checkRateLimit(identifier, rateLimitType)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
            ...rateLimitResult.headers,
          },
        }
      )
    }

    // Call the handler with the API key context
    const response = await handler(req, { apiKey: authResult.apiKey })

    // Add rate limit headers to response
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }
}
