'use client'

import { useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, Star, Loader2, ArrowRight, CheckCircle2, X } from 'lucide-react'
import Header from '@/components/Header'

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
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Gagal membuat checkout session')
    } finally {
      setLoadingPlan(null)
    }
  }

  const plans = [
    {
      id: 'free',
      name: 'Gratis',
      price: 'Rp 0',
      period: 'selamanya',
      description: 'Untuk freelancer yang baru mulai',
      featured: false,
      priceId: null,
      cta: 'Mulai Gratis',
      href: session ? '/dashboard/invoices/create' : '/login',
      badge: 'Forever Free',
      badgeClass: 'badge-lime',
      features: [
        { name: '10 invoice per bulan', included: true },
        { name: 'Template invoice profesional', included: true },
        { name: 'Simpan di cloud', included: true },
        { name: 'Download PDF', included: true },
        { name: 'Kirim via WhatsApp', included: true },
        { name: 'Email support', included: true },
        { name: 'Invoice tanpa batas', included: false },
        { name: 'Template premium', included: false },
        { name: 'Custom branding (logo, warna)', included: false },
        { name: 'Email otomatis ke klien', included: false },
        { name: 'Payment reminder otomatis', included: false },
        { name: 'Priority support', included: false },
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 'Rp 49K',
      period: '/bulan',
      description: 'Untuk bisnis yang berkembang',
      featured: true,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
      cta: 'Mulai Pro - Gratis 7 Hari',
      href: session ? '/dashboard/billing' : '/login',
      badge: 'POPULER',
      badgeClass: 'badge-pink',
      features: [
        { name: 'Invoice tanpa batas', included: true },
        { name: 'Template premium', included: true },
        { name: 'Custom branding (logo, warna)', included: true },
        { name: 'Email otomatis ke klien', included: true },
        { name: 'Payment reminder otomatis', included: true },
        { name: 'Priority support', included: true },
        { name: 'Multi-currency', included: true },
        { name: 'Ekspor Excel/CSV', included: true },
        { name: 'Analytics dashboard', included: true },
        { name: 'API Access', included: false },
        { name: 'Custom domain', included: false },
        { name: 'White label', included: false },
      ],
    },
  ]

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
                  plan.featured ? 'pricing-card-featured' : 'pricing-card'
                }`}
              >
                {/* Featured Badge */}
                {plan.featured && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                    <div className={`${plan.badgeClass} shadow-lg flex items-center gap-2 px-6 py-2 rounded-full`}>
                      <Star className="w-4 h-4" />
                      <span className="text-sm font-bold">{plan.badge}</span>
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className={plan.featured ? 'mt-4' : ''}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    {!plan.featured && (
                      <div className={`${plan.badgeClass} px-3 py-1 rounded-full text-xs font-bold`}>
                        {plan.badge}
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <span className={`text-4xl font-bold ${
                      plan.featured
                        ? 'bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent'
                        : 'text-gray-900'
                    }`}>
                      {plan.price}
                    </span>
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
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
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {plan.featured && plan.priceId ? (
                  <button
                    onClick={() => handleSubscribe(plan.priceId, plan.name)}
                    disabled={loadingPlan === plan.name}
                    className="block w-full px-6 py-4 btn-primary text-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <Link
                    href={plan.href}
                    className="block w-full px-6 py-4 btn-secondary text-center font-semibold"
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 inline ml-2" />
                  </Link>
                )}

                {/* Trust Note for Pro plan */}
                {plan.featured && (
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
