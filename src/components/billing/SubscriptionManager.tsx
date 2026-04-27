'use client'

import { useState, useEffect } from 'react'
import { Crown, X, Check, AlertCircle, Loader2, Sparkles, Info } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { AlertBox } from '@/components/Toast'

interface Subscription {
  id: string
  status: string
  planType: string
  stripeCurrentPeriodEnd: string | null
  stripeCustomerId: string | null
  isTrial?: boolean
  trialDaysLeft?: number
  trialEndsAt?: string | null
  trialUsed?: boolean
  pricingPlanId?: string | null
}

interface PlanFeature {
  id: string
  name: string
  key: string
  included: boolean
  limitValue: number | null
}

interface PricingPlan {
  id: string
  name: string
  slug: string
  description: string | null
  price_monthly: number
  price_yearly: number
  currency: string
  trialDays: number
  is_popular: boolean
  features: {
    key: string
    name: string
    type: string
    value: boolean | number | null
  }[]
}

interface AvailablePlansData {
  currentPlan: {
    name: string
    slug: string
    status: string
    trialDaysLeft: number
  }
  availableUpgrades: Array<{
    id: string
    name: string
    slug: string
    isTrial: boolean
    canUpgrade: boolean
    reason?: string
  }>
  canStartTrial: boolean
  trialUsed: boolean
}

interface SubscriptionManagerProps {
  subscription: Subscription | null
  onSubscriptionChange?: () => void
}

