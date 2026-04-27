import { prisma } from '@/lib/prisma'
import { parsePlanFeatures, getFeatureValue, toOldKey } from './pricing-features'

// Feature keys as constants for type safety
export const FEATURE_KEYS = {
  INVOICE_CREATE: 'invoice_limit',
  INVOICE_LIMIT: 'invoice_limit',
  INVOICE_TEMPLATE: 'custom_template',
  PDF_EXPORT: 'pdf_export',
  EXPORT_PDF: 'pdf_export',
  WHATSAPP: 'whatsapp',
  BRANDING: 'custom_branding',
  CUSTOM_BRANDING: 'custom_branding',
  EMAIL_SEND: 'email_send',
  CUSTOM_SMTP: 'custom_smtp',
  CLIENT_MANAGEMENT: 'client_management',
  ANALYTICS_VIEW: 'analytics_view',
} as const

export type FeatureKey = (typeof FEATURE_KEYS)[keyof typeof FEATURE_KEYS]

export interface FeatureAccessResult {
  allowed: boolean
  reason?: 'plan_limit' | 'feature_locked' | 'usage_exceeded' | 'trial_expired' | 'no_subscription'
  limit?: number | null
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
    features_json: unknown
  } | null
}

/**
 * Get user's subscription with plan
 */
