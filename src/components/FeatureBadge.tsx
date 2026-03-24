'use client'

import { Crown, Lock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeatureBadgeProps {
  featureKey?: string
  isLocked?: boolean
  isPro?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * FeatureBadge - Shows PRO/FREE/LOCKED indicator for features
 */
export function FeatureBadge({
  featureKey,
  isLocked = false,
  isPro = false,
  size = 'sm',
  className,
}: FeatureBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }

  if (isLocked) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-medium',
          sizeClasses[size],
          'bg-gray-100 text-gray-600',
          className
        )}
      >
        <Lock className={iconSizes[size]} />
        <span>Terkunci</span>
      </span>
    )
  }

  if (isPro) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-medium',
          sizeClasses[size],
          'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
          className
        )}
      >
        <Crown className={iconSizes[size]} />
        <span>PRO</span>
      </span>
    )
  }

  // Default FREE badge
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        sizeClasses[size],
        'bg-brand-100 text-brand-700',
        className
      )}
    >
      <Sparkles className={iconSizes[size]} />
      <span>FREE</span>
    </span>
  )
}