export function SubscriptionManager({
  subscription,
  onSubscriptionChange,
}: SubscriptionManagerProps) {
  const [canceling, setCanceling] = useState(false)
  const [downgrading, setDowngrading] = useState(false)
  const [startingTrial, setStartingTrial] = useState(false)
  const [availablePlansData, setAvailablePlansData] = useState<AvailablePlansData | null>(null)
  const [currentPlanFeatures, setCurrentPlanFeatures] = useState<PricingPlan | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isPro = subscription?.planType === 'PRO'
  const isTrial = subscription?.isTrial || subscription?.status === 'TRIALING'
  const isActive = subscription?.status === 'ACTIVE' || isTrial
  const isCanceled = subscription?.status === 'CANCELED'

  // Fetch available upgrade options and current plan features
  useEffect(() => {
    if (subscription) {
      fetchAvailablePlans()
      fetchCurrentPlanFeatures()
    }
  }, [subscription])

  const fetchAvailablePlans = async () => {
    try {
      const res = await fetch('/api/subscription/available-plans')
      if (res.ok) {
        const data = await res.json()
        setAvailablePlansData(data)
      }
    } catch (err) {
      console.error('Error fetching available plans:', err)
    }
  }

  const fetchCurrentPlanFeatures = async () => {
    try {
      // If user has a pricing plan, fetch its features
      if (subscription?.pricingPlanId) {
        const res = await fetch(`/api/pricing/plans/${subscription.pricingPlanId}`)
        if (res.ok) {
          const data = await res.json()
          setCurrentPlanFeatures(data)
        }
      } else {
        // Default to FREE plan features
        const res = await fetch('/api/pricing/plans/plan-free')
        if (res.ok) {
          const data = await res.json()
          setCurrentPlanFeatures(data)
        }
      }
    } catch (err) {
      console.error('Error fetching plan features:', err)
    }
  }

  // Check if user can start trial
  const canStartTrial = availablePlansData?.canStartTrial ?? false
  const trialUsed = availablePlansData?.trialUsed ?? false

  // Check if PRO plan is available for upgrade
  const proPlanAvailable = availablePlansData?.availableUpgrades.find(p => p.slug === 'plan-professional')
  const canUpgradeToPro = proPlanAvailable?.canUpgrade ?? false

  const handleStartTrial = async () => {
    if (!confirm('Mulai trial PRO 7 hari gratis? Setelah trial berakhir, Anda dapat memilih untuk upgrade ke PRO atau kembali ke FREE.')) {
      return
    }

    try {
      setStartingTrial(true)
      const res = await fetch('/api/subscription/start-trial', {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({
          type: 'success',
          text: 'Trial PRO 7 hari telah dimulai! Nikmati semua fitur premium.',
        })
        onSubscriptionChange?.()
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Gagal memulai trial',
        })
      }
    } catch (error) {
      console.error('Error starting trial:', error)
      setMessage({
        type: 'error',
        text: 'Terjadi kesalahan saat memulai trial',
      })
    } finally {
      setStartingTrial(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Apakah Anda yakin ingin membatalkan langganan? Akses PRO akan tetap aktif hingga akhir periode berlangganan.')) {
      return
    }

    try {
      setCanceling(true)
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Langganan akan dibatalkan pada ${formatDate(data.cancelAt)}`,
        })
        onSubscriptionChange?.()
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Gagal membatalkan langganan',
        })
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      setMessage({
        type: 'error',
        text: 'Terjadi kesalahan saat membatalkan langganan',
      })
    } finally {
      setCanceling(false)
    }
  }

  const handleDowngrade = async () => {
    if (!confirm('Apakah Anda yakin ingin downgrade ke FREE? Akses PRO akan tetap aktif hingga akhir periode berlangganan.')) {
      return
    }

    try {
      setDowngrading(true)
      const res = await fetch('/api/subscription/downgrade', {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({
          type: 'success',
          text: 'Langganan akan downgrade ke FREE pada akhir periode',
        })
        onSubscriptionChange?.()
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Gagal downgrade langganan',
        })
      }
    } catch (error) {
      console.error('Error downgrading subscription:', error)
      setMessage({
        type: 'error',
        text: 'Terjadi kesalahan saat downgrade langganan',
      })
    } finally {
      setDowngrading(false)
    }
  }

  const handleUpgrade = async () => {
    // Redirect to checkout page
    window.location.href = '/checkout'
  }

  const getDaysUntilExpiration = () => {
    if (!subscription?.stripeCurrentPeriodEnd) return null
    const now = new Date()
    const endDate = new Date(subscription.stripeCurrentPeriodEnd)
    const diffMs = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const daysUntilExpiration = getDaysUntilExpiration()

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className={`card p-6 ${isPro ? 'border-lime-200 bg-gradient-to-r from-lime-50 to-green-50' : 'border-orange-200'}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isPro ? 'bg-lime-500' : 'bg-orange-500'}`}>
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isPro ? 'Plan PRO' : 'Plan FREE'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isPro
                  ? 'Nikmati semua fitur premium tanpa batas'
                  : 'Upgrade ke PRO untuk akses fitur lengkap'}
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
            isPro ? 'bg-lime-100 text-lime-700' : 'bg-orange-100 text-orange-700'
          }`}>
            {isTrial && 'Trial Aktif'}
            {subscription?.status === 'ACTIVE' && !isTrial && 'Aktif'}
            {subscription?.status === 'CANCELED' && 'Akan Berakhir'}
            {subscription?.status === 'FREE' && 'Gratis'}
          </div>
        </div>

        {/* Trial Expiration Countdown */}
        {isTrial && subscription?.trialDaysLeft !== undefined && (
          <div className="mt-4 pt-4 border-t border-orange-200">
            <div className="flex items-center gap-2 text-sm text-orange-700">
              <Info className="w-4 h-4" />
              <span>
                Trial berakhir dalam <strong>{subscription.trialDaysLeft} hari</strong>
              </span>
            </div>
          </div>
        )}

        {/* Pro Expiration Countdown */}
        {isPro && !isTrial && daysUntilExpiration !== null && (
          <div className="mt-4 pt-4 border-t border-lime-200">
            <p className="text-sm text-gray-600">
              {isCanceled ? 'Langganan berakhir pada' : 'Perpanjangan otomatis pada'}{' '}
              <span className="font-semibold text-gray-900">
                {formatDate(subscription.stripeCurrentPeriodEnd!)}
              </span>
              {!isCanceled && (
                <span className="text-lime-600 ml-2">({daysUntilExpiration} hari lagi)</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Plan Comparison - Dynamic Features */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Fitur Langganan</h3>
        <p className="text-sm text-gray-500 mb-4">
          Berdasarkan paket {currentPlanFeatures?.name || (isPro ? 'PRO' : 'FREE')}
        </p>
        {currentPlanFeatures ? (
          <div className="space-y-3">
            {currentPlanFeatures.features.map((feature) => (
              <FeatureRow
                key={feature.key}
                feature={feature.name}
                available={feature.value !== false && feature.value !== null && feature.value !== undefined}
                limited={typeof feature.value === 'number'}
                limitValue={typeof feature.value === 'number' ? feature.value : null}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 text-sm">
            Memuat fitur...
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Kelola Langganan</h3>

        {isTrial ? (
          <div className="space-y-3">
            <AlertBox type="warning" title="Trial PRO Aktif!">
              Nikmati semua fitur premium selama {subscription?.trialDaysLeft || 7} hari lagi.
            </AlertBox>
            <button
              onClick={handleUpgrade}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 transition-colors font-medium shadow-lg shadow-orange-200"
            >
              <Crown className="w-4 h-4" />
              Upgrade ke PRO Sekarang
            </button>
          </div>
        ) : isPro ? (
          <div className="space-y-3">
            {isActive && !isCanceled && (
              <>
                <button
                  onClick={handleCancelSubscription}
                  disabled={canceling}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {canceling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  Batalkan Langganan
                </button>
                <button
                  onClick={handleDowngrade}
                  disabled={downgrading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downgrading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  Downgrade ke FREE
                </button>
              </>
            )}
            {isCanceled && (
              <AlertBox type="warning" title="Langganan Akan Berakhir">
                <p>
                  Langganan Anda akan berakhir pada{' '}
                  <span className="font-semibold">
                    {subscription?.stripeCurrentPeriodEnd
                      ? formatDate(subscription.stripeCurrentPeriodEnd)
                      : 'akhir periode'}
                  </span>
                  . Setelah itu, akun Anda akan kembali ke plan FREE.
                </p>
              </AlertBox>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Start Free Trial Button - Only show if trial not used */}
            {!trialUsed && canStartTrial ? (
              <>
                <button
                  onClick={handleStartTrial}
                  disabled={startingTrial}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 transition-colors font-medium shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {startingTrial ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Mulai Trial PRO 7 Hari Gratis
                </button>
                <p className="text-center text-sm text-gray-500">
                  Tidak perlu kartu kredit
                </p>
              </>
            ) : trialUsed ? (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Trial Sudah Digunakan</p>
                    <p className="text-xs text-gray-500">Anda sudah pernah menggunakan trial. Upgrade ke PRO untuk melanjutkan.</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">atau</span>
              </div>
            </div>

            {/* Upgrade Button - Disable if not available */}
            <button
              onClick={handleUpgrade}
              disabled={!canUpgradeToPro}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
                canUpgradeToPro
                  ? 'border-2 border-orange-200 text-orange-600 hover:bg-orange-50'
                  : 'border-2 border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Crown className="w-4 h-4" />
              Upgrade Langsung ke PRO
            </button>

            {!canUpgradeToPro && proPlanAvailable?.reason && (
              <p className="text-center text-xs text-gray-500">
                {proPlanAvailable.reason}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <AlertBox
          type={message.type === 'success' ? 'success' : 'error'}
          title={message.type === 'success' ? 'Berhasil' : 'Gagal'}
          onDismiss={() => setMessage(null)}
        >
          {message.text}
        </AlertBox>
      )}
    </div>
  )
}

interface FeatureRowProps {
  feature: string
  available: boolean
  limited?: boolean
  limitValue?: number | null
}

function FeatureRow({ feature, available, limited, limitValue }: FeatureRowProps) {
  const getFeatureText = () => {
    if (!available) return feature

    if (limited && limitValue !== null && limitValue !== undefined) {
      return `${feature} (${limitValue} per bulan)`
    }

    if (limited && limitValue === null) {
      return `${feature} (tak terbatas)`
    }

    return feature
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
        available
          ? limited ? 'bg-yellow-100' : 'bg-lime-100'
          : 'bg-gray-100'
      }`}>
        {available ? (
          <Check className={`w-3 h-3 ${limited ? 'text-yellow-600' : 'text-lime-600'}`} />
        ) : (
          <X className="w-3 h-3 text-gray-400" />
        )}
      </div>
      <span className={`text-sm ${available ? 'text-gray-900' : 'text-gray-500'}`}>
        {getFeatureText()}
      </span>
    </div>
  )
}
