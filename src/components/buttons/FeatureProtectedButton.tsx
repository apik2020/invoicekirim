'use client'

/**
 * Example: Feature-Protected Button Component
 *
 * This demonstrates the proper way to implement feature access control
 * for individual UI elements like buttons.
 */

import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { Download, Lock } from 'lucide-react'

interface FeatureProtectedButtonProps {
  featureKey: string
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  icon?: React.ReactNode
}

/**
 * Button that automatically disables and shows upgrade prompt
 * when user doesn't have access to the feature
 *
 * @example
 * <FeatureProtectedButton
 *   featureKey="PDF_EXPORT"
 *   onClick={handleExport}
 *   icon={<Download />}
 * >
 *   Export PDF
 * </FeatureProtectedButton>
 */
export function FeatureProtectedButton({
  featureKey,
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
}: FeatureProtectedButtonProps) {
  const {
    hasAccess,
    isLoading,
    reason,
    limit,
    usage,
    showUpgradeModal
  } = useFeatureAccess(featureKey)

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-notallowed'

    const sizeClasses = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base'
    }

    const variantClasses = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
    }

    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`
  }

  // Loading state
  if (isLoading) {
    return (
      <button className={getButtonClasses()} disabled>
        <span className="animate-pulse">Checking access...</span>
      </button>
    )
  }

  // Feature not allowed - show disabled button with upgrade
  if (!hasAccess) {
    return (
      <button
        className={getButtonClasses() + ' cursor-not-allowed opacity-60 border-dashed hover:bg-transparent hover:border-current'}
        onClick={showUpgradeModal}
        title={getLockedMessage(featureKey, reason, limit, usage)}
      >
        {icon && <span className="mr-2">{icon}</span>}
        <span className="mr-2">{children}</span>
        <Lock className="w-3 h-3" />
        <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
          PRO
        </span>
      </button>
    )
  }

  // Feature allowed - show normal button
  return (
    <button
      className={getButtonClasses()}
      onClick={onClick}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
      {limit !== null && usage !== undefined && (
        <span className="ml-2 text-xs opacity-70">
          ({usage}/{limit === null ? '∞' : limit})
        </span>
      )}
    </button>
  )
}

/**
 * Get user-friendly message for locked features
 */
function getLockedMessage(
  featureKey: string,
  reason?: string,
  limit?: number | null,
  usage?: number
): string {
  const featureNames: Record<string, string> = {
    PDF_EXPORT: 'Export PDF',
    EMAIL_SEND: 'Kirim Email',
    ANALYTICS_VIEW: 'Analitik Bisnis',
    branding: 'Custom Branding',
    INVOICE_TEMPLATE: 'Template Invoice',
    API_ACCESS: 'Akses API',
    TEAM_MEMBERS: 'Kolaborasi Tim',
  }

  const featureName = featureNames[featureKey] || 'Fitur ini'

  switch (reason) {
    case 'trial_expired':
      return `${featureName} - Masa trial berakhir. Klik untuk upgrade`
    case 'usage_exceeded':
      if (limit !== null && usage !== undefined) {
        return `${featureName} - Batas tercapai (${usage}/${limit}). Upgrade untuk lebih`
      }
      return `${featureName} - Batas bulanan tercapai`
    case 'feature_locked':
      return `${featureName} - Klik untuk upgrade ke Pro`
    default:
      return `${featureName} - Upgrade ke Pro untuk akses`
  }
}

/**
 * Example: Usage in a component
 */
export function ExportInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const handleExport = async () => {
    // Track the export usage
    await fetch('/api/invoices/' + invoiceId + '/export', {
      method: 'POST',
    })
    // ... export logic
  }

  return (
    <FeatureProtectedButton
      featureKey="PDF_EXPORT"
      onClick={handleExport}
      icon={<Download className="w-4 h-4" />}
    >
      Export PDF
    </FeatureProtectedButton>
  )
}
