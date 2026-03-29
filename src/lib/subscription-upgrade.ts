import { prisma } from './prisma'

export interface AvailableUpgrade {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  trialDays: number
  isTrial: boolean
  isFeatured: boolean
  ctaText: string | null
  canUpgrade: boolean
  reason?: string
}

export interface UpgradeValidationResult {
  allowed: boolean
  reason?: string
  currentStatus?: {
    plan: string
    status: string
    isTrialing: boolean
    trialUsed: boolean
  }
}

export interface TrialEligibilityResult {
  allowed: boolean
  reason?: string
}

// Upgrade rules matrix
const UPGRADE_RULES: Record<string, string[]> = {
  'FREE': ['plan-pro-trial', 'plan-pro'],
  'PRO': [], // No upgrade path from PRO, only renew
  'TRIALING': ['plan-pro'], // From trial, can only upgrade to PRO
}

/**
 * Get the current subscription details for a user
 */
async function getUserSubscription(userId: string) {
  return await prisma.subscriptions.findUnique({
    where: { userId },
    select: {
      id: true,
      status: true,
      planType: true,
      trialStartsAt: true,
      trialEndsAt: true,
      pricingPlanId: true,
      pricing_plans: {
        select: {
          slug: true,
          name: true,
        },
      },
    },
  })
}

/**
 * Calculate trial days remaining
 */
function getTrialDaysLeft(trialEndsAt: Date | null): number {
  if (!trialEndsAt) return 0
  const now = new Date()
  const diffMs = trialEndsAt.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

/**
 * Check if user has used their one-time trial
 */
export async function hasUserUsedTrial(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId)

  if (!subscription) return false

  // Trial is considered used if trialStartsAt has a value
  return !!subscription.trialStartsAt
}

/**
 * Check if user can start a trial
 */
export async function canStartTrial(userId: string): Promise<TrialEligibilityResult> {
  const subscription = await getUserSubscription(userId)

  // No subscription yet - can start trial
  if (!subscription) {
    return { allowed: true }
  }

  // Already used trial
  if (subscription.trialStartsAt) {
    return {
      allowed: false,
      reason: 'Anda sudah pernah menggunakan trial. Silakan upgrade ke PRO untuk melanjutkan.',
    }
  }

  // Must be on FREE plan to start trial
  if (subscription.planType !== 'FREE' || subscription.status !== 'FREE') {
    return {
      allowed: false,
      reason: 'Trial hanya dapat dimulai dari paket FREE.',
    }
  }

  return { allowed: true }
}

/**
 * Validate if an upgrade request is allowed
 */
export async function validateUpgradeRequest(
  userId: string,
  targetPlanSlug: string
): Promise<UpgradeValidationResult> {
  const subscription = await getUserSubscription(userId)
  const trialUsed = subscription?.trialStartsAt ? true : false

  const currentStatus = {
    plan: subscription?.planType || 'FREE',
    status: subscription?.status || 'FREE',
    isTrialing: subscription?.status === 'TRIALING',
    trialUsed,
  }

  // Determine current effective plan for validation
  let effectivePlan: string = currentStatus.plan

  // If currently trialing, treat as TRIALING for upgrade rules
  if (currentStatus.isTrialing) {
    effectivePlan = 'TRIALING'
  }

  // Special handling for trial requests
  if (targetPlanSlug === 'plan-pro-trial') {
    if (trialUsed) {
      return {
        allowed: false,
        reason: 'Anda sudah pernah menggunakan trial. Silakan upgrade ke PRO.',
        currentStatus,
      }
    }

    if (effectivePlan !== 'FREE') {
      return {
        allowed: false,
        reason: 'Trial hanya dapat diaktifkan dari paket FREE.',
        currentStatus,
      }
    }

    return { allowed: true, currentStatus }
  }

  // Check if upgrade is allowed based on current plan
  const allowedUpgrades = UPGRADE_RULES[effectivePlan] || []

  if (!allowedUpgrades.includes(targetPlanSlug)) {
    // Provide specific error messages
    if (effectivePlan === 'PRO') {
      return {
        allowed: false,
        reason: 'Anda sudah berlangganan PRO. Tidak ada upgrade lebih lanjut.',
        currentStatus,
      }
    }

    if (effectivePlan === 'TRIALING' && targetPlanSlug !== 'plan-pro') {
      return {
        allowed: false,
        reason: 'Dari masa trial, Anda hanya dapat upgrade ke PRO.',
        currentStatus,
      }
    }

    return {
      allowed: false,
      reason: `Upgrade dari ${effectivePlan} ke ${targetPlanSlug} tidak diizinkan.`,
      currentStatus,
    }
  }

  return { allowed: true, currentStatus }
}

