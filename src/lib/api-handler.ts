/**
 * API Route Handler Wrapper
 * Provides consistent error handling and response formatting for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { handleApiError, UnauthorizedError } from './api-error'

type Handler = (req: NextRequest, context?: any) => Promise<NextResponse>

interface RouteConfig {
  requireAuth?: boolean
  requireAdmin?: boolean
  rateLimit?: {
    max: number
    window: number // in milliseconds
  }
}

/**
 * Wraps API route handlers with authentication and error handling
 */
export function withApiHandler(
  handler: Handler,
  config: RouteConfig = {}
): Handler {
  return async (req: NextRequest, context?: any) => {
    try {
      // Authentication check
      if (config.requireAuth) {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
          throw new UnauthorizedError('Anda harus login terlebih dahulu')
        }

        // Admin check
        if (config.requireAdmin) {
          const { prisma } = await import('@/lib/prisma')
          const isAdmin = await prisma.admin.findUnique({
            where: { email: session.user.email },
            select: { id: true },
          })

          if (!isAdmin && process.env.NODE_ENV !== 'development') {
            throw new ForbiddenError('Anda tidak memiliki akses ke halaman ini')
          }
        }
      }

      // Call the actual handler
      return await handler(req, context)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

/**
 * HTTP Method helpers
 */
export const GET = (handler: Handler, config?: RouteConfig) => withApiHandler(handler, config)
export const POST = (handler: Handler, config?: RouteConfig) => withApiHandler(handler, config)
export const PUT = (handler: Handler, config?: RouteConfig) => withApiHandler(handler, config)
export const PATCH = (handler: Handler, config?: RouteConfig) => withApiHandler(handler, config)
export const DELETE = (handler: Handler, config?: RouteConfig) => withApiHandler(handler, config)

/**
 * Typed response helpers
 */
export function success(data: any, message?: string) {
  return NextResponse.json({
    success: true,
    data,
    ...(message && { message })
  })
}

export function created(data: any, message?: string) {
  return NextResponse.json({
    success: true,
    data,
    ...(message && { message })
  }, { status: 201 })
}

export function fail(message: string, code?: string, statusCode: number = 400) {
  return NextResponse.json({
    success: false,
    error: message,
    ...(code && { code })
  }, { status: statusCode })
}
