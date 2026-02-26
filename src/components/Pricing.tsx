'use client'

import { useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { Check, X, Star, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

const plans = [
  {
    name: 'Gratis',
    price: 'Rp 0',
    period: 'selamanya',
    description: 'Untuk freelancer yang baru mulai',
    featured: false,
    priceId: null,
    cta: 'Mulai Gratis',
    features: [
      { name: '10 invoice per bulan', included: true },
      { name: 'Template invoice dasar', included: true },
      { name: 'Simpan di cloud', included: true },
      { name: 'Ekspor PDF', included: true },
      { name: 'Kirim via WhatsApp', included: true },
      { name: 'Custom branding', included: false },
      { name: 'Unlimited invoice', included: false },
      { name: 'Priority support', included: false },
    ],
  },
  {
    name: 'Pro',
    price: 'Rp 49.000',
    period: '/bulan',
    description: 'Untuk freelancer profesional',
    featured: true,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
    cta: 'Mulai Pro - Gratis 7 Hari',
    features: [
      { name: '10 invoice per bulan', included: false },
      { name: 'Template invoice dasar', included: false },
      { name: 'Simpan di cloud', included: true },
      { name: 'Ekspor PDF', included: true },
      { name: 'Kirim via WhatsApp', included: true },
      { name: 'Custom branding (logo, warna)', included: true },
      { name: 'Unlimited invoice', included: true },
      { name: 'Priority support', included: true },
    ],
  },
]

function PricingContent() {
  const { data: session } = useSession()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const checkout = searchParams.get('checkout')

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
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <section id="pricing" className="py-32 md:py-40 bg-ice-blue/20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-8 neu-card-md animate-float">
            <Star className="w-4 h-4 text-cyan-bright" />
            <span className="text-sm font-bold text-slate">Pricing</span>
          </div>
          <h2 className="font-display text-extrabold text-4xl md:text-5xl lg:text-6xl text-slate mb-6 tracking-tight">
            Pilih Paket Anda
          </h2>
          <p className="font-body text-lg md:text-xl text-muted max-w-2xl mx-auto">
            Mulai gratis, upgrade kapanpun Anda siap berkembang.
          </p>

          {/* Checkout Status Messages */}
          {checkout === 'success' && (
            <div className="mt-6 p-4 rounded-2xl bg-green-light-50 border border-green-200 max-w-md mx-auto">
              <p className="font-body text-teal-light-700">
                🎉 Upgrade berhasil! Selamat menikmati fitur Pro.
              </p>
            </div>
          )}
          {checkout === 'canceled' && (
            <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-200 max-w-md mx-auto">
              <p className="font-body text-red-700">
                Checkout dibatalkan. Silakan coba lagi.
              </p>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-10 transition-all duration-300 ${
                plan.featured
                  ? 'neu-card transform md:-translate-y-4 border-2 border-arctic-blue/20'
                  : 'neu-card hover:-translate-y-2'
              }`}
            >
              {/* Featured Badge */}
              {plan.featured && (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                  <div className="px-6 py-2 bg-arctic-blue text-snow text-sm font-bold rounded-2xl neu-button-primary animate-scale-pulse">
                    POPULER
                  </div>
                </div>
              )}

              {/* Plan Name */}
              <div className="text-center mb-8">
                <h3 className="font-display text-3xl font-bold text-slate mb-3 tracking-tight">
                  {plan.name}
                </h3>
                <p className="font-body text-muted">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-10 pb-8 border-b border-slate/10">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="font-display text-5xl md:text-6xl font-extrabold text-slate tracking-tight">
                    {plan.price}
                  </span>
                  <span className="font-body text-muted text-lg">{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-10">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-0.5">
                      {feature.included ? (
                        <div className="w-6 h-6 rounded-xl shadow-extruded-sm flex items-center justify-center">
                          <Check className="w-4 h-4 text-navy" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-xl shadow-inset-sm flex items-center justify-center">
                          <X className="w-4 h-4 text-slate/30" />
                        </div>
                      )}
                    </div>
                    <span className={`font-body text-sm ${feature.included ? 'text-slate' : 'text-slate/40'}`}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              {plan.featured && plan.priceId ? (
                <button
                  onClick={() => handleSubscribe(plan.priceId, plan.name)}
                  disabled={loadingPlan === plan.name}
                  className={`block w-full text-center py-4 font-display font-bold rounded-2xl transition-all duration-300 focus-ring neu-button-primary hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loadingPlan === plan.name ? (
                    <>
                      <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    plan.cta
                  )}
                </button>
              ) : (
                <a
                  href={session ? '/dashboard/invoices/create' : '/login'}
                  className={`block w-full text-center py-4 font-display font-bold rounded-2xl transition-all duration-300 focus-ring ${
                    plan.featured
                      ? 'neu-button-primary hover:-translate-y-1'
                      : 'neu-button hover:text-arctic-blue hover:-translate-y-1'
                  }`}
                >
                  {plan.cta}
                </a>
              )}

              {/* Note for Pro plan */}
              {plan.featured && (
                <p className="text-center text-sm text-muted mt-6 font-body">
                  Tidak perlu kartu kredit • Batalkan kapan saja
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Trust Note */}
        <div className="mt-20 text-center max-w-2xl mx-auto">
          <p className="font-body text-muted">
            Butuh paket enterprise untuk tim?{' '}
            <a href="mailto:hello@invoicekirim.com" className="text-arctic-blue font-bold hover:underline">
              Hubungi kami
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}

export default function Pricing() {
  return (
    <Suspense fallback={
      <section id="pricing" className="py-32 md:py-40 bg-ice-blue/20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p>Loading...</p>
          </div>
        </div>
      </section>
    }>
      <PricingContent />
    </Suspense>
  )
}
