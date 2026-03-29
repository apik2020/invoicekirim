import { NextRequest, NextResponse } from 'next/server'
import { getUserSession } from '@/lib/session'
import { checkFeatureAccess } from '@/lib/feature-access'

/**
 * Feature Access Check API Endpoint
 *
 * GET /api/features/:featureKey/check
 *
 * Checks if the current user can access a specific feature.
 * Returns detailed access information including limits and usage.
 *
 * Used by the useFeatureAccess hook on the frontend.
 *
 * @example
 * const res = await fetch('/api/features/ANALYTICS_VIEW/check')
 * const data = await res.json()
 * // { allowed: true, limit: null, currentUsage: 5, planName: 'Pro' }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ featureKey: string }> }
) {
  try {
    const { featureKey } = await params
    const session = await getUserSession()

    // No session = not authenticated
    if (!session?.id) {
      return NextResponse.json(
        {
          allowed: false,
          reason: 'no_subscription',
          message: 'Please sign in to access this feature',
          upgradeUrl: '/login',
        },
        { status: 401 }
      )
    }

    // Check feature access
    const access = await checkFeatureAccess(session.id, featureKey)

    // Feature not allowed
    if (!access.allowed) {
      const response = {
        allowed: false,
        reason: access.reason,
        message: getLockedMessage(featureKey, access.reason, access.limit, access.currentUsage),
        upgradeUrl: access.upgradeUrl || '/checkout',
        planName: access.planName,
        limit: access.limit,
        currentUsage: access.currentUsage,
      }
      return NextResponse.json(response, { status: 403 })
    }

    // Feature allowed
    return NextResponse.json({
      allowed: true,
      planName: access.planName,
      limit: access.limit,
      currentUsage: access.currentUsage,
    })
  } catch (error) {
    console.error('[Feature check] Error:', error)
    return NextResponse.json(
      {
        allowed: false,
        reason: 'error',
        message: 'Failed to check feature access',
        upgradeUrl: '/checkout',
      },
      { status: 500 }
    )
  }
}

/**
 * Get user-friendly message for locked features
 */
function getLockedMessage(
  featureKey: string,
  reason?: string,
  limit?: number | null,
  currentUsage?: number
): string {
  const featureNames: Record<string, string> = {
    INVOICE_CREATE: 'Membuat invoice',
    INVOICE_TEMPLATE: 'Template invoice kustom',
    EXPORT_PDF: 'Export PDF',
    EMAIL_SEND: 'Kirim invoice via email',
    CUSTOM_BRANDING: 'Kustomisasi branding',
    ANALYTICS_VIEW: 'Analitik bisnis',
    TEAM_MEMBERS: 'Kolaborasi tim',
    API_ACCESS: 'Akses API',
    CLIENT_MANAGEMENT: 'Manajemen klien',
  }

  const featureName = featureNames[featureKey] || 'Fitur ini'

  switch (reason) {
    case 'trial_expired':
      return `Masa trial Anda telah berakhir. Upgrade ke Pro untuk melanjutkan akses ${featureName}.`

    case 'usage_exceeded':
      if (limit !== null && currentUsage !== undefined) {
        return `Anda telah mencapai batas bulanan: ${currentUsage}/${limit} untuk ${featureName}.`
      }
      return `Anda telah mencapai batas penggunaan untuk ${featureName}.`

    case 'feature_locked':
      return `${featureName} hanya tersedia untuk pengguna Pro. Upgrade sekarang untuk membuka fitur ini.`

    case 'plan_limit':
      return `Paket Anda saat ini tidak mendukung ${featureName}. Upgrade ke Pro untuk akses penuh.`

    case 'no_subscription':
    default:
      return `${featureName} tersedia dalam paket berbayaran. Mulai trial gratis 7 hari untuk mencoba.`
  }
}
