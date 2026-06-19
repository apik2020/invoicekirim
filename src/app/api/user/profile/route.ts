import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { updateProfileSchema } from '@/lib/validations/common'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/user/profile
 *
 * Retrieves the authenticated user's profile and company info.
 *
 * @returns {User} User profile (id, name, email, company info, SMTP settings)
 * @throws {401} Unauthorized - User not logged in
 * @throws {404} Not Found - User not found
 * @throws {500} Internal Server Error
 */
export async function GET(_req: NextRequest) {
  let session
  try {
    session = await getUserSession()

    logger.dev('Profile', 'Session:', session?.email, 'ID:', session?.id)

    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.users.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        companyEmail: true,
        companyPhone: true,
        companyAddress: true,
        smtpHost: true,
        smtpPort: true,
        smtpSecure: true,
        smtpUser: true,
      },
    })

    logger.dev('Profile', 'User found:', !!user)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    logger.apiError('/api/user/profile GET', error, session?.id)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/user/profile
 *
 * Updates the authenticated user's profile (name and company info). Only the
 * fields provided in the body are updated.
 *
 * @body {UpdateProfileSchema} Profile data (optional: name, companyName, companyEmail, companyPhone, companyAddress)
 *
 * @returns {User} Updated user profile
 * @throws {401} Unauthorized - User not logged in
 * @throws {422} Validation Error - Invalid profile data
 * @throws {500} Internal Server Error
 */
export async function PUT(req: NextRequest) {
  let session
  try {
    session = await getUserSession()

    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Validate with Zod schema
    const validation = updateProfileSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        {
          error: firstError?.message || 'Data tidak valid',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 422 }
      )
    }

    const { name, companyName, companyEmail, companyPhone, companyAddress } = validation.data

    // Update user profile (undefined fields are ignored by Prisma)
    const updatedUser = await prisma.users.update({
      where: { id: session.id },
      data: {
        name,
        companyName,
        companyEmail,
        companyPhone,
        companyAddress,
      },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        companyEmail: true,
        companyPhone: true,
        companyAddress: true,
      },
    })

    logger.info('Profile updated', { userId: session.id })

    return NextResponse.json(updatedUser)
  } catch (error) {
    logger.apiError('/api/user/profile PUT', error, session?.id)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
