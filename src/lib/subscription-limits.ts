import { prisma } from '@/lib/prisma'
import { parsePlanFeatures, getFeatureValue } from './pricing-features'

interface SubscriptionLimit {
  invoiceLimit: number | -1  // -1 means unlimited
  planName: string
  planType: 'FREE' | 'PRO'
}

/**
 * Get subscription limits for a user based on their pricing plan
 * Reads from features_json column
 */
export async function getUserSubscriptionLimits(userId: string): Promise<SubscriptionLimit> {
  const subscription = await prisma.subscriptions.findUnique({
    where: { userId },
    include: {
      pricing_plans: true,
    },
  })

  const defaultFreeLimit: SubscriptionLimit = {
    invoiceLimit: 10,
    planName: 'Gratis',
    planType: 'FREE',
  }

  const defaultProLimit: SubscriptionLimit = {
    invoiceLimit: -1,
    planName: 'Pro',
    planType: 'PRO',
  }

  if (!subscription) {
    return defaultFreeLimit
  }

  if (subscription.status === 'TRIALING') {
    return {
      invoiceLimit: -1,
      planName: 'Trial Pro',
      planType: 'PRO',
    }
  }

  if (subscription.pricing_plans) {
    const plan = subscription.pricing_plans
    const features = parsePlanFeatures(plan.features_json)
    const { included, limitValue } = getFeatureValue(features, 'invoice_limit')

    if (included && typeof limitValue === 'number') {
      return {
        invoiceLimit: limitValue,
        planName: plan.name,
        planType: plan.slug.includes('free') ? 'FREE' : 'PRO',
      }
    }

    return {
      invoiceLimit: included ? -1 : 0,
      planName: plan.name,
      planType: plan.slug.includes('free') ? 'FREE' : 'PRO',
    }
  }

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

  if (limits.invoiceLimit === -1) {
    return {
      allowed: true,
      currentCount: 0,
      limit: -1,
    }
  }

  const currentCount = await prisma.invoices.count({
    where: {
      userId,
      createdAt: {
        gte: new Date(new Date().setDate(1)),
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
