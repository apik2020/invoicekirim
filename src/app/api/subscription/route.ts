import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (!subscription) {
      // Create default subscription
      const newSubscription = await prisma.subscription.create({
        data: {
          userId: session.user.id,
          status: 'FREE',
          planType: 'FREE',
        },
      })
      return NextResponse.json(newSubscription)
    }

    // Calculate current month's invoice count for free users
    let invoiceCount = 0
    let invoiceLimit = 10

    if (subscription.planType === 'FREE') {
      invoiceCount = await prisma.invoice.count({
        where: {
          userId: session.user.id,
          createdAt: {
            gte: new Date(new Date().setDate(1)), // Start of current month
          },
        },
      })
    } else {
      invoiceLimit = -1 // Unlimited
    }

    return NextResponse.json({
      ...subscription,
      invoiceCount,
      invoiceLimit,
    })
  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil subscription' },
      { status: 500 }
    )
  }
}
