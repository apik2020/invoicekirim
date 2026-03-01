import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Update user subscription (manual override)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access - NO development mode bypass for security
    const admin = await verifyAdmin()
    if (admin instanceof NextResponse) {
      return admin
    }

    const { id } = await params
    const body = await req.json()
    const { planType, status, stripeCustomerId } = body

    // Get or create subscription
    let subscription = await prisma.subscription.findUnique({
      where: { userId: id },
    })

    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          userId: id,
          status: status || (planType === 'PRO' ? 'ACTIVE' : 'FREE'),
          planType: planType || 'FREE',
          stripeCustomerId,
        },
      })
    } else {
      subscription = await prisma.subscription.update({
        where: { userId: id },
        data: {
          ...(planType && { planType }),
          ...(status && { status }),
          ...(stripeCustomerId && { stripeCustomerId }),
        },
      })
    }

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}
