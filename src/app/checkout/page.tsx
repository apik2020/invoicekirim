'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppSession } from '@/hooks/useAppSession'
import Link from 'next/link'
import {
  Check,
  Loader2,
  CreditCard,
  Building2,
  QrCode,
  ArrowLeft,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  Sparkles,
  Zap,
  Crown,
} from 'lucide-react'
import { Logo } from '@/components/Logo'

const VA_BANKS = [
  { code: 'BCA', name: 'BCA', description: 'Virtual Account BCA' },
  { code: 'BNI', name: 'BNI', description: 'Virtual Account BNI' },
  { code: 'BRI', name: 'BRI', description: 'Virtual Account BRI' },
  { code: 'MANDIRI', name: 'Mandiri', description: 'Virtual Account Mandiri' },
  { code: 'PERMATA', name: 'Permata', description: 'Virtual Account Permata' },
  { code: 'CIMB', name: 'CIMB Niaga', description: 'Virtual Account CIMB Niaga' },
]

type Step = 'plan' | 'payment' | 'va' | 'qris' | 'processing' | 'success'

interface PricingPlan {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  currency: string
  trialDays: number
  isFeatured: boolean
  ctaText: string | null
  features: {
    id: string
    name: string
    key: string
    included: boolean
    limitValue: number | null
  }[]
}

interface AvailableUpgradePlan {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  trialDays: number
  isTrial: boolean
  isFeatured: boolean
  ctaText: string | null
  canUpgrade: boolean
  reason?: string
}

interface AvailablePlansData {
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

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useAppSession()

