import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    const session = await getUserSession()

    if (!session) {
      return NextResponse.json({ user: null, subscription: null })
    }

    // Check if user exists in database
    const user = await prisma.users.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        companyName: true,
        companyEmail: true,
        companyPhone: true,
        companyAddress: true,
      },
    })

    if (!user) {
      return NextResponse.json({ user: session, subscription: null })
    }

    // Get subscription
    const subscription = await prisma.subscriptions.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        planType: true,
        status: true,
        stripeCurrentPeriodEnd: true,
      },
    })

    return NextResponse.json({
      user,
      subscription,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user', user: null, subscription: null },
      { status: 200 }
    )
  }
}
