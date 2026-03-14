'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, Star, Loader2, ArrowRight, CheckCircle2, X } from 'lucide-react'
import Header from '@/components/Header'

interface PlanFeature {
  id: string
  name: string
  key: string
  included: boolean
  limitValue: number | null
}

interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  currency: string
  stripePriceId: string | null
  trialDays: number
  isFeatured: boolean
  ctaText: string | null
  features: PlanFeature[]
}

function PricingContent() {
  const { data: session } = useSession()
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const checkout = searchParams.get('checkout')

  useEffect(() => {
    fetchPlans()
  }, [])

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
    if (!feature.included) {
      return feature.name
    }
    if (feature.key === 'invoice_limit') {
      if (feature.limitValue) {
        return `${feature.limitValue} invoice per bulan`
      }
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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Pilih Paket yang Tepat
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Mulai gratis, upgrade kapan saja bisnis Anda berkembang. Tidak ada biaya tersembunyi.
            </p>

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
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative ${
                  plan.isFeatured ? 'pricing-card-featured' : 'pricing-card'
                }`}
              >
                {/* Featured Badge */}
                {plan.isFeatured && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                    <div className="badge-pink shadow-lg flex items-center gap-2 px-6 py-2 rounded-full">
                      <Star className="w-4 h-4" />
                      <span className="text-sm font-bold">POPULER</span>
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className={plan.isFeatured ? 'mt-4' : ''}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    {!plan.isFeatured && (
                      <div className="badge-lime px-3 py-1 rounded-full text-xs font-bold">
                        Forever Free
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 mb-6">{plan.description || ''}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <span className={`text-4xl font-bold ${
                      plan.isFeatured
                        ? 'bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent'
                        : 'text-gray-900'
                    }`}>
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-gray-600 ml-2">/bulan</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {(plan.features || []).map((feature) => (
                    <li key={feature.id} className="flex items-start gap-3">
                      {feature.included ? (
                        <div className="checkmark mt-0.5 flex-shrink-0">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center mt-0.5 flex-shrink-0">
                          <X className="w-3 h-3 text-gray-400" />
                        </div>
                      )}
                      <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                        {getFeatureDisplayText(feature)}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {plan.isFeatured && plan.stripePriceId ? (
                  <button
                    onClick={() => handleSubscribe(plan.stripePriceId!, plan.name)}
                    disabled={loadingPlan === plan.name}
                    className="block w-full px-6 py-4 btn-primary text-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingPlan === plan.name ? (
                      <>
                        <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      plan.ctaText || 'Mulai Sekarang'
                    )}
                  </button>
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
                {plan.isFeatured && (
                  <p className="text-center text-gray-600 mt-4 text-sm">
                    Tidak perlu kartu kredit • Batalkan kapan saja
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Enterprise CTA */}
          <div className="mt-12 text-center">
            <p className="text-gray-600">
              Butuh paket enterprise untuk tim?{' '}
              <a href="mailto:hello@invoicekirim.com" className="text-orange-600 font-semibold hover:text-orange-700">
                Hubungi kami
              </a>
            </p>
          </div>

          {/* FAQ Section */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Pertanyaan yang Sering Diajukan
            </h2>
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-2">Apakah ada masa percobaan gratis?</h3>
                <p className="text-gray-600">
                  Ya! Paket Pro memiliki masa percobaan gratis 7 hari. Anda tidak perlu memasukkan kartu kredit saat mendaftar.
                </p>
              </div>
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-2">Bagaimana cara membatalkan langganan?</h3>
                <p className="text-gray-600">
                  Anda dapat membatalkan langganan kapan saja dari dashboard. Tidak ada biaya penalti atau tersembunyi.
                </p>
              </div>
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-2">Apa yang terjadi setelah masa percobaan berakhir?</h3>
                <p className="text-gray-600">
                  Setelah 7 hari, Anda akan dialihkan ke paket Gratis secara otomatis. Data invoice Anda tetap aman.
                </p>
              </div>
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-2">Apakah saya bisa mengubah paket kapan saja?</h3>
                <p className="text-gray-600">
                  Ya, Anda dapat upgrade atau downgrade kapan saja dari dashboard billing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Siap Membuat Invoice Profesional?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Bergabung dengan ribuan freelancer Indonesia yang sudah menggunakan InvoiceKirim
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
