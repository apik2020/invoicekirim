import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// PUT - Update email settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getUserSession()

    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass } = body

    // Build update data
    const updateData: any = {}

    if (smtpHost !== undefined && smtpHost !== '') {
      updateData.smtpHost = smtpHost
    }
    if (smtpPort !== undefined && smtpPort !== '') {
      updateData.smtpPort = smtpPort
    }
    if (smtpSecure !== undefined) {
      updateData.smtpSecure = smtpSecure
    }
    if (smtpUser !== undefined && smtpUser !== '') {
      updateData.smtpUser = smtpUser
    }
    // Only update password if provided
    if (smtpPass !== undefined && smtpPass !== '') {
      updateData.smtpPass = smtpPass
    }

    const updatedUser = await prisma.users.update({
      where: { id: session.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        smtpHost: true,
        smtpPort: true,
        smtpSecure: true,
        smtpUser: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    logger.apiError('/api/user/email-settings PUT', error)
    return NextResponse.json(
      { error: 'Failed to update email settings' },
      { status: 500 }
    )
  }
}
