import { prisma } from './prisma'
import { PlanType, SubscriptionStatus } from '@prisma/client'

export interface ValidationResult {
  valid: boolean
  reason?: string
}

/**
 * Server-side validation for all subscription modifications
 * This prevents users from bypassing upgrade restrictions
 */
export async function validateSubscriptionModification(
  userId: string,
  newPlan: PlanType,
  newStatus: SubscriptionStatus,
  metadata?: Record<string, any>
): Promise<ValidationResult> {
  try {
    // Get current subscription
    const currentSubscription = await prisma.subscriptions.findUnique({
      where: { userId },
      select: {
        id: true,
        planType: true,
        status: true,
        trialStartsAt: true,
        trialEndsAt: true,
      },
    })

    if (!currentSubscription) {
      // Creating new subscription - allow if it's not a downgrade
      if (newPlan === 'FREE' || newPlan === 'PRO') {
        return { valid: true }
      }
      return {
        valid: false,
        reason: 'Invalid initial plan type',
      }
    }

    // Define valid transitions
    const validTransitions: Record<string, string[]> = {
      'FREE': ['PRO', 'TRIALING'],
      'TRIALING': ['PRO', 'FREE'], // Trial can expire to FREE or upgrade to PRO
      'PRO': ['FREE', 'CANCELED'], // PRO can be canceled or downgraded
      'CANCELED': ['FREE', 'PRO'], // Can reactivate
      'PAST_DUE': ['FREE', 'PRO', 'CANCELED'],
    }

    const currentStatus = currentSubscription.status
    const allowedTransitions = validTransitions[currentStatus] || []

    // Special case: Trial can only be activated once
    if (newStatus === 'TRIALING' && currentSubscription.trialStartsAt) {
      return {
        valid: false,
        reason: 'Trial has already been used',
      }
    }

    // Check if transition is valid
    if (!allowedTransitions.includes(newStatus)) {
      return {
        valid: false,
        reason: `Invalid transition from ${currentStatus} to ${newStatus}`,
      }
    }

    // Additional business rules
    if (currentStatus === 'TRIALING' && newStatus === 'FREE') {
      // Trial expiring to FREE is valid
      return { valid: true }
    }

    if (currentSubscription.planType === 'PRO' && newPlan === 'FREE') {
      // Downgrading from PRO to FREE - only allowed if subscription expired
      if (currentStatus === 'ACTIVE') {
        // Check if period ended
        const now = new Date()
        const periodEnd = await prisma.subscriptions
          .findUnique({
            where: { id: currentSubscription.id },
            select: { stripeCurrentPeriodEnd: true },
          })
          .then(s => s?.stripeCurrentPeriodEnd)

        if (periodEnd && periodEnd > now) {
          return {
            valid: false,
            reason: 'Cannot downgrade active PRO subscription',
          }
        }
      }
    }

    return { valid: true }
  } catch (error) {
    console.error('[subscription-security] Validation error:', error)
    return {
      valid: false,
      reason: 'Validation failed due to system error',
    }
  }
}

/**
 * Audit logging for suspicious bypass attempts
 */
export async function logSuspiciousActivity(
  userId: string,
  activity: string,
  details: Record<string, any>
): Promise<void> {
  try {
    await prisma.activity_logs.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        action: 'CREATED',
        entityType: 'Security',
        entityId: crypto.randomUUID(), // Generate ID for security event
        title: `Percobaan Bypass Terdeteksi: ${activity}`,
        description: `Terdeteksi percobaan bypass aturan subscription: ${activity}`,
        metadata: {
          ...details,
          detectedAt: new Date().toISOString(),
          ipAddress: details.ip || 'unknown',
          userAgent: details.userAgent || 'unknown',
        },
      },
    })

    // TODO: Send alert to admin for monitoring
    console.warn(`[SECURITY] Suspicious activity detected for user ${userId}:`, activity, details)
  } catch (error) {
    console.error('[subscription-security] Failed to log suspicious activity:', error)
  }
}

/**
 * Validate payment for upgrade
 * Ensures payment amount matches plan pricing
 */
