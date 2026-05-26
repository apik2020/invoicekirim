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
  billingPeriod: 'MONTHLY' | 'YEARLY'
  stripePriceId: string | null
  trialDays: number
  isFeatured: boolean
  ctaText: string | null
  features: PlanFeature[]
}

interface LandingPricingProps {
  locale: string
  t: {
    headline: string
    subheadline: string
    popularLabel: string
    perMonth: string
    perYear: string
    yearlySavings: string
    monthly: string
    yearly: string
    perMonthEquivalent: string
    noCreditCard: string
    needHelp: string
    contactUs: string
  }
}

export default function LandingPricing({ t }: LandingPricingProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [billingPeriod, setBillingPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')

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

  const formatMonthlyEquiv = (yearlyPrice: number) => {
    const monthly = Math.round(yearlyPrice / 12)
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(monthly)
  }

  const getFeatureDisplayText = (feature: PlanFeature) => {
    if (!feature.included) {
      return feature.name
    }
    if (feature.key === 'invoice_limit') {
      if (feature.limitValue) {
        return `${feature.limitValue} invoice/bulan`
      }
      return 'Invoice unlimited'
    }
    return feature.name
  }

  const getPriceSuffix = (plan: Plan) => {
    if (plan.price === 0) return ''
    return plan.billingPeriod === 'YEARLY' ? t.perYear : t.perMonth
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

  // Filter plans: always show free & trial, show paid plans matching selected billing period
  const displayedPlans = plans.filter(plan => {
    if (plan.slug === 'plan-free' || plan.slug === 'plan-basic') return true
    return plan.billingPeriod === billingPeriod
  })

  // Get all unique feature names across displayed plans
  const allFeatures = displayedPlans.reduce((acc: { id: string; name: string }[], plan) => {
    plan.features.forEach(f => {
      if (!acc.find(a => a.id === f.id)) {
        acc.push({ id: f.id, name: f.name })
      }
    })
    return acc
  }, [])

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-500 mb-4">
            {t.headline}
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            {t.subheadline}
          </p>
        </div>

        {/* Billing Period Toggle */}
        <div className="flex items-center justify-center mb-12">
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setBillingPeriod('MONTHLY')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                billingPeriod === 'MONTHLY'
                  ? 'bg-white text-brand-500 shadow-md'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t.monthly}
            </button>
            <button
              onClick={() => setBillingPeriod('YEARLY')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                billingPeriod === 'YEARLY'
                  ? 'bg-white text-brand-500 shadow-md'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t.yearly}
              <span className="px-2 py-0.5 bg-success-100 text-success-700 text-xs font-bold rounded-full">
                {t.yearlySavings}
              </span>
            </button>
          </div>
        </div>

        {/* Desktop: Table View */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-4 bg-gray-50 rounded-tl-xl w-1/3">
                    <span className="text-lg font-semibold text-text-primary">Fitur</span>
                  </th>
                  {displayedPlans.map((plan, index) => (
                    <th
                      key={plan.id}
                      className={`p-4 ${plan.isFeatured ? 'bg-primary-500 border-2 border-primary-500' : 'bg-gray-50 border-2 border-transparent'} ${index === displayedPlans.length - 1 ? 'rounded-tr-xl' : ''}`}
                    >
                      <div className="text-center">
                        {plan.isFeatured && (
                          <div className="inline-flex items-center gap-1 text-white/80 text-xs mb-1">
                            <Star className="w-3 h-3" />
                            {t.popularLabel}
                          </div>
                        )}
                        <h3 className={`text-xl font-bold ${plan.isFeatured ? 'text-white' : 'text-brand-500'}`}>
                          {plan.name}
                        </h3>
                        <p className={`text-sm ${plan.isFeatured ? 'text-white/80' : 'text-text-secondary'}`}>
                          {plan.description || ''}
                        </p>
                        <div className="mt-4">
                          <span className={`text-3xl font-bold ${plan.isFeatured ? 'text-white' : 'text-brand-500'}`}>
                            {formatPrice(plan.price)}
                          </span>
                          <span className={plan.isFeatured ? 'text-white/80' : 'text-text-muted'}>
                            {getPriceSuffix(plan)}
                          </span>
                        </div>
                        {plan.billingPeriod === 'YEARLY' && plan.price > 0 && (
                          <p className={`text-sm mt-1 ${plan.isFeatured ? 'text-white/70' : 'text-text-muted'}`}>
                            ~{formatMonthlyEquiv(plan.price)}{t.perMonthEquivalent}
                          </p>
                        )}
                        <Link
                          href="/register"
                          className={`inline-block mt-4 px-6 py-2.5 rounded-lg font-semibold text-sm ${
                            plan.isFeatured
                              ? 'bg-white text-primary-500 hover:bg-gray-100'
                              : 'bg-brand-500 text-white hover:bg-brand-600'
                          }`}
                        >
                          {plan.ctaText || 'Mulai Sekarang'}
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((feature, rowIndex) => (
                  <tr key={feature.id} className={rowIndex === allFeatures.length - 1 ? 'last:child:border-b-0' : ''}>
                    <td className="p-4 border-b border-gray-100 bg-gray-50/50">
                      <span className="text-text-secondary">{feature.name}</span>
                    </td>
                    {displayedPlans.map((plan) => {
                      const planFeature = plan.features.find(f => f.id === feature.id)
                      const isIncluded = planFeature?.included

                      return (
                        <td
                          key={`${plan.id}-${feature.id}`}
                          className={`p-4 border-b border-gray-100 text-center ${plan.isFeatured ? 'bg-primary-50/30' : ''}`}
                        >
                          {isIncluded ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-success-400 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                              {planFeature?.key === 'invoice_limit' && planFeature.limitValue && (
                                <span className="text-sm text-text-secondary">
                                  {planFeature.limitValue}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mx-auto">
                              <X className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                {/* Bottom row with CTA */}
                <tr>
                  <td className="p-4 bg-gray-50 rounded-bl-xl"></td>
                  {displayedPlans.map((plan, index) => (
                    <td
                      key={`cta-${plan.id}`}
                      className={`p-4 text-center ${plan.isFeatured ? 'bg-primary-50/30' : ''} ${index === displayedPlans.length - 1 ? 'rounded-br-xl' : ''}`}
                    >
                      {plan.isFeatured && (
                        <p className="text-text-muted text-xs mt-2">
                          {t.noCreditCard}
                        </p>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile: Card View */}
        <div className="md:hidden space-y-6">
          {displayedPlans.map((plan) => (
            <div
              key={plan.id}
              className={plan.isFeatured ? 'pricing-card-featured' : 'pricing-card'}
            >
              {/* Featured Badge */}
              {plan.isFeatured && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                  <div className="badge bg-primary-500 text-white shadow-primary flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    {t.popularLabel}
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className={plan.isFeatured ? 'mt-2' : ''}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-brand-500">{plan.name}</h3>
                  {!plan.isFeatured && plan.price === 0 && (
                    <div className="badge-paid">FREE</div>
                  )}
                </div>
                <p className="text-text-secondary mb-6">{plan.description || ''}</p>

                {/* Price */}
                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.isFeatured ? 'text-primary-500' : 'text-brand-500'}`}>
                    {formatPrice(plan.price)}
                  </span>
                  <span className="text-text-muted">{getPriceSuffix(plan)}</span>
                </div>
                {plan.billingPeriod === 'YEARLY' && plan.price > 0 && (
                  <p className="text-text-muted text-sm -mt-4 mb-6">
                    ~{formatMonthlyEquiv(plan.price)}{t.perMonthEquivalent}
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {(plan.features || []).filter(f => f.included).map((feature) => (
                  <li key={feature.id} className="flex items-start gap-3">
                    <div className="checkmark mt-0.5">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-text-secondary">
                      {getFeatureDisplayText(feature)}
                    </span>
                  </li>
                ))}
                {(plan.features || []).filter(f => !f.included).map((feature) => (
                  <li key={feature.id} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center mt-0.5">
                      <X className="w-3 h-3 text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-400">
                      {getFeatureDisplayText(feature)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link
                href="/register"
                className={`block w-full px-6 py-3 text-center font-semibold ${
                  plan.isFeatured ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                {plan.ctaText || 'Mulai Sekarang'}
              </Link>

              {plan.isFeatured && (
                <p className="text-center text-text-muted mt-4 text-sm">
                  {t.noCreditCard}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-text-secondary">
            {t.needHelp}{' '}
            <a href="mailto:hello@notabener.com" className="text-primary-500 font-semibold hover:text-primary-600">
              {t.contactUs}
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
