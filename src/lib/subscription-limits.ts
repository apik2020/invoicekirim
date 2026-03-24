import { prisma } from '@/lib/prisma'

interface SubscriptionLimit {
  invoiceLimit: number | -1  // -1 means unlimited
  planName: string
  planType: 'FREE' | 'PRO'
}

/**
 * Get subscription limits for a user based on their pricing plan
 * Returns dynamic limits from pricing_plans table
 */
export async function getUserSubscriptionLimits(userId: string): Promise<SubscriptionLimit> {
  // Get user's subscription
  const subscription = await prisma.subscriptions.findUnique({
    where: { userId },
    include: {
      pricing_plans: {
        include: {
          features: {
            include: {
              feature: true,
            },
          },
        },
      },
    },
  })

  // Default limits (fallback)
  const defaultFreeLimit: SubscriptionLimit = {
    invoiceLimit: 10,
    planName: 'Gratis',
    planType: 'FREE',
  }

  const defaultProLimit: SubscriptionLimit = {
    invoiceLimit: -1,  // Unlimited
    planName: 'Pro',
    planType: 'PRO',
  }

  // If no subscription, return default free limit
  if (!subscription) {
    return defaultFreeLimit
  }

  // If trialing, return unlimited
  if (subscription.status === 'TRIALING') {
    return {
      invoiceLimit: -1,
      planName: 'Trial Pro',
      planType: 'PRO',
    }
  }

  // If user has a pricing plan linked, get limits from there
  if (subscription.pricing_plans) {
    const plan = subscription.pricing_plans
    const invoiceLimitFeature = plan.features.find(
      (pf) => pf.feature.key === 'invoice_limit' && pf.included
    )

    return {
      invoiceLimit: invoiceLimitFeature?.limitValue || -1,  // null = unlimited
      planName: plan.name,
      planType: plan.slug.toUpperCase() === 'FREE' ? 'FREE' : 'PRO',
    }
  }

  // If no pricing plan linked, try to find matching plan by planType
  const matchingPlan = await prisma.pricing_plans.findFirst({
    where: {
      slug: subscription.planType.toLowerCase(),
      isActive: true,
    },
    include: {
      features: {
        include: {
          feature: true,
        },
      },
    },
  })

  if (matchingPlan) {
    const invoiceLimitFeature = matchingPlan.features.find(
      (pf) => pf.feature.key === 'invoice_limit' && pf.included
    )

    return {
      invoiceLimit: invoiceLimitFeature?.limitValue || -1,
      planName: matchingPlan.name,
      planType: matchingPlan.slug.toUpperCase() === 'FREE' ? 'FREE' : 'PRO',
    }
  }

  // Fallback to planType-based limits
  if (subscription.planType === 'FREE') {
    return defaultFreeLimit
  }

  return defaultProLimit
}

/**
 * Check if user can create more invoices this month
 */
export async function canUserCreateInvoice(userId: string): Promise<{
  allowed: boolean
  currentCount: number
  limit: number | -1
  message?: string
}> {
  const limits = await getUserSubscriptionLimits(userId)

  // Unlimited
  if (limits.invoiceLimit === -1) {
    return {
      allowed: true,
      currentCount: 0,
      limit: -1,
    }
  }

  // Get current month's invoice count
  const currentCount = await prisma.invoices.count({
    where: {
      userId,
      createdAt: {
        gte: new Date(new Date().setDate(1)),  // Start of current month
      },
    },
  })

  const allowed = currentCount < limits.invoiceLimit

  return {
    allowed,
    currentCount,
    limit: limits.invoiceLimit,
    message: allowed
      ? undefined
      : `Batas ${limits.planName} tercapai (${limits.invoiceLimit} invoice/bulan). Upgrade ke Pro untuk invoice tanpa batas.`,
  }
}
