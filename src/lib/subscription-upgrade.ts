import { prisma } from './prisma'

export interface AvailableUpgrade {
  id: string
  name: string
  slug: string
  price_monthly: number
  price_yearly: number
  currency: string
  trialDays: number
  is_popular: boolean
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
  }
}

async function getUserSubscription(userId: string) {
  return await prisma.subscriptions.findUnique({
    where: { userId },
    select: {
      id: true,
      status: true,
      planType: true,
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

export async function validateUpgradeRequest(
  userId: string,
  targetPlanSlug: string
): Promise<UpgradeValidationResult> {
  const subscription = await getUserSubscription(userId)

  const currentStatus = {
    plan: subscription?.planType || 'FREE',
    status: subscription?.status || 'FREE',
  }

  // Can't upgrade to free or same plan
  if (targetPlanSlug === 'plan-free') {
    return { allowed: false, reason: 'Tidak dapat downgrade ke paket Free.', currentStatus }
  }

  const currentSlug = subscription?.pricing_plans?.slug || 'plan-free'

  // Already on this plan
  if (currentSlug === targetPlanSlug) {
    return { allowed: false, reason: 'Anda sudah berlangganan paket ini.', currentStatus }
  }

  // Define upgrade order
  const planOrder = ['plan-free', 'plan-basic', 'plan-professional']
  const currentIdx = planOrder.indexOf(currentSlug)
  const targetIdx = planOrder.indexOf(targetPlanSlug)

  if (targetIdx === -1) {
    return { allowed: false, reason: 'Paket tidak ditemukan.', currentStatus }
  }

  if (targetIdx <= currentIdx) {
    return { allowed: false, reason: 'Tidak dapat downgrade. Hubungi support jika butuh bantuan.', currentStatus }
  }

  return { allowed: true, currentStatus }
}

export async function getAvailableUpgrades(userId: string): Promise<{
  currentPlan: {
    name: string
    slug: string
    status: string
  }
  availableUpgrades: AvailableUpgrade[]
}> {
  const subscription = await getUserSubscription(userId)

  let currentPlan = {
    name: 'Free',
    slug: 'plan-free',
    status: subscription?.status || 'FREE',
  }

  if (subscription?.pricing_plans) {
    currentPlan.name = subscription.pricing_plans.name
    currentPlan.slug = subscription.pricing_plans.slug
  }

  const allPlans = await prisma.pricing_plans.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  const currentSlug = currentPlan.slug
  const planOrder = ['plan-free', 'plan-basic', 'plan-professional']
  const currentIdx = planOrder.indexOf(currentSlug)

  const availableUpgrades: AvailableUpgrade[] = allPlans.map((plan) => {
    const planIdx = planOrder.indexOf(plan.slug)
    const canUpgrade = planIdx > currentIdx

    let reason: string | undefined
    if (!canUpgrade) {
      if (plan.slug === currentSlug) {
        reason = 'Paket saat ini'
      } else if (planIdx < currentIdx) {
        reason = 'Paket lebih rendah'
      } else {
        reason = 'Upgrade tidak tersedia'
      }
    }

    return {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      currency: plan.currency,
      trialDays: plan.trialDays,
      is_popular: plan.is_popular,
      ctaText: plan.ctaText,
      canUpgrade,
      reason,
    }
  })

  return {
    currentPlan,
    availableUpgrades,
  }
}

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
    requiresPayment: targetPlanSlug !== 'plan-free',
    isRenewal: subscription?.planType === 'PRO' && subscription?.status === 'ACTIVE',
  }
}
