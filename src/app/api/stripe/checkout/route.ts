import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { stripe, getStripeCustomerId } from '@/lib/stripe'
import { checkRateLimit, apiRateLimit } from '@/lib/rate-limit'
import { validateUpgradeRequest } from '@/lib/subscription-upgrade'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting check (per user)
    const rateLimit = await checkRateLimit(`checkout:${session.id}`, apiRateLimit)

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Terlalu banyak percobaan checkout. Silakan coba lagi dalam 1 menit.',
          retryAfter: rateLimit.reset,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.reset.toString(),
            'Retry-After': Math.ceil((rateLimit.reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    const { priceId } = await req.json()

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 })
    }

    // Get pricing plan details for the priceId
    const pricingPlan = await prisma.pricing_plans.findFirst({
      where: { stripePriceId: priceId },
    })

    if (!pricingPlan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Validate upgrade eligibility before creating checkout session
    const validation = await validateUpgradeRequest(session.id, pricingPlan.slug)

    if (!validation.allowed) {
      // Log failed upgrade attempt
      await prisma.activity_logs.create({
        data: {
          id: crypto.randomUUID(),
          userId: session.id,
          action: 'CREATED',
          entityType: 'Checkout',
          entityId: pricingPlan.id,
          title: 'Checkout Ditolak - Upgrade Tidak Valid',
          description: validation.reason || 'Alasan tidak diketahui',
          metadata: {
            targetPlan: pricingPlan.slug,
            targetPriceId: priceId,
            currentPlan: validation.currentStatus?.plan,
            currentStatus: validation.currentStatus?.status,
          },
        },
      })

      return NextResponse.json(
        { error: validation.reason || 'Upgrade tidak diizinkan' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    const customerId = await getStripeCustomerId(
      session.id,
      session.email!
    )

    // Create checkout session with metadata for webhook processing
    const checkoutSession = await stripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=canceled`,
      metadata: {
        userId: session.id,
        pricingPlanId: pricingPlan.id,
        targetPlanSlug: pricingPlan.slug,
      },
    })

    return NextResponse.json(
      { url: checkoutSession.url },
      {
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString(),
        },
      }
    )
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Gagal membuat checkout session' },
      { status: 500 }
    )
  }
}
