'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, X, Star, Loader2 } from 'lucide-react'

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
    yearlyDiscount: string
  }
}

export default function PricingSection({ locale, t }: LandingPricingProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [billing, setBilling] = useState<'monthly' | 'yearly'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('pricing-billing') as 'monthly' | 'yearly') || 'monthly'
    }
    return 'monthly'
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pricing-billing', billing)
    }
  }, [billing])

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
    if (price === 0) return locale === 'en' ? 'Rp 0' : 'Rp 0'
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

  const getDisplayPrice = (plan: Plan) => {
    if (plan.slug === 'plan-free') return 0
    return billing === 'yearly' ? plan.price_yearly : plan.price_monthly
  }

  const getPriceSuffix = (plan: Plan) => {
    if (plan.slug === 'plan-free') return ''
    return billing === 'yearly' ? t.perYear : t.perMonth
  }

  const getFeatureDisplayText = (feature: PlanFeature) => {
    if (feature.value === false || feature.value === null || feature.value === undefined) {
      return feature.name
    }
    if (feature.key === 'invoice_limit' && typeof feature.value === 'number') {
      return locale === 'en' ? `${feature.value} invoices/month` : `${feature.value} invoice/bulan`
    }
    if (feature.key === 'invoice_limit' && feature.value === true) {
      return locale === 'en' ? 'Unlimited invoices' : 'Invoice unlimited'
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

  if (plans.length === 0) return null

  // Get all unique features across plans
  const allFeatures = plans.reduce((acc: { key: string; name: string; nameEn: string }[], plan) => {
    plan.features.forEach(f => {
      if (!acc.find(a => a.key === f.key)) {
        acc.push({ key: f.key, name: f.name, nameEn: f.nameEn })
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
              onClick={() => setBilling('monthly')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                billing === 'monthly'
                  ? 'bg-white text-brand-500 shadow-md'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t.monthly}
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                billing === 'yearly'
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
                  <th className="text-left p-4 bg-gray-50 rounded-tl-xl w-1/4">
                    <span className="text-lg font-semibold text-text-primary">Fitur</span>
                  </th>
                  {plans.map((plan, index) => (
                    <th
                      key={plan.id}
                      className={`p-4 ${plan.is_popular ? 'bg-primary-500 border-2 border-primary-500' : 'bg-gray-50 border-2 border-transparent'} ${index === plans.length - 1 ? 'rounded-tr-xl' : ''}`}
                    >
                      <div className="text-center">
                        {plan.is_popular && (
                          <div className="inline-flex items-center gap-1 text-white/80 text-xs mb-1">
                            <Star className="w-3 h-3" />
                            {t.popularLabel}
                          </div>
                        )}
                        <h3 className={`text-xl font-bold ${plan.is_popular ? 'text-white' : 'text-brand-500'}`}>
                          {plan.name}
                        </h3>
                        <p className={`text-sm ${plan.is_popular ? 'text-white/80' : 'text-text-secondary'}`}>
                          {plan.description || ''}
                        </p>
                        <div className="mt-4">
                          <span className={`text-3xl font-bold ${plan.is_popular ? 'text-white' : 'text-brand-500'}`}>
                            {formatPrice(getDisplayPrice(plan))}
                          </span>
                          <span className={plan.is_popular ? 'text-white/80' : 'text-text-muted'}>
                            {getPriceSuffix(plan)}
                          </span>
                        </div>
                        {billing === 'yearly' && getDisplayPrice(plan) > 0 && (
                          <p className={`text-sm mt-1 ${plan.is_popular ? 'text-white/70' : 'text-text-muted'}`}>
                            ~{formatMonthlyEquiv(getDisplayPrice(plan))}{t.perMonthEquivalent}
                          </p>
                        )}
                        {plan.yearly_discount_percent && billing === 'yearly' && (
                          <p className={`text-xs mt-1 font-bold ${plan.is_popular ? 'text-white/90' : 'text-success-600'}`}>
                            {t.yearlyDiscount.replace('{percent}', String(plan.yearly_discount_percent))}
                          </p>
                        )}
                        <Link
                          href="/login"
                          className={`inline-block mt-4 px-6 py-2.5 rounded-lg font-semibold text-sm ${
                            plan.is_popular
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
                  <tr key={feature.key}>
                    <td className="p-4 border-b border-gray-100 bg-gray-50/50">
                      <span className="text-text-secondary">{locale === 'en' ? feature.nameEn : feature.name}</span>
                    </td>
                    {plans.map((plan) => {
                      const planFeature = plan.features.find(f => f.key === feature.key)
                      const isIncluded = planFeature?.value !== false && planFeature?.value !== null && planFeature?.value !== undefined

                      return (
                        <td
                          key={`${plan.id}-${feature.key}`}
                          className={`p-4 border-b border-gray-100 text-center ${plan.is_popular ? 'bg-primary-50/30' : ''}`}
                        >
                          {isIncluded ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-success-400 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                              {planFeature?.key === 'invoice_limit' && typeof planFeature.value === 'number' && (
                                <span className="text-sm text-text-secondary">
                                  {planFeature.value}
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
                <tr>
                  <td className="p-4 bg-gray-50 rounded-bl-xl"></td>
                  {plans.map((plan, index) => (
                    <td
                      key={`cta-${plan.id}`}
                      className={`p-4 text-center ${plan.is_popular ? 'bg-primary-50/30' : ''} ${index === plans.length - 1 ? 'rounded-br-xl' : ''}`}
                    >
                      {plan.is_popular && (
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
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={plan.is_popular ? 'pricing-card-featured' : 'pricing-card'}
            >
              {plan.is_popular && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                  <div className="badge bg-primary-500 text-white shadow-primary flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    {t.popularLabel}
                  </div>
                </div>
              )}

              <div className={plan.is_popular ? 'mt-2' : ''}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-brand-500">{plan.name}</h3>
                  {!plan.is_popular && plan.slug === 'plan-free' && (
                    <div className="badge-paid">FREE</div>
                  )}
                </div>
                <p className="text-text-secondary mb-6">{plan.description || ''}</p>

                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.is_popular ? 'text-primary-500' : 'text-brand-500'}`}>
                    {formatPrice(getDisplayPrice(plan))}
                  </span>
                  <span className="text-text-muted">{getPriceSuffix(plan)}</span>
                </div>
                {billing === 'yearly' && getDisplayPrice(plan) > 0 && (
                  <p className="text-text-muted text-sm -mt-4 mb-6">
                    ~{formatMonthlyEquiv(getDisplayPrice(plan))}{t.perMonthEquivalent}
                  </p>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.filter(f => f.value !== false && f.value !== null && f.value !== undefined).map((feature) => (
                  <li key={feature.key} className="flex items-start gap-3">
                    <div className="checkmark mt-0.5">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-text-secondary">
                      {getFeatureDisplayText(feature)}
                    </span>
                  </li>
                ))}
                {plan.features.filter(f => f.value === false || f.value === null || f.value === undefined).map((feature) => (
                  <li key={feature.key} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center mt-0.5">
                      <X className="w-3 h-3 text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-400">
                      {getFeatureDisplayText(feature)}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className={`block w-full px-6 py-3 text-center font-semibold ${
                  plan.is_popular ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                {plan.ctaText || 'Mulai Sekarang'}
              </Link>

              {plan.is_popular && (
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
