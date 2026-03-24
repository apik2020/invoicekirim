import { prisma } from '@/lib/prisma'

// Feature keys as constants for type safety
export const FEATURE_KEYS = {
  INVOICE_CREATE: 'INVOICE_CREATE',
  INVOICE_TEMPLATE: 'INVOICE_TEMPLATE',
  CUSTOM_BRANDING: 'CUSTOM_BRANDING',
  EXPORT_PDF: 'EXPORT_PDF',
  EMAIL_SEND: 'EMAIL_SEND',
  CLIENT_MANAGEMENT: 'CLIENT_MANAGEMENT',
  ANALYTICS_VIEW: 'ANALYTICS_VIEW',
  TEAM_MEMBERS: 'TEAM_MEMBERS',
  PRIORITY_SUPPORT: 'PRIORITY_SUPPORT',
  API_ACCESS: 'API_ACCESS',
} as const

export type FeatureKey = (typeof FEATURE_KEYS)[keyof typeof FEATURE_KEYS]

export interface FeatureAccessResult {
  allowed: boolean
  reason?: 'plan_limit' | 'feature_locked' | 'usage_exceeded' | 'trial_expired' | 'no_subscription'
  limit?: number | null  // null means unlimited
  currentUsage?: number
  upgradeUrl?: string
  planName?: string
}

interface SubscriptionWithPlan {
  id: string
  status: string
  planType: string
  trialEndsAt: Date | null
  trialStartsAt: Date | null
  pricingPlanId: string | null
  pricing_plans: {
    id: string
    name: string
    slug: string
    features: {
      included: boolean
      limitValue: number | null
      feature: {
        key: string
        name: string
      }
    }[]
  } | null
}

/**
 * Get user's subscription with plan and features
 */
async function getUserSubscription(userId: string): Promise<SubscriptionWithPlan | null> {
  return prisma.subscriptions.findUnique({
    where: { userId },
    include: {
      pricing_plans: {
        include: {
          features: {
            where: {
              feature: {
                isActive: true,
              },
            },
            include: {
              feature: true,
            },
          },
        },
      },
    },
  })
}

/**
 * Check if trial is active
 */
function isTrialActive(subscription: SubscriptionWithPlan): boolean {
  if (subscription.status !== 'TRIALING') return false
  if (!subscription.trialEndsAt) return false
  return new Date(subscription.trialEndsAt) > new Date()
}

/**
 * Get feature configuration for a plan
 */
function getPlanFeatureConfig(
  subscription: SubscriptionWithPlan,
  featureKey: string
): { included: boolean; limitValue: number | null } | null {
  if (!subscription.pricing_plans) return null

  const featureConfig = subscription.pricing_plans.features.find(
    (pf) => pf.feature.key === featureKey
  )

  return featureConfig ? { included: featureConfig.included, limitValue: featureConfig.limitValue } : null
}

/**
 * Get current usage for a feature
 */
async function getFeatureUsage(userId: string, featureKey: string): Promise<number> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  switch (featureKey) {
    case FEATURE_KEYS.INVOICE_CREATE:
      return prisma.invoices.count({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
      })

    case FEATURE_KEYS.EXPORT_PDF:
      // Track via activity_logs for now
      // In production, you'd want a dedicated usage tracking table
      const exportLogs = await prisma.activity_logs.findMany({
        where: {
          userId,
          action: 'UPDATED', // Using UPDATED for export action
          entityType: 'invoice',
          metadata: {
            path: ['$.*', 'action'],
            array_contains: 'export_pdf',
          },
          createdAt: { gte: startOfMonth },
        },
      })
      return exportLogs.length

    case FEATURE_KEYS.EMAIL_SEND:
      const emailLogs = await prisma.activity_logs.findMany({
        where: {
          userId,
          action: 'SENT',
          entityType: 'invoice',
          createdAt: { gte: startOfMonth },
        },
      })
      return emailLogs.length

    case FEATURE_KEYS.CLIENT_MANAGEMENT:
      return prisma.clients.count({
        where: { userId },
      })

    case FEATURE_KEYS.TEAM_MEMBERS:
      // Get team member count if user owns a team
      const team = await prisma.teams.findFirst({
        where: { ownerId: userId },
        include: {
          _count: {
            select: { team_members: true },
          },
        },
      })
      return team?._count.team_members || 0

    default:
      return 0
  }
}

/**
 * Check if user can access a feature
 * Returns detailed access result with reason and usage info
 */
