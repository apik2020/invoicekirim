import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requireAdminAuth()
    if (result.error || !result.admin) {
      return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const announcement = await prisma.announcements.findUnique({
      where: { id },
      include: {
        _count: {
          select: { announcement_reads: true },
        },
        announcement_reads: {
          take: 20,
          orderBy: { readAt: 'desc' },
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    return NextResponse.json(announcement)
  } catch (error) {
    console.error('Error fetching announcement:', error)
    return NextResponse.json({ error: 'Failed to fetch announcement' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requireAdminAuth()
    if (result.error || !result.admin) {
      return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const existingAnnouncement = await prisma.announcements.findUnique({
      where: { id },
    })

    if (!existingAnnouncement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (body.title !== undefined) updateData.title = body.title
    if (body.message !== undefined) updateData.message = body.message
    if (body.type !== undefined) updateData.type = body.type
    if (body.targetType !== undefined) updateData.targetType = body.targetType
    if (body.targetUsers !== undefined) updateData.targetUsers = body.targetUsers
    if (body.displayType !== undefined) updateData.displayType = body.displayType
    if (body.isDismissible !== undefined) updateData.isDismissible = body.isDismissible
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.startsAt !== undefined) updateData.startsAt = body.startsAt ? new Date(body.startsAt) : null
    if (body.endsAt !== undefined) updateData.endsAt = body.endsAt ? new Date(body.endsAt) : null

    const announcement = await prisma.announcements.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(announcement)
  } catch (error) {
    console.error('Error updating announcement:', error)
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requireAdminAuth()
    if (result.error || !result.admin) {
      return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existingAnnouncement = await prisma.announcements.findUnique({
      where: { id },
    })

    if (!existingAnnouncement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    // Delete reads first
    await prisma.announcement_reads.deleteMany({
      where: { announcementId: id },
    })

    // Delete announcement
    await prisma.announcements.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 })
  }
}
