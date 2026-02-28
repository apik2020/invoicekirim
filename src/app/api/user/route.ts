import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ user: null, subscription: null })
    }

    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
      return NextResponse.json({ user: session.user, subscription: null })
    }

    // Get subscription
    const subscription = await prisma.subscription.findUnique({
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
