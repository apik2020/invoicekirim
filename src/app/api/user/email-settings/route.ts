import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// PUT - Update email settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
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

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
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
    console.error('Update email settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update email settings' },
      { status: 500 }
    )
  }
}
