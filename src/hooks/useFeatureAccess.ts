'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'

export interface FeatureAccessResult {
  allowed: boolean
  reason?: 'plan_limit' | 'feature_locked' | 'usage_exceeded' | 'trial_expired' | 'no_subscription'
  limit?: number | null
  currentUsage?: number
  upgradeUrl?: string
  planName?: string
}

export interface UseFeatureAccessReturn {
  hasAccess: boolean
  isLoading: boolean
  limit?: number | null
  usage?: number
  reason?: FeatureAccessResult['reason']
  planName?: string
  showUpgradeModal: () => void
  refresh: () => Promise<void>
}

// Cache for feature access results
const featureCache = new Map<string, { result: FeatureAccessResult; timestamp: number }>()
const CACHE_TTL = 30000 // 30 seconds

// Global state for upgrade modal
let upgradeModalCallback: (() => void) | null = null
let currentUpgradeFeature: string | null = null

export function setUpgradeModalCallback(callback: ((feature?: string) => void) | null) {
  upgradeModalCallback = callback
}

export function getCurrentUpgradeFeature() {
  return currentUpgradeFeature
}

export function useFeatureAccess(
  featureKey: string,
  options?: { skipCache?: boolean }
): UseFeatureAccessReturn {
  const pathname = usePathname()
  const [result, setResult] = useState<FeatureAccessResult>({
    allowed: false,
  reason: 'no_subscription',
  })
  const [isLoading, setIsLoading] = useState(true)

  const checkAccess = useCallback(async () => {
    setIsLoading(true)

    // Check cache first (unless skipCache is true)
    if (!options?.skipCache) {
      const cached = featureCache.get(featureKey)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setResult(cached.result)
        setIsLoading(false)
        return
      }
    }

    try {
      const res = await fetch(`/api/features/${encodeURIComponent(featureKey)}/check`)

      const data = await res.json()

      // Handle 403 (feature locked) - this is expected behavior
      if (res.status === 403) {
        setResult({
          allowed: false,
          reason: data.reason,
          limit: data.limit,
          currentUsage: data.currentUsage,
          upgradeUrl: data.upgradeUrl,
          planName: data.planName,
        })

        // Still cache denied access to avoid repeated checks
        featureCache.set(featureKey, { result: data, timestamp: Date.now() })
        setIsLoading(false)
        return
      }

      // Handle other errors
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${data.error || 'Unknown error'}`)
      }

      // Update cache and set result
      featureCache.set(featureKey, { result: data, timestamp: Date.now() })
      setResult(data)
    } catch (error) {
      console.error('Error checking feature access:', error)
      setResult({
        allowed: false,
        reason: 'no_subscription',
      })
    } finally {
      setIsLoading(false)
    }
  }, [featureKey, options?.skipCache])

  useEffect(() => {
    checkAccess()
  }, [checkAccess, pathname]) // Re-check on route change

  const showUpgradeModal = useCallback(() => {
    currentUpgradeFeature = featureKey
    upgradeModalCallback?.()
  }, [featureKey])

  const refresh = useCallback(async () => {
    // Clear cache for this feature
    featureCache.delete(featureKey)
    await checkAccess()
  }, [featureKey, checkAccess])

  return {
    hasAccess: result.allowed,
    isLoading,
    limit: result.limit,
    usage: result.currentUsage,
    reason: result.reason,
    planName: result.planName,
    showUpgradeModal,
    refresh,
  }
}

/**
 * Hook to check multiple features at once
 * @param featureKeys - Array of feature keys to check
 */
export function useMultipleFeatureAccess(
  featureKeys: string[]
): {
  results: Record<string, FeatureAccessResult>
  isLoading: boolean
  showUpgradeModal: (feature: string) => void
  refresh: () => Promise<void>
} {
  const [results, setResults] = useState<Record<string, FeatureAccessResult>>({})
  const [isLoading, setIsLoading] = useState(true)

  const checkAccess = useCallback(async () => {
    if (featureKeys.length === 0) {
      setResults({})
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    // Check cache for all features
    const cachedResults: Record<string, FeatureAccessResult> = {}
    const uncachedKeys: string[] = []

    for (const key of featureKeys) {
      const cached = featureCache.get(key)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        cachedResults[key] = cached.result
      } else {
        uncachedKeys.push(key)
      }
    }

    // If all are cached, return early
    if (uncachedKeys.length === 0) {
      setResults(cachedResults)
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/feature-access/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: uncachedKeys }),
      })

      if (!res.ok) {
        throw new Error('Failed to check feature access')
      }

      const data = await res.json()

      // Update cache
      for (const [key, result] of Object.entries<FeatureAccessResult>(data.results)) {
        featureCache.set(key, { result, timestamp: Date.now() })
      }

      setResults({ ...cachedResults, ...data.results })
    } catch (error) {
      console.error('Error checking feature access:', error)
    } finally {
      setIsLoading(false)
    }
  }, [featureKeys])

  useEffect(() => {
    checkAccess()
  }, [checkAccess])

  const showUpgradeModal = useCallback((feature: string) => {
    currentUpgradeFeature = feature
    upgradeModalCallback?.()
  }, [])

  const refresh = useCallback(async () => {
    // Clear cache for all features
    for (const key of featureKeys) {
      featureCache.delete(key)
    }
    await checkAccess()
  }, [featureKeys, checkAccess])

  return {
    results,
    isLoading,
    showUpgradeModal,
    refresh,
  }
}

/**
 * Clear the feature access cache
 */
export function clearFeatureCache(featureKey?: string) {
  if (featureKey) {
    featureCache.delete(featureKey)
  } else {
    featureCache.clear()
  }
}

// Feature keys constants
export const FEATURE_KEYS = {
  INVOICE_CREATE: 'INVOICE_CREATE',
  INVOICE_TEMPLATE: 'INVOICE_TEMPLATE',
  CUSTOM_BRANDING: 'CUSTOM_BRANDING',
  EXPORT_PDF: 'EXPORT_PDF',
  EMAIL_SEND: 'EMAIL_SEND',
  CUSTOM_SMTP: 'CUSTOM_SMTP',
  CLIENT_MANAGEMENT: 'CLIENT_MANAGEMENT',
  ANALYTICS_VIEW: 'ANALYTICS_VIEW',
  TEAM_MEMBERS: 'TEAM_MEMBERS',
  PRIORITY_SUPPORT: 'PRIORITY_SUPPORT',
  API_ACCESS: 'API_ACCESS',
} as const

export type FeatureKey = (typeof FEATURE_KEYS)[keyof typeof FEATURE_KEYS]