export async function validatePaymentForUpgrade(
  paymentId: string,
  userId: string,
  targetPlanSlug: string
): Promise<ValidationResult> {
  try {
    const payment = await prisma.payments.findUnique({
      where: { id: paymentId },
      include: {
        users: true,
      },
    })

    if (!payment) {
      return {
        valid: false,
        reason: 'Payment not found',
      }
    }

    if (payment.userId !== userId) {
      await logSuspiciousActivity(userId, 'Payment mismatch', {
        paymentId,
        paymentUserId: payment.userId,
        requestingUserId: userId,
      })
      return {
        valid: false,
        reason: 'Payment does not belong to user',
      }
    }

    if (payment.status !== 'COMPLETED') {
      return {
        valid: false,
        reason: 'Payment not completed',
      }
    }

    // Get target plan pricing
    const targetPlan = await prisma.pricing_plans.findUnique({
      where: { slug: targetPlanSlug },
      select: { price: true },
    })

    if (!targetPlan) {
      return {
        valid: false,
        reason: 'Target plan not found',
      }
    }

    // Verify payment amount matches plan price (with small tolerance for rounding)
    const tolerance = 0.01 // 1 cent tolerance
    if (Math.abs(payment.amount - targetPlan.price) > tolerance) {
      await logSuspiciousActivity(userId, 'Payment amount mismatch', {
        paymentId,
        paymentAmount: payment.amount,
        expectedAmount: targetPlan.price,
        targetPlanSlug,
      })
      return {
        valid: false,
        reason: 'Payment amount does not match plan price',
      }
    }

    return { valid: true }
  } catch (error) {
    console.error('[subscription-security] Payment validation error:', error)
    return {
      valid: false,
      reason: 'Payment validation failed',
    }
  }
}

/**
 * Detect potential upgrade bypass attempts
 * Analyzes patterns of failed attempts
 */
export async function detectUpgradeBypassAttempts(userId: string): Promise<{
  detected: boolean
  riskLevel: 'low' | 'medium' | 'high'
  details: string[]
}> {
  try {
    // Check recent failed attempts
    const recentFailures = await prisma.activity_logs.findMany({
      where: {
        userId,
        action: 'CREATED',
        entityType: 'Security',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      take: 10,
    })

    // Check for multiple checkout attempts with different price IDs
    const checkoutAttempts = await prisma.activity_logs.findMany({
      where: {
        userId,
        action: 'CREATED',
        entityType: 'Checkout',
        createdAt: {
          gte: new Date(Date.now() - 1 * 60 * 60 * 1000), // Last 1 hour
        },
      },
      take: 20,
    })

    // Analyze patterns
    const details: string[] = []
    let riskLevel: 'low' | 'medium' | 'high' = 'low'

    if (recentFailures.length >= 3) {
      riskLevel = 'high'
      details.push(`${recentFailures.length} blocked attempts in 24 hours`)
    } else if (recentFailures.length >= 1) {
      riskLevel = 'medium'
      details.push(`${recentFailures.length} blocked attempt(s) in 24 hours`)
    }

    if (checkoutAttempts.length >= 5) {
      riskLevel = riskLevel === 'high' ? 'high' : 'medium'
      details.push(`${checkoutAttempts.length} checkout attempts in 1 hour`)
    }

    // Check for attempts with different pricing plans
    const uniquePlans = new Set(
      checkoutAttempts
        .map(a => (a.metadata as any)?.targetPlan as string)
        .filter(Boolean)
    )
    if (uniquePlans.size >= 3) {
      riskLevel = 'high'
      details.push(`Attempts with ${uniquePlans.size} different pricing plans`)
    }

    return {
      detected: riskLevel !== 'low',
      riskLevel,
      details,
    }
  } catch (error) {
    console.error('[subscription-security] Bypass detection error:', error)
    return {
      detected: false,
      riskLevel: 'low',
      details: [],
    }
  }
}

/**
 * Rate limit key generator for subscription-related operations
 */
export function getSubscriptionRateLimitKey(
  userId: string,
  operation: string
): string {
  return `subscription:${operation}:${userId}`
}
