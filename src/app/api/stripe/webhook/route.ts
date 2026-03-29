import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp, webhookRateLimit } from '@/lib/rate-limit'
import { createReceipt } from '@/lib/receipt-generator'

export async function POST(req: NextRequest) {
  try {
    // Rate limiting check (IP-based for webhooks)
    const ip = getClientIp(req)
    const rateLimit = await checkRateLimit(`webhook:${ip}`, webhookRateLimit)

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many webhook requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.reset.toString(),
          },
        }
      )
    }

    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')!

    let event
    try {
      event = stripe().webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const userId = session.metadata?.userId
        const pricingPlanId = session.metadata?.pricingPlanId
        const targetPlanSlug = session.metadata?.targetPlanSlug

        if (userId) {
          // Get existing subscription to check if upgrading from trial
          const existingSubscription = await prisma.subscriptions.findUnique({
            where: { userId },
            select: {
              status: true,
              trialStartsAt: true,
              trialEndsAt: true,
            },
          })

          // Determine if we need to clear trial fields
          const wasTrialing = existingSubscription?.status === 'TRIALING'
          const shouldClearTrialFields = wasTrialing

          await prisma.subscriptions.update({
            where: { userId },
            data: {
              stripeSubscriptionId: session.subscription,
              stripePriceId: session.display_items?.[0]?.price?.id,
              pricingPlanId: pricingPlanId, // Link to pricing plan
              stripeCurrentPeriodEnd: new Date(
                session.subscription_details?.current_period_end * 1000
              ),
              status: 'ACTIVE',
              planType: 'PRO',
              // Clear trial fields if upgrading from trial
              trialStartsAt: shouldClearTrialFields ? null : existingSubscription?.trialStartsAt,
              trialEndsAt: shouldClearTrialFields ? null : existingSubscription?.trialEndsAt,
            },
          })

          // Log successful subscription activation
          await prisma.activity_logs.create({
            data: {
              id: crypto.randomUUID(),
              userId,
              action: 'CREATED',
              entityType: 'Subscription',
              entityId: session.subscription,
              title: 'Langganan PRO Diaktifkan',
              description: `Pembayaran berhasil, langganan PRO diaktifkan${wasTrialing ? ' setelah trial' : ''}`,
              metadata: {
                checkoutSessionId: session.id,
                pricingPlanId,
                targetPlanSlug,
                upgradedFromTrial: wasTrialing,
              },
            },
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const userId = subscription.metadata?.userId

        if (userId) {
          const statusMap: Record<string, any> = {
            active: 'ACTIVE',
            past_due: 'PAST_DUE',
            canceled: 'CANCELED',
            unpaid: 'CANCELED',
            trialing: 'TRIALING',
            incomplete: 'INCOMPLETE',
            incomplete_expired: 'INCOMPLETE_EXPIRED',
          }

          await prisma.subscriptions.update({
            where: { stripeSubscriptionId: subscription.id },
            data: {
              status: statusMap[subscription.status] || 'FREE',
              stripeCurrentPeriodEnd: new Date(
                subscription.current_period_end * 1000
              ),
            },
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any

        await prisma.subscriptions.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'CANCELED',
            planType: 'FREE',
            stripeSubscriptionId: null,
            stripePriceId: null,
          },
        })
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any

        // Update subscription status if payment succeeded
        if (invoice.subscription) {
          const subscription = await prisma.subscriptions.update({
            where: { stripeSubscriptionId: invoice.subscription },
            data: {
              status: 'ACTIVE',
            },
          })

          // Create payment record
          const payment = await prisma.payments.create({
            data: {
              id: crypto.randomUUID(),
              userId: subscription.userId,
              stripePaymentId: invoice.payment_intent || invoice.id,
              stripePaymentIntentId: invoice.payment_intent || null,
              amount: invoice.amount_paid / 100, // Convert from cents
              currency: invoice.currency.toUpperCase(),
              description: `InvoiceKirim Pro Subscription - ${new Date().toLocaleDateString('id-ID')}`,
              status: 'COMPLETED',
              updatedAt: new Date(),
            },
          })

          // Generate receipt asynchronously (don't block webhook response)
          createReceipt(payment.id).catch((error) => {
            console.error('Failed to generate receipt:', error)
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any

        // Update subscription status if payment failed
        if (invoice.subscription) {
          await prisma.subscriptions.update({
            where: { stripeSubscriptionId: invoice.subscription },
            data: {
              status: 'PAST_DUE',
            },
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
