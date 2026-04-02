'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface SubscriptionGuardState {
  isLocked: boolean
  isLoading: boolean
  reason: 'trial_expired' | 'plan_limit' | null
  trialEndsAt: string | null
  planName: string
}

// Pages that remain accessible even when locked
const ALLOWED_PATHS_WHEN_LOCKED = [
  '/dashboard/billing',
  '/dashboard/settings',
  '/dashboard/bantuan',
  '/login',
  '/logout',
]

export function useSubscriptionGuard() {
  const router = useRouter()
  const pathname = usePathname()
  const [state, setState] = useState<SubscriptionGuardState>({
    isLocked: false,
    isLoading: true,
    reason: null,
    trialEndsAt: null,
    planName: 'Gratis',
  })

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const res = await fetch('/api/subscription')

        if (!res.ok) {
          setState(prev => ({ ...prev, isLoading: false }))
          return
        }

        const data = await res.json()

        // User is locked if trial has expired (server returns trialExpired flag)
        const isLocked = data.trialExpired === true

        setState({
          isLocked,
          isLoading: false,
          reason: data.trialExpired ? 'trial_expired' : null,
          trialEndsAt: data.trialEndsAt,
          planName: data.planName || 'Gratis',
        })

        // If locked and trying to access restricted page, redirect to billing
        if (isLocked && !isAllowedPath(pathname)) {
          router.push('/dashboard/billing?trial_expired=true')
        }
      } catch (error) {
        console.error('Error checking subscription:', error)
        setState(prev => ({ ...prev, isLoading: false }))
      }
    }

    checkSubscription()
  }, [pathname, router])

  return state
}

function isAllowedPath(pathname: string): boolean {
  return ALLOWED_PATHS_WHEN_LOCKED.some(path => pathname.startsWith(path))
}

// Component to wrap protected dashboard content
export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { isLocked, isLoading, reason } = useSubscriptionGuard()
  const pathname = usePathname()

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    )
  }

  // If not locked or on allowed path, show content
  if (!isLocked || isAllowedPath(pathname)) {
    return <>{children}</>
  }

  // Show locked overlay
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-10V4a2 2 0 00-2-2H8a2 2 0 00-2 2v1m8 0V4a2 2 0 012-2h2a2 2 0 012 2v1M5 9h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9a2 2 0 012-2z"
            />
          </svg>
        </div>

        {reason === 'trial_expired' ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Masa Trial Berakhir
            </h2>
            <p className="text-gray-600 mb-6">
              Masa percobaan gratis Anda telah berakhir. Pilih paket untuk melanjutkan menggunakan semua fitur NotaBener.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Akses Terkunci
            </h2>
            <p className="text-gray-600 mb-6">
              Upgrade paket Anda untuk mengakses fitur ini.
            </p>
          </>
        )}

        <div className="space-y-3">
          <button
            onClick={() => window.location.href = '/dashboard/billing'}
            className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors"
          >
            Lihat Paket
          </button>
          <button
            onClick={() => window.location.href = '/dashboard/bantuan'}
            className="w-full py-3 px-4 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Hubungi Bantuan
          </button>
        </div>
      </div>
    </div>
  )
}
