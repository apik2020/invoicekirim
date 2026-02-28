/**
 * API Error Handler Utilities
 * Provides consistent error handling across API routes
 */

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad Request') {
    super(message, 400, 'BAD_REQUEST')
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

// Export for api-handler
export { ForbiddenError }

export class NotFoundError extends ApiError {
  constructor(message: string = 'Not Found') {
    super(message, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Conflict') {
    super(message, 409, 'CONFLICT')
  }
}

export class ValidationError extends ApiError {
  constructor(message: string = 'Validation Error') {
    super(message, 422, 'VALIDATION_ERROR')
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message: string = 'Too Many Requests') {
    super(message, 429, 'TOO_MANY_REQUESTS')
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal Server Error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR')
  }
}

/**
 * Handle API errors and return appropriate NextResponse
 */
export function handleApiError(error: unknown) {
  console.error('API Error:', error)

  // Prisma errors
  if (error && typeof error === 'object') {
    if ('code' in error) {
      const prismaError = error as { code: string; message?: string }

      // Connection errors
      if (prismaError.code === 'P1001') {
        return Response.json(
          {
            error: 'Tidak dapat terhubung ke database. Silakan coba lagi.',
            code: 'DATABASE_CONNECTION_ERROR'
          },
          { status: 503 }
        )
      }

      // Unique constraint violation
      if (prismaError.code === 'P2002') {
        return Response.json(
          {
            error: 'Data sudah ada. Silakan gunakan nilai lain.',
            code: 'DUPLICATE_ENTRY'
          },
          { status: 409 }
        )
      }

      // Record not found
      if (prismaError.code === 'P2025') {
        return Response.json(
          {
            error: 'Data tidak ditemukan.',
            code: 'RECORD_NOT_FOUND'
          },
          { status: 404 }
        )
      }

      // Foreign key constraint
      if (prismaError.code === 'P2003') {
        return Response.json(
          {
            error: 'Data terkait tidak valid.',
            code: 'FOREIGN_KEY_CONSTRAINT'
          },
          { status: 400 }
        )
      }
    }
  }

  // Custom API errors
  if (error instanceof ApiError) {
    return Response.json(
      {
        error: error.message,
        code: error.code
      },
      { status: error.statusCode }
    )
  }

  // Generic errors
  if (error instanceof Error) {
    return Response.json(
      {
        error: process.env.NODE_ENV === 'development'
          ? error.message
          : 'Terjadi kesalahan. Silakan coba lagi.',
        code: 'UNKNOWN_ERROR'
      },
      { status: 500 }
    )
  }

  // Unknown errors
  return Response.json(
    {
      error: 'Terjadi kesalahan yang tidak diketahui.',
      code: 'UNKNOWN_ERROR'
    },
    { status: 500 }
  )
}

/**
 * Async wrapper to catch errors in API handlers
 */
export function withErrorHandler<T>(
  handler: (...args: any[]) => Promise<T>
): (...args: any[]) => Promise<T> {
  return async (...args: any[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      throw error // Re-throw to be handled by the API route's try-catch
    }
  }
}
