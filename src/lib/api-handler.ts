/**
 * API Route Handler Wrapper
 * Provides consistent error handling and response formatting for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { handleApiError, UnauthorizedError, ForbiddenError, ValidationError } from './api-error'
import { z } from 'zod'

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
          const isAdmin = session.user.email ? await prisma.admins.findUnique({
            where: { email: session.user.email },
            select: { id: true },
          }) : null

          if (!isAdmin && process.env.NODE_ENV !== 'development') {
            throw new ForbiddenError('Anda tidak memiliki akses ke halaman ini')
          }
        }
      }

      // Call the actual handler
      return await handler(req, context)
    } catch (error) {
      const response = handleApiError(error)
      // Convert Response to NextResponse
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      })
    }
  }
}

/**
 * HTTP Method helpers
 * Note: Renamed to avoid conflicts with Next.js route handler exports
 */
export const createGetHandler = (handler: Handler, config?: RouteConfig) => withApiHandler(handler, config)
export const createPostHandler = (handler: Handler, config?: RouteConfig) => withApiHandler(handler, config)
export const createPutHandler = (handler: Handler, config?: RouteConfig) => withApiHandler(handler, config)
export const createPatchHandler = (handler: Handler, config?: RouteConfig) => withApiHandler(handler, config)
export const createDeleteHandler = (handler: Handler, config?: RouteConfig) => withApiHandler(handler, config)

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

/**
 * Wraps handler with Zod validation for request body
 *
 * @example
 * import { withValidation } from '@/lib/api-handler'
 * import { createClientSchema } from '@/lib/validations/common'
 *
 * export const POST = withValidation(
 *   createClientSchema,
 *   async (req, validatedData) => {
 *     const session = await getUserSession()
 *     if (!session) throw new UnauthorizedError()
 *
 *     const client = await prisma.clients.create({
 *       data: { ...validatedData, userId: session.id }
 *     })
 *
 *     return success(client, 'Klien berhasil dibuat')
 *   }
 * )
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (req: NextRequest, validatedData: T, context?: any) => Promise<NextResponse>
): Handler {
  return async (req: NextRequest, context?: any) => {
    try {
      // Parse JSON body
      let body: unknown
      try {
        body = await req.json()
      } catch (error) {
        throw new ValidationError('Invalid JSON format')
      }

      // Validate with Zod schema
      const validation = schema.safeParse(body)

      if (!validation.success) {
        const firstError = validation.error.errors[0]
        const fieldErrors = validation.error.flatten().fieldErrors

        // Return detailed validation errors
        return NextResponse.json({
          success: false,
          error: firstError?.message || 'Data tidak valid',
          details: fieldErrors
        }, { status: 422 })
      }

      // Call handler with validated data
      return await handler(req, validation.data, context)
    } catch (error) {
      const response = handleApiError(error)
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      })
    }
  }
}

/**
 * Combines validation and authentication in a single wrapper
 *
 * @example
 * export const POST = withValidatedAuth(
 *   createClientSchema,
 *   async (req, validatedData, session) => {
 *     const client = await prisma.clients.create({
 *       data: { ...validatedData, userId: session.id }
 *     })
 *     return success(client)
 *   }
 * )
 */
export function withValidatedAuth<T>(
  schema: z.ZodSchema<T>,
  handler: (req: NextRequest, validatedData: T, session: any, context?: any) => Promise<NextResponse>
): Handler {
  return withValidation(schema, async (req, validatedData, context) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new UnauthorizedError('Anda harus login terlebih dahulu')
    }

    return handler(req, validatedData, session, context)
  })
}
