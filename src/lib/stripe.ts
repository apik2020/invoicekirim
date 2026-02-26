import Stripe from 'stripe'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-01-28.clover',
    typescript: true,
  })
}

export const getStripeCustomerId = async (userId: string, email: string) => {
  const { prisma } = await import('@/lib/prisma')

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  if (subscription?.stripeCustomerId) {
    return subscription.stripeCustomerId
  }

  const stripe = getStripe()

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  })

  // Update subscription with customer ID
  await prisma.subscription.update({
    where: { userId },
    data: { stripeCustomerId: customer.id },
  })

  return customer.id
}

export { getStripe as stripe }