/**
 * Get available upgrade options for a user
 */
export async function getAvailableUpgrades(userId: string): Promise<{
  currentPlan: {
    name: string
    slug: string
    status: string
    trialDaysLeft: number
  }
  availableUpgrades: AvailableUpgrade[]
  canStartTrial: boolean
  trialUsed: boolean
}> {
  const subscription = await getUserSubscription(userId)
  const trialUsed = subscription?.trialStartsAt ? true : false
  const trialDaysLeft = getTrialDaysLeft(subscription?.trialEndsAt || null)

  // Determine current plan info
  let currentPlan = {
    name: 'FREE',
    slug: 'plan-free',
    status: subscription?.status || 'FREE',
    trialDaysLeft,
  }

  if (subscription?.pricing_plans) {
    currentPlan.name = subscription.pricing_plans.name
    currentPlan.slug = subscription.pricing_plans.slug
  }

  // Get all active pricing plans
  const allPlans = await prisma.pricing_plans.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  // Determine effective plan for upgrade rules
  let effectivePlan: string = subscription?.planType || 'FREE'
  if (subscription?.status === 'TRIALING') {
    effectivePlan = 'TRIALING'
  }

  // Filter plans based on upgrade rules
  const allowedUpgrades = UPGRADE_RULES[effectivePlan] || []

  const availableUpgrades: AvailableUpgrade[] = allPlans.map((plan) => {
    const isTrial = plan.slug === 'plan-pro-trial'
    const canUpgrade = allowedUpgrades.includes(plan.slug)

    let reason: string | undefined
    if (!canUpgrade) {
      if (isTrial && trialUsed) {
        reason = 'Anda sudah pernah menggunakan trial'
      } else if (effectivePlan === 'PRO') {
        reason = 'Anda sudah di paket tertinggi'
      } else if (effectivePlan === 'TRIALING' && plan.slug !== 'plan-pro') {
        reason = 'Dari trial hanya bisa upgrade ke PRO'
      } else {
        reason = 'Upgrade tidak tersedia'
      }
    }

    // Special case: trial not allowed if already used
    if (isTrial && !canUpgrade && !trialUsed) {
      // This shouldn't happen based on rules, but handle it
      reason = 'Upgrade tidak tersedia'
    }

    return {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      price: plan.price,
      currency: plan.currency,
      trialDays: plan.trialDays,
      isTrial,
      isFeatured: plan.isFeatured,
      ctaText: plan.ctaText,
      canUpgrade,
      reason,
    }
  })

  // Check if user can start trial
  const trialEligibility = await canStartTrial(userId)

  return {
    currentPlan,
    availableUpgrades,
    canStartTrial: trialEligibility.allowed,
    trialUsed,
  }
}

/**
 * Get upgrade path information
 */
export async function getUpgradePath(userId: string, targetPlanSlug: string) {
  const validation = await validateUpgradeRequest(userId, targetPlanSlug)

  if (!validation.allowed) {
    return null
  }

  const subscription = await getUserSubscription(userId)

  return {
    from: subscription?.planType || 'FREE',
    to: targetPlanSlug,
    fromStatus: subscription?.status || 'FREE',
    requiresPayment: targetPlanSlug !== 'plan-pro-trial',
    isRenewal: subscription?.planType === 'PRO' && subscription?.status === 'ACTIVE',
  }
}