  const [step, setStep] = useState<Step>('plan')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [paymentMethod, setPaymentMethod] = useState<'VA' | 'QRIS'>('VA')
  const [selectedBank, setSelectedBank] = useState<string>('BCA')
  const [loading, setLoading] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  // Dynamic pricing data from API
  const [availablePlansData, setAvailablePlansData] = useState<AvailablePlansData | null>(null)
  const [plansLoading, setPlansLoading] = useState(true)
  const [selectedPlanSlug, setSelectedPlanSlug] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/checkout')
    }
  }, [status, router])

  // Fetch available upgrade options
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchAvailablePlans()
    }
  }, [status, session?.authenticated, session?.user])

  // Check if a specific plan was pre-selected from URL
  useEffect(() => {
    const planSlug = searchParams.get('plan')
    if (planSlug) {
      setSelectedPlanSlug(planSlug)
    }
  }, [searchParams])

  const fetchAvailablePlans = async () => {
    try {
      setPlansLoading(true)
      const res = await fetch('/api/subscription/available-plans')
      if (res.ok) {
        const data = await res.json()
        setAvailablePlansData(data)

        // Auto-select the first available upgrade plan if none selected
        const firstAvailablePlan = data.availableUpgrades.find((p: AvailableUpgradePlan) => p.canUpgrade)
        if (firstAvailablePlan && !selectedPlanSlug) {
          setSelectedPlanSlug(firstAvailablePlan.slug)
        }
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Gagal memuat paket yang tersedia')
      }
    } catch (err) {
      console.error('Error fetching available plans:', err)
      setError('Terjadi kesalahan saat memuat paket')
    } finally {
      setPlansLoading(false)
    }
  }

  const fetchPlanDetails = async (slug: string) => {
    try {
      const res = await fetch('/api/pricing')
      if (res.ok) {
        const data = await res.json()
        const plan = data.plans.find((p: PricingPlan) => p.slug === slug)
        return plan || null
      }
    } catch (err) {
      console.error('Error fetching plan details:', err)
    }
    return null
  }

  // Fetch plan details when selected plan changes
  useEffect(() => {
    if (selectedPlanSlug) {
      fetchPlanDetails(selectedPlanSlug).then(plan => {
        setSelectedPlan(plan)
      })
    }
  }, [selectedPlanSlug])

  const handleSelectPlan = (planSlug: string) => {
    setSelectedPlanSlug(planSlug)
  }

  const handleStartTrial = async () => {
    if (!selectedPlan) {
      setError('Silakan pilih paket terlebih dahulu')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/subscription/start-trial', {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memulai trial')
      }

      // Show success state
      setPaymentData({ trialActivated: true })
      setStep('success')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Gagal memulai trial')
    } finally {
      setLoading(false)
    }
  }

  const handleProceedToPayment = () => {
    if (!selectedPlan) {
      setError('Silakan pilih paket terlebih dahulu')
      return
    }

    // Check if selected plan is a trial - skip payment and start trial directly
    const selectedUpgrade = availablePlansData?.availableUpgrades.find(
      plan => plan.slug === selectedPlanSlug
    )

    if (selectedUpgrade?.isTrial) {
      handleStartTrial()
      return
    }

    setStep('payment')
  }

  const handleCreatePayment = async () => {
    if (!session || !selectedPlan) {
      setError('Data tidak lengkap')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          bankCode: selectedBank,
          pricingPlanId: selectedPlan.id,
          planSlug: selectedPlan.slug,
          billingCycle,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat transaksi')
      }

      setPaymentData(data.payment)

      if (paymentMethod === 'VA') {
        setStep('va')
      } else if (paymentMethod === 'QRIS') {
        setStep('qris')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Gagal membuat transaksi')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyVA = () => {
    if (paymentData?.vaNumber) {
      navigator.clipboard.writeText(paymentData.vaNumber.replace(/\s/g, ''))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getFeatureDisplayText = (featureItem: {
    name: string
    key: string
    included: boolean
    limitValue: number | null
  }) => {
    if (!featureItem.included) {
      return featureItem.name
    }
    if (featureItem.key === 'invoice_limit' && featureItem.limitValue) {
      return `${featureItem.limitValue} invoice per bulan`
    }
    return featureItem.name
  }

  if (status === 'loading' || plansLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-text-secondary">Memuat halaman checkout...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F0E6]"> {/* Warna pasir pantai */}
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-text-secondary hover:text-brand-500 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8 sm:mb-12">
          {step === 'success' ? (
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-success-400 text-white shadow-lg shadow-success-400/30">
                <Check className="w-5 h-5" />
              </div>
            </div>
          ) : (
            ['plan', 'payment', 'processing'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      step === s || (step === 'va' && s === 'payment') || (step === 'qris' && s === 'payment')
                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 scale-110'
                        : ['va', 'qris'].includes(step) && s === 'payment'
                        ? 'bg-success-400 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {['va', 'qris'].includes(step) && s === 'payment' ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className={`text-xs mt-2 font-medium hidden sm:block ${
                    step === s ? 'text-primary-500' : 'text-gray-400'
                  }`}>
                    {s === 'plan' ? 'Pilih Paket' : s === 'payment' ? 'Pembayaran' : 'Proses'}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`w-12 sm:w-20 h-1 mx-2 rounded-full transition-all duration-300 ${
                    step === 'payment' || step === 'va' || step === 'qris'
                      ? 'bg-success-400'
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))
          )}
        </div>

        {/* Step: Select Plan */}
        {step === 'plan' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-100 text-brand-600 text-sm font-semibold mb-4">
                <Sparkles className="w-4 h-4" />
                Upgrade Paket
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3">
                Pilih Paket Berlangganan
              </h1>
              <p className="text-text-secondary max-w-lg mx-auto">
                Tingkatkan kemampuan NotaBener Anda dengan paket yang sesuai kebutuhan bisnis
              </p>
            </div>

            {/* Current Plan Badge */}
            {availablePlansData && availablePlansData.currentPlan.slug !== 'plan-free' && (
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-50 border border-brand-200 text-brand-600 text-sm font-semibold">
                  <Crown className="w-4 h-4" />
                  Paket saat ini: {availablePlansData.currentPlan.name}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Available Plans */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {availablePlansData?.availableUpgrades
                .filter(plan => plan.canUpgrade)
                .map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan.slug)}
                    className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300 hover:shadow-lg ${
                      selectedPlanSlug === plan.slug
                        ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary-500/10'
                        : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'
                    } ${plan.isFeatured ? 'ring-2 ring-primary-200 ring-offset-2' : ''}`}
                  >
                    {plan.isFeatured && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="px-4 py-1.5 bg-gradient-to-r from-primary-500 to-highlight-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          POPULER
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-text-primary">{plan.name}</h3>
                        {plan.isTrial && (
                          <p className="text-sm text-primary-500 font-medium flex items-center gap-1 mt-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            Trial Gratis {plan.trialDays} Hari
                          </p>
                        )}
                      </div>
                      <div
                        className={`w-7 h-7 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300 ${
                          selectedPlanSlug === plan.slug
                            ? 'border-primary-500 bg-primary-500 shadow-lg shadow-primary-500/30'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedPlanSlug === plan.slug && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="text-3xl font-bold text-text-primary">
                        {formatCurrency(plan.price)}
                      </span>
                      {!plan.isTrial && (
                        <span className="text-text-secondary"> /bulan</span>
                      )}
                    </div>

                    {selectedPlanSlug === plan.slug && selectedPlan && (
                      <ul className="space-y-2.5 mb-4 pt-4 border-t border-gray-100">
                        {selectedPlan.features.slice(0, 5).map((featureItem) => (
                          <li key={featureItem.id} className="flex items-center gap-3 text-sm">
                            {featureItem.included ? (
                              <div className="w-5 h-5 rounded-full bg-success-400 flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            ) : (
                              <span className="w-5 h-5" />
                            )}
                            <span className={featureItem.included ? 'text-text-primary' : 'text-text-muted'}>
                              {getFeatureDisplayText(featureItem)}
                            </span>
                          </li>
                        ))}
                        {selectedPlan.features.length > 5 && (
                          <li className="text-sm text-text-muted pl-8">
                            +{selectedPlan.features.length - 5} fitur lainnya
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                ))}

              {/* No available plans message */}
              {availablePlansData && availablePlansData.availableUpgrades.filter(p => p.canUpgrade).length === 0 && (
                <div className="col-span-2 text-center py-12 bg-white rounded-2xl shadow-card">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-text-primary mb-2">
                    Tidak Ada Paket Tersedia
                  </h3>
                  <p className="text-text-secondary mb-6 max-w-md mx-auto">
                    Anda sudah berada di paket tertinggi atau tidak ada upgrade yang tersedia saat ini.
                  </p>
                  <Link
                    href="/dashboard/billing"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30"
                  >
                    Kembali ke Billing
                  </Link>
                </div>
              )}
            </div>

            {/* Continue Button */}
            {availablePlansData && availablePlansData.availableUpgrades.filter(p => p.canUpgrade).length > 0 && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={handleProceedToPayment}
                  disabled={!selectedPlan}
                  className="px-10 sm:px-14 py-4 bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold text-lg rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5 flex items-center gap-2"
                >
                  Lanjut ke Pembayaran
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step: Select Payment Method */}
        {step === 'payment' && (
          <div className="animate-fade-in max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-100 text-secondary-600 text-sm font-semibold mb-4">
                <Shield className="w-4 h-4" />
                Pembayaran Aman
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3">
                Pilih Metode Pembayaran
              </h1>
              <p className="text-text-secondary">
                Pilih metode pembayaran yang paling nyaman untuk Anda
              </p>
            </div>

            {/* Order Summary */}
            <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-6 mb-8 text-white shadow-lg shadow-brand-500/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/80 text-sm mb-1">Paket yang dipilih</p>
                  <p className="font-bold text-lg">
                    {selectedPlan?.name}
                    {billingCycle === 'yearly' && selectedPlan && !selectedPlan.slug.includes('trial') && ' - Tahunan'}
                    {selectedPlan?.slug.includes('trial') && ' - Trial Gratis'}
                  </p>
                  <p className="text-white/70 text-sm mt-1">NotaBener Subscription</p>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-sm mb-1">Total</p>
                  <p className="text-2xl font-bold">
                    {selectedPlan?.slug.includes('trial')
                      ? 'Gratis'
                      : formatCurrency(selectedPlan?.price || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Payment Methods */}
            <div className="space-y-4 mb-8">
              {/* Virtual Account */}
              <div
                onClick={() => setPaymentMethod('VA')}
                className={`bg-white rounded-2xl border-2 cursor-pointer transition-all duration-300 overflow-hidden ${
                  paymentMethod === 'VA'
                    ? 'border-primary-500 shadow-lg shadow-primary-500/10'
                    : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-text-primary text-lg">Transfer Bank (Virtual Account)</p>
                      <p className="text-sm text-text-secondary">BCA, BNI, BRI, Mandiri, Permata, CIMB Niaga</p>
                    </div>
                    <div
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                        paymentMethod === 'VA' ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                      }`}
                    >
                      {paymentMethod === 'VA' && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Bank Selection */}
                {paymentMethod === 'VA' && (
                  <div className="px-5 pb-5 pt-2 border-t border-gray-100 animate-fade-in">
                    <p className="text-sm font-semibold text-text-primary mb-4">Pilih Bank:</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {VA_BANKS.map((bank) => (
                        <button
                          key={bank.code}
                          onClick={() => setSelectedBank(bank.code)}
                          className={`
                            py-3 px-2 rounded-xl border-2 font-semibold text-sm transition-all duration-200
                            ${selectedBank === bank.code
                              ? 'border-primary-500 bg-primary-50 text-primary-600 shadow-sm'
                              : 'border-gray-200 bg-white text-text-primary hover:border-gray-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          {bank.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* QRIS */}
              <div
                onClick={() => setPaymentMethod('QRIS')}
                className={`bg-white rounded-2xl p-5 border-2 cursor-pointer transition-all duration-300 ${
                  paymentMethod === 'QRIS'
                    ? 'border-primary-500 shadow-lg shadow-primary-500/10'
                    : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <QrCode className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-text-primary text-lg">QRIS</p>
                    <p className="text-sm text-text-secondary">Scan dengan aplikasi e-wallet atau m-banking</p>
                  </div>
                  <div
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                      paymentMethod === 'QRIS' ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                    }`}
                  >
                    {paymentMethod === 'QRIS' && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-text-muted text-sm mb-8">
              <Shield className="w-4 h-4" />
              <span>Pembayaran aman dan terenkripsi</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setStep('plan')}
                className="flex-1 py-4 bg-white border-2 border-gray-200 text-text-primary font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                Kembali
              </button>
              <button
                onClick={handleCreatePayment}
                disabled={loading || !selectedPlan}
                className="flex-1 py-4 bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30 hover:shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memproses...
                  </>
                ) : selectedPlan?.slug.includes('trial') ? (
                  'Mulai Trial Gratis'
                ) : (
                  `Bayar ${formatCurrency(selectedPlan?.price || 0)}`
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step: VA Payment */}
        {step === 'va' && paymentData && (
          <div className="animate-fade-in max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-card-hover p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-text-primary mb-2">
                  Transfer ke Virtual Account
                </h1>
                <p className="text-text-secondary">
                  Selesaikan pembayaran dalam 24 jam
                </p>
              </div>

              {/* Payment Details */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-text-secondary mb-2">Bank {paymentData.bank}</p>
                  <div className="flex items-center justify-center gap-3">
                    <p className="text-2xl sm:text-3xl font-mono font-bold text-text-primary tracking-wider">
                      {paymentData.vaNumber}
                    </p>
                    <button
                      onClick={handleCopyVA}
                      className={`p-3 rounded-xl transition-all ${
                        copied
                          ? 'bg-success-400 text-white'
                          : 'bg-white border border-gray-200 hover:bg-gray-50 text-text-secondary hover:text-primary-500'
                      }`}
                    >
                      {copied ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {copied && (
                    <p className="text-sm text-success-600 mt-2 animate-fade-in">Nomor VA berhasil disalin!</p>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Jumlah</span>
                    <span className="font-bold text-lg text-text-primary">
                      {formatCurrency(paymentData.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Berlaku sampai</span>
                    <span className="font-semibold text-text-primary">
                      {formatDateTime(paymentData.expiredAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-highlight-100/50 border border-highlight-200 rounded-xl p-5 mb-6">
                <h3 className="font-bold text-highlight-700 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Cara Pembayaran:
                </h3>
                <ol className="text-sm text-highlight-600 space-y-2 list-decimal list-inside">
                  <li>Buka aplikasi mobile banking atau ATM {paymentData.bank}</li>
                  <li>Pilih menu Transfer ke Virtual Account</li>
                  <li>Masukkan nomor VA di atas</li>
                  <li>Konfirmasi dan selesaikan pembayaran</li>
                </ol>
              </div>

              <div className="flex items-center justify-center gap-2 text-text-secondary text-sm bg-gray-50 rounded-xl p-4">
                <Clock className="w-5 h-5 text-primary-500" />
                <span>
                  Pembayaran akan dikonfirmasi otomatis dalam beberapa menit
                </span>
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/dashboard/billing"
                  className="text-primary-500 font-semibold hover:text-primary-600 transition-colors"
                >
                  Kembali ke Billing
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Step: QRIS Payment */}
        {step === 'qris' && paymentData && (
          <div className="animate-fade-in max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-card-hover p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
                  <QrCode className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-text-primary mb-2">
                  Scan QRIS untuk Bayar
                </h1>
                <p className="text-text-secondary">
                  Scan dengan GoPay, OVO, DANA, ShopeePay, atau m-banking
                </p>
              </div>

              {/* QR Code */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6 text-center">
                {paymentData.qrImageUrl ? (
                  <img
                    src={paymentData.qrImageUrl}
                    alt="QRIS Code"
                    className="mx-auto w-56 h-56 sm:w-64 sm:h-64 rounded-xl bg-white p-4 shadow-card"
                  />
                ) : (
                  <div className="w-56 h-56 sm:w-64 sm:h-64 bg-white rounded-xl mx-auto flex items-center justify-center shadow-card">
                    <QrCode className="w-32 h-32 text-gray-300" />
                  </div>
                )}

                <div className="mt-5 pt-4 border-t border-gray-200">
                  <p className="font-bold text-xl text-text-primary">
                    {formatCurrency(paymentData.amount)}
                  </p>
                  <p className="text-sm text-text-secondary mt-1">
                    Berlaku hingga {formatDateTime(paymentData.expiredAt)}
                  </p>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-highlight-100/50 border border-highlight-200 rounded-xl p-5 mb-6">
                <h3 className="font-bold text-highlight-700 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Cara Pembayaran:
                </h3>
                <ol className="text-sm text-highlight-600 space-y-2 list-decimal list-inside">
                  <li>Buka aplikasi e-wallet atau m-banking</li>
                  <li>Pilih menu Scan QR atau QRIS</li>
                  <li>Scan QR code di atas</li>
                  <li>Konfirmasi dan selesaikan pembayaran</li>
                </ol>
              </div>

              <div className="flex items-center justify-center gap-2 text-text-secondary text-sm bg-gray-50 rounded-xl p-4">
                <Clock className="w-5 h-5 text-purple-500" />
                <span>
                  QRIS berlaku 15 menit
                </span>
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/dashboard/billing"
                  className="text-primary-500 font-semibold hover:text-primary-600 transition-colors"
                >
                  Kembali ke Billing
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Step: Trial Activation Success */}
        {step === 'success' && paymentData?.trialActivated && (
          <div className="animate-fade-in max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-card-hover p-6 sm:p-8 text-center">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-success-400 to-success-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-success-400/30">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-text-primary mb-3">
                Trial PRO Dimulai!
              </h1>
              <p className="text-text-secondary mb-8 text-lg">
                Selamat! Anda telah memulai masa trial PRO selama 7 hari. Nikmati semua fitur premium tanpa batas.
              </p>

              <div className="bg-gradient-to-br from-brand-50 to-secondary-50 rounded-xl p-6 mb-8 text-left">
                <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary-500" />
                  Fitur PRO Anda:
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-success-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-text-primary">Buat invoice tanpa batas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-success-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-text-primary">Template invoice kustom</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-success-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-text-primary">Custom branding & logo</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-success-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-text-primary">Kirim invoice via email</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-success-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-text-primary">Analitik & laporan lengkap</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <Link
                  href="/dashboard"
                  className="block w-full py-4 bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30 text-center"
                >
                  Mulai Gunakan NotaBener
                </Link>
                <Link
                  href="/dashboard/billing"
                  className="block text-primary-500 font-semibold hover:text-primary-600 text-center"
                >
                  Lihat Status Langganan
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