export async function checkFeatureAccess(
  userId: string,
  featureKey: string
): Promise<FeatureAccessResult> {
  // Get user's subscription
  const subscription = await getUserSubscription(userId)

  // No subscription = free plan limits
  if (!subscription) {
    // Try to get free plan features
    const freePlan = await prisma.pricing_plans.findFirst({
      where: { slug: 'free', isActive: true },
      include: {
        features: {
          where: {
            feature: {
              key: featureKey,
              isActive: true,
            },
          },
          include: { feature: true },
        },
      },
    })

    if (!freePlan) {
      return {
        allowed: false,
        reason: 'no_subscription',
        upgradeUrl: '/dashboard/billing',
      }
    }

    const featureConfig = freePlan.features[0]
    if (!featureConfig || !featureConfig.included) {
      return {
        allowed: false,
        reason: 'feature_locked',
        upgradeUrl: '/dashboard/billing',
        planName: freePlan.name,
      }
    }

    // Check usage limits
    const currentUsage = await getFeatureUsage(userId, featureKey)
    const limit = featureConfig.limitValue

    if (limit !== null && currentUsage >= limit) {
      return {
        allowed: false,
        reason: 'usage_exceeded',
        limit,
        currentUsage,
        upgradeUrl: '/dashboard/billing',
        planName: freePlan.name,
      }
    }

    return {
      allowed: true,
      limit,
      currentUsage,
      planName: freePlan.name,
    }
  }

  // Check if trial is active - give full access during trial
  if (isTrialActive(subscription)) {
    const currentUsage = await getFeatureUsage(userId, featureKey)
    return {
      allowed: true,
      limit: null, // Unlimited during trial
      currentUsage,
      planName: 'Trial Pro',
    }
  }

  // Check if trial expired
  if (subscription.status === 'TRIALING' && subscription.trialEndsAt && new Date(subscription.trialEndsAt) <= new Date()) {
    return {
      allowed: false,
      reason: 'trial_expired',
      upgradeUrl: '/dashboard/billing',
    }
  }

  // Get feature configuration from plan
  const featureConfig = getPlanFeatureConfig(subscription, featureKey)

  // Feature not found in plan - check if it's a free feature
  if (!featureConfig) {
    // Check if there's a global free plan with this feature
    const freePlanFeature = await prisma.pricing_plan_features.findFirst({
      where: {
        feature: { key: featureKey },
        plan: { slug: 'free', isActive: true },
        included: true,
      },
      include: { feature: true, plan: true },
    })

    if (freePlanFeature) {
      const currentUsage = await getFeatureUsage(userId, featureKey)
      const limit = freePlanFeature.limitValue

      if (limit !== null && currentUsage >= limit) {
        return {
          allowed: false,
          reason: 'usage_exceeded',
          limit,
          currentUsage,
          upgradeUrl: '/dashboard/billing',
          planName: freePlanFeature.plan.name,
        }
      }

      return {
        allowed: true,
        limit,
        currentUsage,
        planName: freePlanFeature.plan.name,
      }
    }

    return {
      allowed: false,
      reason: 'feature_locked',
      upgradeUrl: '/dashboard/billing',
      planName: subscription.pricing_plans?.name || subscription.planType,
    }
  }

  // Feature not included in plan
  if (!featureConfig.included) {
    return {
      allowed: false,
      reason: 'feature_locked',
      upgradeUrl: '/dashboard/billing',
      planName: subscription.pricing_plans?.name || subscription.planType,
    }
  }

  // Check usage limits
  const currentUsage = await getFeatureUsage(userId, featureKey)
  const limit = featureConfig.limitValue

  // null limit means unlimited
  if (limit !== null && currentUsage >= limit) {
    return {
      allowed: false,
      reason: 'usage_exceeded',
      limit,
      currentUsage,
      upgradeUrl: '/dashboard/billing',
      planName: subscription.pricing_plans?.name || subscription.planType,
    }
  }

  return {
    allowed: true,
    limit,
    currentUsage,
    planName: subscription.pricing_plans?.name || subscription.planType,
  }
}

/**
 * Simple boolean check for feature access
 * Use this when you don't need detailed access info
 */
export async function canAccessFeature(
  userId: string,
  featureKey: string
): Promise<boolean> {
  const result = await checkFeatureAccess(userId, featureKey)
  return result.allowed
}

/**
 * Track feature usage (for analytics/auditing)
 * This creates an activity log entry
 */
export async function trackFeatureUsage(
  userId: string,
  featureKey: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.activity_logs.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        action: 'CREATED', // Using CREATED for feature usage
        entityType: 'feature_usage',
        entityId: featureKey,
        title: `Feature used: ${featureKey}`,
        description: `User accessed feature ${featureKey}`,
        metadata: {
          featureKey,
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      },
    })
  } catch (error) {
    // Log error but don't throw - tracking should not break functionality
    console.error('Failed to track feature usage:', error)
  }
}

/**
 * Batch check multiple features at once
 * Returns a map of feature key to access result
 */
export async function checkMultipleFeatures(
  userId: string,
  featureKeys: string[]
): Promise<Record<string, FeatureAccessResult>> {
  const results: Record<string, FeatureAccessResult> = {}

  // Run all checks in parallel
  const checks = await Promise.all(
    featureKeys.map(async (key) => ({
      key,
      result: await checkFeatureAccess(userId, key),
    }))
  )

  for (const { key, result } of checks) {
    results[key] = result
  }

  return results
}

/**
 * Get all features for a user with their access status
 */
export async function getUserFeatures(userId: string): Promise<
  Record<string, FeatureAccessResult & { featureName: string; featureDescription: string | null }>
> {
  // Get all active features
  const features = await prisma.pricing_features.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  const featureKeys = features.map((f) => f.key)
  const accessResults = await checkMultipleFeatures(userId, featureKeys)

  const result: Record<string, FeatureAccessResult & { featureName: string; featureDescription: string | null }> = {}

  for (const feature of features) {
    result[feature.key] = {
      ...accessResults[feature.key],
      featureName: feature.name,
      featureDescription: feature.description,
    }
  }

  return result
}
