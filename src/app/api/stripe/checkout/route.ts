import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe, getStripeCustomerId } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, apiRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting check (per user)
    const rateLimit = await checkRateLimit(`checkout:${session.user.id}`, apiRateLimit)

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

    // Get or create Stripe customer
    const customerId = await getStripeCustomerId(
      session.user.id,
      session.user.email!
    )

    // Create checkout session
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
        userId: session.user.id,
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