async function getUserSubscription(userId: string): Promise<SubscriptionWithPlan | null> {
  return prisma.subscriptions.findUnique({
    where: { userId },
    include: {
      pricing_plans: {
        select: {
          id: true,
          name: true,
          slug: true,
          features_json: true,
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
 * Get feature config from plan's JSON features
 */
function getPlanFeatureConfig(
  subscription: SubscriptionWithPlan,
  featureKey: string
): { included: boolean; limitValue: number | null } | null {
  if (!subscription.pricing_plans) return null

  const features = parsePlanFeatures(subscription.pricing_plans.features_json)
  const result = getFeatureValue(features, featureKey)

  if (!result.included && result.limitValue === null) {
    return null
  }

  return result
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

    case 'email_send':
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
 */
export async function checkFeatureAccess(
  userId: string,
  featureKey: string
): Promise<FeatureAccessResult> {
  const subscription = await getUserSubscription(userId)

  // No subscription — check free plan features
  if (!subscription) {
    const freePlan = await prisma.pricing_plans.findFirst({
      where: { slug: 'plan-free', isActive: true },
      select: { id: true, name: true, slug: true, features_json: true },
    })

    if (!freePlan) {
      return {
        allowed: false,
        reason: 'no_subscription',
        upgradeUrl: '/dashboard/billing',
      }
    }

    const features = parsePlanFeatures(freePlan.features_json)
    const { included, limitValue } = getFeatureValue(features, featureKey)

    if (!included) {
      return {
        allowed: false,
        reason: 'feature_locked',
        upgradeUrl: '/dashboard/billing',
        planName: freePlan.name,
      }
    }

    const currentUsage = await getFeatureUsage(userId, featureKey)
    if (limitValue !== null && currentUsage >= limitValue) {
      return {
        allowed: false,
        reason: 'usage_exceeded',
        limit: limitValue,
        currentUsage,
        upgradeUrl: '/dashboard/billing',
        planName: freePlan.name,
      }
    }

    return {
      allowed: true,
      limit: limitValue,
      currentUsage,
      planName: freePlan.name,
    }
  }

  // Trial active — full access
  if (isTrialActive(subscription)) {
    const currentUsage = await getFeatureUsage(userId, featureKey)
    return {
      allowed: true,
      limit: null,
      currentUsage,
      planName: 'Trial Pro',
    }
  }

  // Trial expired
  if (subscription.status === 'TRIALING' && subscription.trialEndsAt && new Date(subscription.trialEndsAt) <= new Date()) {
    return {
      allowed: false,
      reason: 'trial_expired',
      upgradeUrl: '/dashboard/billing',
    }
  }

  // Get feature from plan JSON
  const featureConfig = getPlanFeatureConfig(subscription, featureKey)

  if (!featureConfig) {
    // Fallback for PRO users without matching feature
    if (subscription.planType === 'PRO' && subscription.status === 'ACTIVE') {
      const proPlan = await prisma.pricing_plans.findFirst({
        where: { slug: 'plan-professional', isActive: true },
        select: { id: true, name: true, slug: true, features_json: true },
      })

      if (proPlan) {
        const features = parsePlanFeatures(proPlan.features_json)
        const { included, limitValue } = getFeatureValue(features, featureKey)

        if (included) {
          const currentUsage = await getFeatureUsage(userId, featureKey)
          if (limitValue !== null && currentUsage >= limitValue) {
            return {
              allowed: false,
              reason: 'usage_exceeded',
              limit: limitValue,
              currentUsage,
              upgradeUrl: '/dashboard/billing',
              planName: proPlan.name,
            }
          }
          return { allowed: true, limit: limitValue, currentUsage, planName: proPlan.name }
        }
      }
    }

    // Fallback: check free plan
    const freePlan = await prisma.pricing_plans.findFirst({
      where: { slug: 'plan-free', isActive: true },
      select: { id: true, name: true, slug: true, features_json: true },
    })

    if (freePlan) {
      const features = parsePlanFeatures(freePlan.features_json)
      const { included, limitValue } = getFeatureValue(features, featureKey)

      if (included) {
        const currentUsage = await getFeatureUsage(userId, featureKey)
        if (limitValue !== null && currentUsage >= limitValue) {
          return {
            allowed: false,
            reason: 'usage_exceeded',
            limit: limitValue,
            currentUsage,
            upgradeUrl: '/dashboard/billing',
            planName: freePlan.name,
          }
        }
        return { allowed: true, limit: limitValue, currentUsage, planName: freePlan.name }
      }
    }

    return {
      allowed: false,
      reason: 'feature_locked',
      upgradeUrl: '/dashboard/billing',
      planName: subscription.pricing_plans?.name || subscription.planType,
    }
  }

  if (!featureConfig.included) {
    return {
      allowed: false,
      reason: 'feature_locked',
      upgradeUrl: '/dashboard/billing',
      planName: subscription.pricing_plans?.name || subscription.planType,
    }
  }

  const currentUsage = await getFeatureUsage(userId, featureKey)
  const limit = featureConfig.limitValue

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
 */
export async function canAccessFeature(
  userId: string,
  featureKey: string
): Promise<boolean> {
  const result = await checkFeatureAccess(userId, featureKey)
  return result.allowed
}

/**
 * Track feature usage
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
        action: 'CREATED',
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
    console.error('Failed to track feature usage:', error)
  }
}

/**
 * Batch check multiple features
 */
export async function checkMultipleFeatures(
  userId: string,
  featureKeys: string[]
): Promise<Record<string, FeatureAccessResult>> {
  const results: Record<string, FeatureAccessResult> = {}

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
  const { FEATURE_DEFINITIONS } = await import('./pricing-features')

  const featureKeys = FEATURE_DEFINITIONS.map(f => f.key)
  const accessResults = await checkMultipleFeatures(userId, featureKeys)

  const result: Record<string, FeatureAccessResult & { featureName: string; featureDescription: string | null }> = {}

  for (const feature of FEATURE_DEFINITIONS) {
    result[feature.key] = {
      ...accessResults[feature.key],
      featureName: feature.name,
      featureDescription: feature.description,
    }
    // Also map to old key for backward compatibility
    const oldKey = toOldKey(feature.key)
    if (oldKey !== feature.key) {
      result[oldKey] = result[feature.key]
    }
  }

  return result
}

/**
 * Track PDF export usage
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
    console.error('Failed to track PDF export:', error)
  }
}

/**
 * Track email send usage
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
          featureKey: 'email_send',
          timestamp: new Date().toISOString(),
        },
      },
    })
  } catch (error) {
    console.error('Failed to track email send:', error)
  }
}
