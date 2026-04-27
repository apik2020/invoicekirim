'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, Star, Loader2, ArrowRight, CheckCircle2, X, Info } from 'lucide-react'
import Header from '@/components/Header'

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
  const { data: session } = useSession()
  const [plans, setPlans] = useState<Plan[]>([])
  const [availablePlansData, setAvailablePlansData] = useState<AvailablePlansResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const checkout = searchParams.get('checkout')

  useEffect(() => {
    fetchPlans()
    if (session) {
      fetchAvailablePlans()
    }
  }, [session])

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

  const handleSubscribe = async (priceId: string, planName: string) => {
    if (!session) {
      window.location.href = `/login?redirect=/pricing`
      return
    }

    setLoadingPlan(planName)

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal membuat checkout session')
      }

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Gagal membuat checkout session')
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleStartTrial = async () => {
    if (!session) {
      window.location.href = `/login?redirect=/pricing`
      return
    }

    setLoadingPlan('Trial')

    try {
      const res = await fetch('/api/subscription/start-trial', {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal memulai trial')
      }

      window.location.href = '/dashboard?trial=started'
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Gagal memulai trial')
    } finally {
      setLoadingPlan(null)
    }
  }

  // Check if a plan is available for upgrade
  const canUpgradeToPlan = (planSlug: string): boolean => {
    if (!availablePlansData) return true // Show all plans if not logged in
    const plan = availablePlansData.availableUpgrades.find(p => p.slug === planSlug)
    return plan?.canUpgrade ?? false
  }

  // Get reason why plan is not available
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
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-orange-600 animate-spin" />
      </div>
    )
  }

  const currentPlanSlug = availablePlansData?.currentPlan.slug

  return (
    <div className="min-h-screen bg-fresh-bg">
      <Header />

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-orange-50 via-lemon-50/30 to-lime-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold mb-6">
              <Star className="w-4 h-4" />
              Simple, Transparent Pricing
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
              Pilih Paket yang Tepat
            </h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Mulai gratis, upgrade kapan saja bisnis Anda berkembang. Tidak ada biaya tersembunyi.
            </p>

            {/* Current Plan Badge */}
            {availablePlansData && currentPlanSlug !== 'plan-free' && (
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                <Info className="w-4 h-4" />
                Paket saat ini: {availablePlansData.currentPlan.name}
              </div>
            )}

            {/* Checkout Status Messages */}
            {checkout === 'canceled' && (
              <div className="mt-8 p-4 rounded-xl bg-red-50 border border-red-200 max-w-md mx-auto animate-squeezed">
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
              <div className="mt-8 p-4 rounded-xl bg-lime-50 border border-lime-200 max-w-md mx-auto animate-squeezed">
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
          </div>
        </div>
      </section>

          {/* Pricing Section */}
          <section className="py-20 bg-gradient-to-br from-orange-50 via-lemon-50/30 to-lime-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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
                      {plan.is_popular && (
                        <div className="absolute -top-3 left-6">
                          <span className="px-3 py-1 bg-brand-500 text-white text-xs font-bold rounded-full">
                            POPULER
                          </span>
                        </div>
                      )}

                      {/* Trial Used Badge */}
                      {plan.slug === 'plan-basic' && availablePlansData?.trialUsed && (
                        <div className="absolute -top-3 left-6">
                          <span className="px-3 py-1 bg-gray-500 text-white text-xs font-bold rounded-full">
                            Trial Sudah Digunakan
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
                        {/* Included features first */}
                        {(plan.features || []).filter(f => f.value !== false && f.value !== null && f.value !== undefined).map((feature) => (
                          <div key={feature.key} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-text-primary">
                              {getFeatureDisplayText(feature)}
                            </span>
                          </div>
                        ))}
                        {/* Not included features below */}
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
                        <div className="block w-full px-6 py-4 bg-gray-100 text-gray-500 text-center font-semibold rounded-xl cursor-not-allowed">
                          Paket Aktif
                        </div>
                      ) : plan.slug === 'plan-basic' && plan.trialDays > 0 ? (
                        canUpgrade ? (
                          <button
                            onClick={handleStartTrial}
                            disabled={loadingPlan === 'Trial'}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl btn-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loadingPlan === 'Trial' ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Memproses...
                              </>
                            ) : (
                              plan.ctaText || 'Mulai Trial Gratis'
                            )}
                          </button>
                        ) : (
                          <div className="relative group">
                            <button
                              disabled
                              className="block w-full px-6 py-4 bg-gray-100 text-gray-500 text-center font-semibold rounded-xl cursor-not-allowed"
                            >
                              {availablePlansData?.trialUsed ? 'Trial Sudah Digunakan' : 'Tidak Tersedia'}
                            </button>
                            {restrictionReason && (
                              <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                {restrictionReason}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                              </div>
                            )}
                          </div>
                        )
                      ) : plan.is_popular && plan.stripePriceId ? (
                        canUpgrade ? (
                          <button
                            onClick={() => handleSubscribe(plan.stripePriceId!, plan.name)}
                            disabled={loadingPlan === plan.name}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl btn-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loadingPlan === plan.name ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Memproses...
                              </>
                            ) : (
                              plan.ctaText || 'Mulai Sekarang'
                            )}
                          </button>
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
                        )
                      ) : (
                        <Link
                          href={session ? '/dashboard/invoices/create' : '/login'}
                          className="block w-full px-6 py-4 btn-secondary text-center font-semibold"
                        >
                          {plan.ctaText || 'Mulai Gratis'}
                          <ArrowRight className="w-4 h-4 inline ml-2" />
                        </Link>
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

              {/* Contact CTA */}
              <div className="mt-12 text-center">
                <p className="text-text-secondary">
                  Butuh bantuan atau ada pertanyaan?{' '}
                  <a href="mailto:hello@notabener.com" className="text-brand-600 font-semibold hover:text-brand-700">
                    Hubungi kami
                  </a>
                </p>
              </div>

              {/* FAQ Section */}
              <div className="mt-20 max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-text-primary text-center mb-12">
                  Pertanyaan yang Sering Diajukan
                </h2>
                <div className="space-y-6">
                  <div className="card p-6">
                    <h3 className="font-bold text-text-primary mb-2">Apakah ada masa percobaan gratis?</h3>
                    <p className="text-text-secondary">
                      Ya! Paket Pro memiliki masa percobaan gratis 7 hari. Trial hanya dapat digunakan satu kali per akun.
                    </p>
                  </div>
                  <div className="card p-6">
                    <h3 className="font-bold text-text-primary mb-2">Bagaimana cara membatalkan langganan?</h3>
                    <p className="text-text-secondary">
                      Anda dapat membatalkan langganan kapan saja dari dashboard. Tidak ada biaya penalti atau tersembunyi.
                    </p>
                  </div>
                  <div className="card p-6">
                    <h3 className="font-bold text-text-primary mb-2">Apa yang terjadi setelah masa percobaan berakhir?</h3>
                    <p className="text-text-secondary">
                      Setelah 7 hari, Anda akan dialihkan ke paket Gratis secara otomatis. Data invoice Anda tetap aman.
                    </p>
                  </div>
                  <div className="card p-6">
                    <h3 className="font-bold text-text-primary mb-2">Apakah saya bisa mengubah paket kapan saja?</h3>
                    <p className="text-text-secondary">
                      Ya, Anda dapat upgrade kapan saja dari dashboard billing. Upgrade hanya tersedia dari paket yang lebih rendah ke lebih tinggi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="py-20 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">
                Siap Membuat Invoice Profesional?
              </h2>
              <p className="text-xl text-text-secondary mb-8">
                Bergabung dengan ribuan freelancer Indonesia yang sudah menggunakan NotaBener
              </p>
              <Link
                href={session ? '/dashboard/invoices/create' : '/login'}
                className="inline-flex items-center gap-2 px-8 py-4 btn-primary font-semibold text-lg"
              >
                {session ? 'Buat Invoice Sekarang' : 'Mulai Gratis'}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </section>
        </div>
      )
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-orange-600 animate-spin" />
      </div>
    }>
      <PricingContent />
    </Suspense>
  )
}
