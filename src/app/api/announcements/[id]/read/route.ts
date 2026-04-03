import { NextRequest, NextResponse } from 'next/server'
import { getUserSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/announcements/[id]/read
 * Mark an announcement as read by the current user
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { dismissed = false } = body

    // Check if announcement exists
    const announcement = await prisma.announcements.findUnique({
      where: { id },
    })

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    // Check if read record already exists
    const existingRead = await prisma.announcement_reads.findUnique({
      where: {
        announcementId_userId: {
          announcementId: id,
          userId: session.id,
        },
      },
    })

    let readRecord
    if (existingRead) {
      // Update existing record
      readRecord = await prisma.announcement_reads.update({
        where: {
          announcementId_userId: {
            announcementId: id,
            userId: session.id,
          },
        },
        data: {
          readAt: new Date(),
          dismissed: dismissed,
        },
      })
    } else {
      // Create new record
      readRecord = await prisma.announcement_reads.create({
        data: {
          id: crypto.randomUUID(),
          announcementId: id,
          userId: session.id,
          readAt: new Date(),
          dismissed: dismissed,
        },
      })
    }

    return NextResponse.json({ success: true, readRecord })
  } catch (error) {
    console.error('Error marking announcement as read:', error)
    return NextResponse.json(
      { error: 'Gagal menandai pengumuman' },
      { status: 500 }
    )
  }
}
