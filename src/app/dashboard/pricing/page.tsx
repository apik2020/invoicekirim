'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAppSession } from '@/hooks/useAppSession'
import Link from 'next/link'
import { Check, Loader2, CheckCircle2, X, Info } from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'

interface PlanFeature {
  key: string
  name: string
  nameEn: string
  type: string
  value: boolean | number | null
}

interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  price_monthly: number
  price_yearly: number
  yearly_discount_percent: number | null
  currency: string
  stripePriceId: string | null
  trialDays: number
  is_popular: boolean
  ctaText: string | null
  features: PlanFeature[]
}

interface AvailableUpgradePlan {
  id: string
  name: string
  slug: string
  price_monthly: number
  price_yearly: number
  currency: string
  trialDays: number
  isTrial: boolean
  is_popular: boolean
  ctaText: string | null
  canUpgrade: boolean
  reason?: string
}

interface AvailablePlansResponse {
  currentPlan: {
    name: string
    slug: string
    status: string
    trialDaysLeft: number
  }
  availableUpgrades: AvailableUpgradePlan[]
  canStartTrial: boolean
  trialUsed: boolean
}

function PricingContent() {
  const { status } = useAppSession()
  const [plans, setPlans] = useState<Plan[]>([])
  const [availablePlansData, setAvailablePlansData] = useState<AvailablePlansResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  const checkout = searchParams.get('checkout')

  useEffect(() => {
    fetchPlans()
    if (status === 'authenticated') {
      fetchAvailablePlans()
    }
  }, [status])

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/pricing')
      if (res.ok) {
        const data = await res.json()
        setPlans(data.plans)
      }
    } catch (err) {
      console.error('Error fetching plans:', err)
    } finally {
      setIsLoading(false)
    }
  }

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

  const canUpgradeToPlan = (planSlug: string): boolean => {
    if (!availablePlansData) return true
    const plan = availablePlansData.availableUpgrades.find(p => p.slug === planSlug)
    return plan?.canUpgrade ?? false
  }

  const getPlanRestrictionReason = (planSlug: string): string | undefined => {
    if (!availablePlansData) return undefined
    const plan = availablePlansData.availableUpgrades.find(p => p.slug === planSlug)
    return plan?.reason
  }

  const formatPrice = (price: number) => {
    if (price === 0) return 'Rp 0'
    if (price >= 1000) {
      return new Intl.NumberFormat('id-ID', {
        notation: 'compact',
        compactDisplay: 'short',
      }).format(price).replace('rb', 'rb').replace('jt', ' jt')
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getFeatureDisplayText = (feature: PlanFeature) => {
    if (feature.value === false || feature.value === null || feature.value === undefined) {
      return feature.name
    }
    if (feature.key === 'invoice_limit' && typeof feature.value === 'number') {
      return `${feature.value} invoice per bulan`
    }
    if (feature.key === 'invoice_limit' && feature.value === true) {
      return 'Invoice tanpa batas'
    }
    return feature.name
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Pricing">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  const currentPlanSlug = availablePlansData?.currentPlan.slug

  return (
    <DashboardLayout title="Pricing">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-bold text-2xl md:text-3xl text-brand-500 tracking-tight">
              Pilih Paket
            </h1>
          </div>
          <p className="text-text-secondary">
            Bandingkan fitur dan pilih paket yang sesuai untuk bisnismu
          </p>
        </div>

        {/* Status Messages */}
        {checkout === 'canceled' && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 animate-squeezed">
            <div className="flex items-start gap-3">
              <X className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-red-800">Pembayaran Dibatalkan</p>
                <p className="text-sm text-red-700 mt-1">
                  Anda dapat membatalkan pembayaran kapan saja. Silakan coba lagi jika Anda masih tertarik.
                </p>
              </div>
            </div>
          </div>
        )}

        {checkout === 'success' && (
          <div className="p-4 rounded-xl bg-lime-50 border border-lime-200 animate-squeezed">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-lime-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-lime-800">Upgrade Berhasil!</p>
                <p className="text-sm text-lime-700 mt-1">
                  Selamat menikmati fitur Pro. Mulai buat invoice tanpa batas sekarang.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Current Plan Badge */}
        {availablePlansData && currentPlanSlug !== 'plan-free' && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
            <Info className="w-4 h-4" />
            Paket saat ini: {availablePlansData.currentPlan.name}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
          {plans.map((plan) => {
            const canUpgrade = canUpgradeToPlan(plan.slug)
            const restrictionReason = getPlanRestrictionReason(plan.slug)
            const isCurrentPlan = plan.slug === currentPlanSlug

            return (
              <div
                key={plan.id}
                className={`card p-6 relative ${
                  plan.is_popular ? 'ring-2 ring-brand-200' : ''
                } ${!canUpgrade && !isCurrentPlan ? 'opacity-60' : ''}`}
              >
                {/* Featured Badge */}
                {plan.is_popular && !isCurrentPlan && (
                  <div className="absolute -top-3 left-6">
                    <span className="px-3 py-1 bg-brand-500 text-white text-xs font-bold rounded-full">
                      POPULER
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-6">
                    <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                      Paket Saat Ini
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-text-primary">{plan.name}</h3>
                  <p className="text-sm text-text-secondary">{plan.description || ''}</p>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-3xl font-bold text-text-primary">
                    {formatPrice(plan.price_monthly)}
                  </span>
                  <span className="text-text-secondary text-sm"> /bulan</span>
                </div>

                {/* Status Tags */}
                <div className="flex items-center gap-4 mb-4 text-sm">
                  {!plan.is_popular && (
                    <span className="px-2 py-1 bg-lime-100 text-lime-700 rounded-full text-xs font-bold">
                      FREE
                    </span>
                  )}
                  {plan.trialDays > 0 && !availablePlansData?.trialUsed && (
                    <span className="text-text-muted">Trial {plan.trialDays} hari</span>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-2 mb-6 border-t border-gray-100 pt-4">
                  {(plan.features || []).filter(f => f.value !== false && f.value !== null && f.value !== undefined).map((feature) => (
                    <div key={feature.key} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-text-primary">
                        {getFeatureDisplayText(feature)}
                      </span>
                    </div>
                  ))}
                  {(plan.features || []).filter(f => f.value === false || f.value === null || f.value === undefined).map((feature) => (
                    <div key={feature.key} className="flex items-center gap-2 text-sm">
                      <X className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      <span className="text-text-muted">
                        {getFeatureDisplayText(feature)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                {isCurrentPlan ? (
                  <Link
                    href="/dashboard/billing"
                    className="block w-full px-6 py-4 bg-blue-50 text-blue-600 text-center font-semibold rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    Lihat Detail Paket
                  </Link>
                ) : plan.slug === 'plan-free' ? (
                  <Link
                    href="/dashboard"
                    className="block w-full px-6 py-4 btn-secondary text-center font-semibold rounded-xl"
                  >
                    {plan.ctaText || 'Paket Gratis'}
                  </Link>
                ) : canUpgrade ? (
                  <Link
                    href={`/dashboard/checkout?plan=${plan.slug}`}
                    className="block w-full px-6 py-4 btn-primary text-center font-semibold rounded-xl"
                  >
                    {plan.ctaText || 'Upgrade Sekarang'}
                  </Link>
                ) : (
                  <div className="relative group">
                    <button
                      disabled
                      className="block w-full px-6 py-4 bg-gray-100 text-gray-500 text-center font-semibold rounded-xl cursor-not-allowed"
                    >
                      {restrictionReason || 'Tidak Tersedia'}
                    </button>
                    {restrictionReason && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {restrictionReason}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </div>
                )}

                {/* Trust Note for featured plan */}
                {plan.is_popular && canUpgrade && (
                  <p className="text-center text-text-secondary mt-4 text-sm">
                    Tidak perlu kartu kredit • Batalkan kapan saja
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl">
          <h2 className="text-lg font-bold text-brand-500 mb-4">
            Pertanyaan yang Sering Diajukan
          </h2>
          <div className="space-y-3">
            <div className="card p-4">
              <h3 className="font-bold text-text-primary mb-1 text-sm">Apakah ada masa percobaan gratis?</h3>
              <p className="text-text-secondary text-sm">
                Ya! Paket Basic memiliki masa percobaan gratis 7 hari. Trial hanya dapat digunakan satu kali per akun.
              </p>
            </div>
            <div className="card p-4">
              <h3 className="font-bold text-text-primary mb-1 text-sm">Bagaimana cara membatalkan langganan?</h3>
              <p className="text-text-secondary text-sm">
                Anda dapat membatalkan langganan kapan saja dari halaman Billing. Tidak ada biaya penalti atau tersembunyi.
              </p>
            </div>
            <div className="card p-4">
              <h3 className="font-bold text-text-primary mb-1 text-sm">Apa yang terjadi setelah masa percobaan berakhir?</h3>
              <p className="text-text-secondary text-sm">
                Setelah 7 hari, Anda akan dialihkan ke paket Gratis secara otomatis. Data invoice Anda tetap aman.
              </p>
            </div>
            <div className="card p-4">
              <h3 className="font-bold text-text-primary mb-1 text-sm">Apakah saya bisa mengubah paket kapan saja?</h3>
              <p className="text-text-secondary text-sm">
                Ya, Anda dapat upgrade kapan saja. Upgrade hanya tersedia dari paket yang lebih rendah ke lebih tinggi.
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="text-sm text-text-secondary">
          Butuh bantuan atau ada pertanyaan?{' '}
          <a href="mailto:hello@notabener.com" className="text-brand-600 font-semibold hover:text-brand-700">
            Hubungi kami
          </a>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <DashboardLayout title="Pricing">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
        </div>
      </DashboardLayout>
    }>
      <PricingContent />
    </Suspense>
  )
}
