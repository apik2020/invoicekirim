import { prisma } from '@/lib/prisma'

// Feature keys as constants for type safety
// These map the code's constant names to database feature keys
export const FEATURE_KEYS = {
  INVOICE_CREATE: 'invoice_limit',
  INVOICE_LIMIT: 'invoice_limit',
  TEMPLATES: 'templates',
  INVOICE_TEMPLATE: 'INVOICE_TEMPLATE',
  CLOUD_STORAGE: 'cloud_storage',
  PDF_EXPORT: 'pdf_export',
  EXPORT_PDF: 'pdf_export', // Alias for compatibility
  WHATSAPP: 'whatsapp',
  BRANDING: 'branding',
  CUSTOM_BRANDING: 'branding', // Maps to branding for now
  EMAIL_SEND: 'EMAIL_SEND',
  CUSTOM_SMTP: 'CUSTOM_SMTP',
  CLIENT_MANAGEMENT: 'CLIENT_MANAGEMENT',
  ANALYTICS_VIEW: 'ANALYTICS_VIEW',
  API_ACCESS: 'API_ACCESS',
  PRIORITY_SUPPORT: 'priority_support',
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
      // Track PDF exports via activity_logs
      // Look for logs where entityType is 'feature_usage' and entityId is 'pdf_export'
      const exportLogs = await prisma.activity_logs.count({
        where: {
          userId,
          entityType: 'feature_usage',
          entityId: 'pdf_export',
          action: 'CREATED',
          createdAt: { gte: startOfMonth },
        },
      })
      return exportLogs

    case 'EMAIL_SEND':
      // Track email sends via activity_logs
      const emailLogs = await prisma.activity_logs.count({
        where: {
          userId,
          entityType: 'feature_usage',
          entityId: 'email_send',
          action: 'CREATED',
          createdAt: { gte: startOfMonth },
        },
      })
      return emailLogs

    case FEATURE_KEYS.CLIENT_MANAGEMENT:
      return prisma.clients.count({
        where: { userId },
      })

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
      where: { slug: 'plan-free', isActive: true },
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
        plan: { slug: 'plan-free', isActive: true },
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

/**
 * Track PDF export usage for limiting purposes
 * Call this whenever a user exports an invoice to PDF
 */
export async function trackPdfExport(userId: string): Promise<void> {
  try {
    await prisma.activity_logs.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        action: 'CREATED',
        entityType: 'feature_usage',
        entityId: 'pdf_export',
        title: 'PDF Exported',
        description: 'User exported invoice to PDF',
        metadata: {
          featureKey: 'pdf_export',
          timestamp: new Date().toISOString(),
        },
      },
    })
  } catch (error) {
    // Log error but don't throw - tracking should not break functionality
    console.error('Failed to track PDF export:', error)
  }
}

/**
 * Track email send usage for limiting purposes
 * Call this whenever an invoice is sent via email
 */
export async function trackEmailSend(userId: string): Promise<void> {
  try {
    await prisma.activity_logs.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        action: 'CREATED',
        entityType: 'feature_usage',
        entityId: 'email_send',
        title: 'Email Sent',
        description: 'User sent invoice via email',
        metadata: {
          featureKey: 'EMAIL_SEND',
          timestamp: new Date().toISOString(),
        },
      },
    })
  } catch (error) {
    console.error('Failed to track email send:', error)
  }
}
