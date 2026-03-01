import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Update user subscription (manual override)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const result = await requireAdminAuth()
    if (result.error || !result.admin) {
      return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 })
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
