import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parsePaginationParams, createPaginationResponse, buildSearchQuery } from '@/lib/api-utils'
import { logger } from '@/lib/logger'
import { createClientSchema } from '@/lib/validations/common'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/clients
 *
 * Retrieves list of clients for the authenticated user with pagination and search
 *
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 50, max: 100)
 * @query search - Search term for name, email, or company
 *
 * @returns {PaginationResponse<Client>} List of clients with pagination info
 * @throws {401} Unauthorized - User not logged in
 * @throws {500} Internal Server Error
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession()

    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const { page, limit, skip, search } = parsePaginationParams(searchParams)

    const where: any = { userId: session.id }

    if (search) {
      where.OR = buildSearchQuery(search, ['name', 'email', 'company'])
    }

    const [clients, total] = await Promise.all([
      prisma.clients.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.clients.count({ where }),
    ])

    return NextResponse.json(
      createPaginationResponse(clients, total, page, limit)
    )
  } catch (error) {
    logger.apiError('/api/clients GET', error, session?.id)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/clients
 *
 * Creates a new client for the authenticated user
 *
 * @body {CreateClientSchema} Client data (name, email, phone, address, company, taxId, website)
 *
 * @returns {Client} Created client object
 * @throws {401} Unauthorized - User not logged in
 * @throws {422} Validation Error - Invalid client data
 * @throws {400} Bad Request - Client with email already exists
 * @throws {500} Internal Server Error
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession()

    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Validate with Zod schema
    const validation = createClientSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return NextResponse.json(
        {
          error: firstError?.message || 'Data tidak valid',
          details: validation.error.flatten().fieldErrors
        },
        { status: 422 }
      )
    }

    const { name, email, phone, address, companyName, taxNumber, website, notes } = validation.data

    // Check if client with same email already exists for this user (case-insensitive)
    const existingClient = await prisma.clients.findFirst({
      where: {
        userId: session.id,
        email: { equals: email, mode: 'insensitive' },
      },
    })

    if (existingClient) {
      return NextResponse.json(
        { error: 'Klien dengan email ini sudah ada' },
        { status: 400 }
      )
    }

    const client = await prisma.clients.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.id,
        name,
        email: email.toLowerCase(),
        phone,
        address,
        company: companyName,
        taxId: taxNumber,
        website,
        notes,
        updatedAt: new Date(),
      },
    })

    logger.info('Client created', { userId: session.id, clientId: client.id, clientName: name })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    logger.apiError('/api/clients POST', error, session?.id)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}
