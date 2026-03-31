'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, X, Star, Loader2 } from 'lucide-react'

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

export default function LandingPricing() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  const formatPrice = (price: number) => {
    if (price === 0) return 'Rp 0'
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
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500" />
          </div>
        </div>
      </section>
    )
  }

  if (plans.length === 0) {
    return null
  }

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-500 mb-4">
            Pilih Paket yang Tepat
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Mulai gratis, upgrade kapan saja bisnis Anda berkembang
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={plan.isFeatured ? 'pricing-card-featured' : 'pricing-card'}
            >
              {/* Featured Badge */}
              {plan.isFeatured && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                  <div className="badge bg-primary-500 text-white shadow-primary flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    POPULER
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className={plan.isFeatured ? 'mt-2' : ''}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-brand-500">{plan.name}</h3>
                  {!plan.isFeatured && (
                    <div className="badge-paid">Forever Free</div>
                  )}
                </div>
                <p className="text-text-secondary mb-6">{plan.description || ''}</p>

                {/* Price */}
                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.isFeatured ? 'text-primary-500' : 'text-brand-500'}`}>
                    {formatPrice(plan.price)}
                  </span>
                  <span className="text-text-muted">/bulan</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {(plan.features || []).map((feature) => (
                  <li key={feature.id} className="flex items-start gap-3">
                    {feature.included ? (
                      <div className="checkmark mt-0.5">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center mt-0.5">
                        <X className="w-3 h-3 text-gray-400" />
                      </div>
                    )}
                    <span className={`text-sm ${feature.included ? 'text-text-secondary' : 'text-gray-400'}`}>
                      {getFeatureDisplayText(feature)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link
                href="/login"
                className={`block w-full px-6 py-3 text-center font-semibold ${
                  plan.isFeatured ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                {plan.ctaText || 'Mulai Sekarang'}
              </Link>

              {/* Trust Note for featured plan */}
              {plan.isFeatured && (
                <p className="text-center text-text-muted mt-4 text-sm">
                  Tidak perlu kartu kredit • Batalkan kapan saja
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-text-secondary">
            Butuh bantuan atau ada pertanyaan?{' '}
            <a href="mailto:hello@invoicekirim.com" className="text-primary-500 font-semibold hover:text-primary-600">
              Hubungi kami
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
