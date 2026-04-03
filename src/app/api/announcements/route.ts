import { NextRequest, NextResponse } from 'next/server'
import { getUserSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/announcements
 * Fetch active announcements for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const displayType = url.searchParams.get('displayType') // 'banner', 'modal', 'toast', or 'all'

    // Get user's subscription to check plan type
    const user = await prisma.users.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        subscriptions: {
          select: {
            planType: true,
            status: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ announcements: [] })
    }

    const userPlanType = user.subscriptions?.planType || 'FREE'
    const userStatus = user.subscriptions?.status || 'FREE'

    const now = new Date()

    // Build where clause for active announcements
    const where: any = {
      isActive: true,
      OR: [
        { startsAt: null },
        { startsAt: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endsAt: null },
            { endsAt: { gte: now } },
          ],
        },
      ],
    }

    // Filter by display type if specified
    if (displayType && displayType !== 'all') {
      where.displayType = displayType
    }

    // Fetch announcements
    const announcements = await prisma.announcements.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        targetType: true,
        targetUsers: true,
        displayType: true,
        isDismissible: true,
        startsAt: true,
        endsAt: true,
        createdAt: true,
      },
    })

    // Filter announcements based on target
    const filteredAnnouncements = announcements.filter((announcement) => {
      // Check if user has already read/dismissed this announcement
      // We'll check this in-memory since we don't have the read data here

      // Check targetType
      switch (announcement.targetType) {
        case 'all':
          return true

        case 'free':
          return userPlanType === 'FREE' && userStatus === 'FREE'

        case 'pro':
        case 'premium':
          return userPlanType === 'PRO' && userStatus === 'ACTIVE'

        case 'trialing':
          return userStatus === 'TRIALING'

        case 'specific':
          // Check if user's ID is in targetUsers
          if (!announcement.targetUsers) return false
          const targetUsers = Array.isArray(announcement.targetUsers)
            ? announcement.targetUsers
            : JSON.parse(announcement.targetUsers as string)
          return targetUsers.includes(session.id)

        default:
          return true
      }
    })

    // Fetch read/dismissed status for this user
    const announcementIds = filteredAnnouncements.map((a) => a.id)
    const readRecords = await prisma.announcement_reads.findMany({
      where: {
        announcementId: { in: announcementIds },
        userId: session.id,
      },
      select: {
        announcementId: true,
        readAt: true,
        dismissed: true,
      },
    })

    const readMap = new Map()
    readRecords.forEach((record) => {
      readMap.set(record.announcementId, {
        read: !!record.readAt,
        dismissed: record.dismissed || false,
      })
    })

    // Combine announcements with read status
    const announcementsWithStatus = filteredAnnouncements.map((announcement) => ({
      ...announcement,
      read: readMap.get(announcement.id)?.read || false,
      dismissed: readMap.get(announcement.id)?.dismissed || false,
    }))

    return NextResponse.json({
      announcements: announcementsWithStatus,
    })
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil pengumuman' },
      { status: 500 }
    )
  }
}
