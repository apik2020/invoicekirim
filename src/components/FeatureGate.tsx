'use client'

import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { Lock } from 'lucide-react'
import { LockedFeatureCard } from './LockedFeatureCard'

interface FeatureGateProps {
  featureKey: string
  children: React.ReactNode
  fallback?: React.ReactNode
  showUsageIndicator?: boolean
}

/**
 * FeatureGate - Wraps content that requires feature access
 * Shows children if user has access, otherwise shows fallback or locked card
 */
export function FeatureGate({
  featureKey,
  children,
  fallback,
  showUsageIndicator = false,
}: FeatureGateProps) {
  const { hasAccess, isLoading, limit, usage, reason, showUpgradeModal } = useFeatureAccess(featureKey)

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60px]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500"></div>
      </div>
    )
  }

  // User has access - show content
  if (hasAccess) {
    return (
      <div>
        {showUsageIndicator && limit !== null && usage !== undefined && (
          <div className="text-xs text-text-muted mb-2">
            {usage}/{limit === null ? '∞' : limit} used
          </div>
        )}
        {children}
      </div>
    )
  }

  // No access - show fallback or locked card
  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <LockedFeatureCard
      featureKey={featureKey}
      reason={reason}
      limit={limit}
      usage={usage}
    />
  )
}
