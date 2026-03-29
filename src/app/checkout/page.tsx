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
} from 'lucide-react'
import { Logo } from '@/components/Logo'

const VA_BANKS = [
  { code: 'bca', name: 'BCA', description: 'Virtual Account BCA' },
  { code: 'bni', name: 'BNI', description: 'Virtual Account BNI' },
  { code: 'bri', name: 'BRI', description: 'Virtual Account BRI' },
  { code: 'mandiri', name: 'Mandiri', description: 'Virtual Account Mandiri' },
  { code: 'permata', name: 'Permata', description: 'Virtual Account Permata' },
  { code: 'cimb', name: 'CIMB Niaga', description: 'Virtual Account CIMB Niaga' },
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
  const [paymentMethod, setPaymentMethod] = useState<'VA' | 'QRIS' | 'SNAP'>('VA')
  const [selectedBank, setSelectedBank] = useState<string>('bca')
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
      } else {
        // SNAP - redirect to Midtrans
        window.location.href = data.payment.snapUrl
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
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-fresh-bg">
      {/* Header */}
      <header className="bg-white border-b border-orange-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-orange-600"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {step === 'success' ? (
            // Trial flow: plan → success
            <>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-green-500 text-white">
                  <Check className="w-4 h-4" />
                </div>
              </div>
            </>
          ) : (
            // Payment flow: plan → payment → processing
            ['plan', 'payment', 'processing'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step === s || (step === 'va' && s === 'payment') || (step === 'qris' && s === 'payment')
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {i + 1}
                </div>
                {i < 2 && <div className="w-16 h-1 bg-gray-200 mx-2" />}
              </div>
            ))
          )}
        </div>

        {/* Step: Select Plan */}
        {step === 'plan' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Pilih Paket Berlangganan
            </h1>

            {/* Current Plan Badge */}
            {availablePlansData && availablePlansData.currentPlan.slug !== 'plan-free' && (
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                  Paket saat ini: {availablePlansData.currentPlan.name}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
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
                    className={`cursor-pointer rounded-2xl p-6 border-2 transition-all ${
                      selectedPlanSlug === plan.slug
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    } ${plan.isFeatured ? 'ring-2 ring-orange-200' : ''}`}
                  >
                    {plan.isFeatured && (
                      <div className="absolute -top-3 left-6">
                        <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                          POPULER
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                        {plan.isTrial && (
                          <p className="text-sm text-orange-600">Trial Gratis {plan.trialDays} Hari</p>
                        )}
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex-shrink-0 ${
                          selectedPlanSlug === plan.slug
                            ? 'border-orange-500 bg-orange-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedPlanSlug === plan.slug && (
                          <Check className="w-4 h-4 text-white m-auto" />
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        {formatCurrency(plan.price)}
                      </span>
                      {!plan.isTrial && (
                        <span className="text-gray-600"> /bulan</span>
                      )}
                    </div>

                    {selectedPlanSlug === plan.slug && selectedPlan && (
                      <ul className="space-y-2 mb-4">
                        {selectedPlan.features.slice(0, 5).map((featureItem) => (
                          <li key={featureItem.id} className="flex items-center gap-2 text-sm">
                            {featureItem.included ? (
                              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <span className="w-4 h-4" />
                            )}
                            <span className={featureItem.included ? 'text-gray-700' : 'text-gray-400'}>
                              {getFeatureDisplayText(featureItem)}
                            </span>
                          </li>
                        ))}
                        {selectedPlan.features.length > 5 && (
                          <li className="text-sm text-gray-500">
                            +{selectedPlan.features.length - 5} fitur lainnya
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                ))}

              {/* No available plans message */}
              {availablePlansData && availablePlansData.availableUpgrades.filter(p => p.canUpgrade).length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Tidak Ada Paket Tersedia
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Anda sudah berada di paket tertinggi atau tidak ada upgrade yang tersedia saat ini.
                  </p>
                  <Link
                    href="/dashboard/billing"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all"
                  >
                    Kembali ke Billing
                  </Link>
                </div>
              )}
            </div>

            {/* Continue Button */}
            {availablePlansData && availablePlansData.availableUpgrades.filter(p => p.canUpgrade).length > 0 && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleProceedToPayment}
                  disabled={!selectedPlan}
                  className="px-12 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Lanjut ke Pembayaran
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step: Select Payment Method */}
        {step === 'payment' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Pilih Metode Pembayaran
            </h1>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-900">
                    {selectedPlan?.name}
                    {billingCycle === 'yearly' && selectedPlan && !selectedPlan.slug.includes('trial') && ' - Tahunan'}
                    {selectedPlan?.slug.includes('trial') && ' - Trial Gratis'}
                  </p>
                  <p className="text-sm text-gray-600">InvoiceKirim Subscription</p>
                </div>
                <p className="text-xl font-bold text-orange-600">
                  {selectedPlan?.slug.includes('trial')
                    ? 'Gratis'
                    : formatCurrency(selectedPlan?.price || 0)}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Payment Methods */}
            <div className="space-y-4 mb-8">
              {/* Virtual Account */}
              <div
                onClick={() => setPaymentMethod('VA')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'VA'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">Transfer Bank (Virtual Account)</p>
                    <p className="text-sm text-gray-600">BCA, BNI, BRI, Mandiri, dll</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 ${
                      paymentMethod === 'VA' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                    }`}
                  >
                    {paymentMethod === 'VA' && (
                      <Check className="w-4 h-4 text-white m-auto" />
                    )}
                  </div>
                </div>

                {/* Bank Selection */}
                {paymentMethod === 'VA' && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {VA_BANKS.map((bank) => (
                      <button
                        key={bank.code}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedBank(bank.code)
                        }}
                        className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                          selectedBank === bank.code
                            ? 'border-orange-500 bg-orange-100 text-orange-700'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        {bank.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* QRIS */}
              <div
                onClick={() => setPaymentMethod('QRIS')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'QRIS'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">QRIS</p>
                    <p className="text-sm text-gray-600">Scan dengan aplikasi e-wallet atau m-banking</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 ${
                      paymentMethod === 'QRIS' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                    }`}
                  >
                    {paymentMethod === 'QRIS' && (
                      <Check className="w-4 h-4 text-white m-auto" />
                    )}
                  </div>
                </div>
              </div>

              {/* Other Payment Methods (Snap) */}
              <div
                onClick={() => setPaymentMethod('SNAP')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'SNAP'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">Metode Lainnya</p>
                    <p className="text-sm text-gray-600">Kartu kredit, e-wallet, paylater</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 ${
                      paymentMethod === 'SNAP' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                    }`}
                  >
                    {paymentMethod === 'SNAP' && (
                      <Check className="w-4 h-4 text-white m-auto" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setStep('plan')}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
              >
                Kembali
              </button>
              <button
                onClick={handleCreatePayment}
                disabled={loading || !selectedPlan}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
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
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Transfer ke Virtual Account
              </h1>
              <p className="text-gray-600">
                Selesaikan pembayaran dalam 24 jam
              </p>
            </div>

            {/* Payment Details */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 mb-1">Bank {paymentData.bank}</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-mono font-bold text-gray-900">
                    {paymentData.vaNumber}
                  </p>
                  <button
                    onClick={handleCopyVA}
                    className="p-2 rounded-lg bg-white border hover:bg-gray-100 transition-all"
                  >
                    {copied ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Jumlah</span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(paymentData.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Berlaku sampai</span>
                  <span className="font-bold text-gray-900">
                    {formatDateTime(paymentData.expiredAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-yellow-800 mb-2">Cara Pembayaran:</h3>
              <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                <li>Buka aplikasi mobile banking atau ATM {paymentData.bank}</li>
                <li>Pilih menu Transfer ke Virtual Account</li>
                <li>Masukkan nomor VA di atas</li>
                <li>Konfirmasi dan selesaikan pembayaran</li>
              </ol>
            </div>

            <div className="text-center">
              <Clock className="w-5 h-5 text-gray-400 inline mr-2" />
              <span className="text-sm text-gray-600">
                Pembayaran akan dikonfirmasi otomatis dalam beberapa menit
              </span>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/dashboard/billing"
                className="text-orange-600 font-medium hover:text-orange-700"
              >
                Kembali ke Billing
              </Link>
            </div>
          </div>
        )}

        {/* Step: QRIS Payment */}
        {step === 'qris' && paymentData && (
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-purple-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Scan QRIS untuk Bayar
              </h1>
              <p className="text-gray-600">
                Scan dengan GoPay, OVO, DANA, ShopeePay, atau m-banking
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6 text-center">
              {paymentData.qrImageUrl ? (
                <img
                  src={paymentData.qrImageUrl}
                  alt="QRIS Code"
                  className="mx-auto w-64 h-64"
                />
              ) : (
                <div className="w-64 h-64 bg-white rounded-xl mx-auto flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-gray-300" />
                </div>
              )}

              <div className="mt-4">
                <p className="font-bold text-gray-900">
                  {formatCurrency(paymentData.amount)}
                </p>
                <p className="text-sm text-gray-600">
                  Berlaku hingga {formatDateTime(paymentData.expiredAt)}
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-yellow-800 mb-2">Cara Pembayaran:</h3>
              <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                <li>Buka aplikasi e-wallet atau m-banking</li>
                <li>Pilih menu Scan QR atau QRIS</li>
                <li>Scan QR code di atas</li>
                <li>Konfirmasi dan selesaikan pembayaran</li>
              </ol>
            </div>

            <div className="text-center">
              <Clock className="w-5 h-5 text-gray-400 inline mr-2" />
              <span className="text-sm text-gray-600">
                QRIS berlaku 15 menit
              </span>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/dashboard/billing"
                className="text-orange-600 font-medium hover:text-orange-700"
              >
                Kembali ke Billing
              </Link>
            </div>
          </div>
        )}

        {/* Step: Trial Activation Success */}
        {step === 'success' && paymentData?.trialActivated && (
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Trial PRO Dimulai!
            </h1>
            <p className="text-gray-600 mb-8">
              Selamat! Anda telah memulai masa trial PRO selama 7 hari. Nikmati semua fitur premium tanpa batas.
            </p>

            <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-6 mb-8">
              <h3 className="font-bold text-gray-900 mb-4">Fitur PRO Anda:</h3>
              <ul className="text-left space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Buat invoice tanpa batas</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Template invoice kustom</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Custom branding & logo</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Kirim invoice via email</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Analitik & laporan lengkap</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="block w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all text-center"
              >
                Mulai Gunakan InvoiceKirim
              </Link>
              <Link
                href="/dashboard/billing"
                className="block text-orange-600 font-medium hover:text-orange-700 text-center"
              >
                Lihat Status Langganan
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
