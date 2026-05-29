/**
 * Shared API Utilities
 * Reusable functions to reduce duplication across API routes
 */

import { Prisma } from '@prisma/client'

// Standardized pagination response (replaces 3 different formats)
export interface PaginationResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * Creates a standardized pagination response
 * @param data - Array of items for current page
 * @param total - Total number of items across all pages
 * @param page - Current page number (1-indexed)
 * @param limit - Items per page
 * @returns Standardized pagination response object
 */
export function createPaginationResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResponse<T> {
  const totalPages = Math.ceil(total / limit)

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    }
  }
}

/**
 * Builds Prisma search query for text search across multiple fields
 * @param searchTerm - The search term
 * @param fields - Array of field names to search
 * @returns Array of Prisma string filters for OR conditions
 *
 * @example
 * const searchConditions = buildSearchQuery(searchTerm, ['name', 'email', 'companyName'])
 * const clients = await prisma.clients.findMany({
 *   where: {
 *     AND: [
 *       { userId: session.id },
 *       { OR: searchConditions }
 *     ]
 *   }
 * })
 */
export function buildSearchQuery(
  searchTerm: string,
  fields: string[]
): Record<string, Prisma.StringFilter>[] {
  return fields.map(field => ({
    [field]: {
      contains: searchTerm,
      mode: 'insensitive' as Prisma.QueryMode
    }
  }))
}

/**
 * Parses pagination parameters from URL search params with validation
 * @param searchParams - URLSearchParams from Next.js request
 * @returns Validated pagination parameters with skip offset calculated
 *
 * @example
 * export async function GET(req: NextRequest) {
 *   const { searchParams } = new URL(req.url)
 *   const { page, limit, skip, search } = parsePaginationParams(searchParams)
 *
 *   const [items, total] = await Promise.all([
 *     prisma.items.findMany({ skip, take: limit }),
 *     prisma.items.count()
 *   ])
 *
 *   return NextResponse.json(createPaginationResponse(items, total, page, limit))
 * }
 */
export function parsePaginationParams(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100) // Max 100
  const search = searchParams.get('search') || undefined

  const validPage = Math.max(1, page) // Minimum 1
  const validLimit = Math.max(1, limit) // Minimum 1

  return {
    page: validPage,
    limit: validLimit,
    skip: (validPage - 1) * validLimit,
    search,
  }
}

/**
 * Safely parses JSON from request body with error handling
 * @param req - Next.js request object
 * @returns Parsed JSON body or null if invalid
 */
export async function safeJsonParse<T = unknown>(
  req: Request
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await req.json()
    return { success: true, data: body as T }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { success: false, error: 'Invalid JSON format' }
    }
    return { success: false, error: 'Failed to parse request body' }
  }
}

/**
 * Extracts query parameter as string with optional default
 */
export function getQueryParam(
  searchParams: URLSearchParams,
  key: string,
  defaultValue?: string
): string | undefined {
  return searchParams.get(key) || defaultValue
}

/**
 * Extracts query parameter as number with validation
 */
export function getQueryParamNumber(
  searchParams: URLSearchParams,
  key: string,
  defaultValue?: number
): number | undefined {
  const value = searchParams.get(key)
  if (!value && defaultValue !== undefined) return defaultValue
  if (!value) return undefined

  const parsed = parseInt(value)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Extracts query parameter as boolean
 */
export function getQueryParamBoolean(
  searchParams: URLSearchParams,
  key: string,
  defaultValue: boolean = false
): boolean {
  const value = searchParams.get(key)
  if (!value) return defaultValue

  return value === 'true' || value === '1'
}

/**
 * Builds date range filter for Prisma queries
 * @param startDate - Optional start date (ISO string)
 * @param endDate - Optional end date (ISO string)
 * @returns Prisma date filter object
 */
export function buildDateRangeFilter(
  startDate?: string,
  endDate?: string
): Prisma.DateTimeFilter | undefined {
  if (!startDate && !endDate) return undefined

  const filter: Prisma.DateTimeFilter = {}

  if (startDate) {
    filter.gte = new Date(startDate)
  }

  if (endDate) {
    // Include the entire end date (set to end of day)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    filter.lte = end
  }

  return filter
}
