'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
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
} from 'lucide-react'
import { Logo } from '@/components/Logo'

const PRICING = {
  monthly: { amount: 49000, label: 'Rp 49.000/bulan' },
  yearly: { amount: 490000, label: 'Rp 490.000/tahun' },
}

const VA_BANKS = [
  { code: 'bca', name: 'BCA', description: 'Virtual Account BCA' },
  { code: 'bni', name: 'BNI', description: 'Virtual Account BNI' },
  { code: 'bri', name: 'BRI', description: 'Virtual Account BRI' },
  { code: 'mandiri', name: 'Mandiri', description: 'Virtual Account Mandiri' },
  { code: 'permata', name: 'Permata', description: 'Virtual Account Permata' },
  { code: 'cimb', name: 'CIMB Niaga', description: 'Virtual Account CIMB Niaga' },
]

type Step = 'plan' | 'payment' | 'va' | 'qris' | 'processing' | 'success'

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  const [step, setStep] = useState<Step>('plan')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [paymentMethod, setPaymentMethod] = useState<'VA' | 'QRIS' | 'SNAP'>('VA')
  const [selectedBank, setSelectedBank] = useState<string>('bca')
  const [loading, setLoading] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/checkout')
    }
  }, [status, router])

  const handleProceedToPayment = () => {
    setStep('payment')
  }

  const handleCreatePayment = async () => {
    if (!session) return

    setLoading(true)

    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          bankCode: selectedBank,
          planType: 'PRO',
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
      alert(error instanceof Error ? error.message : 'Gagal membuat transaksi')
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

  if (status === 'loading') {
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
            <Link
              href="/pricing"
              className="flex items-center gap-2 text-gray-600 hover:text-orange-600"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {['plan', 'payment', 'processing'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === s || (step === 'va' && s === 'payment') || (step === 'qris' && s === 'payment') || (step === 'success' && s === 'processing')
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {i + 1}
              </div>
              {i < 2 && <div className="w-16 h-1 bg-gray-200 mx-2" />}
            </div>
          ))}
        </div>

        {/* Step: Select Plan */}
        {step === 'plan' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Pilih Paket Berlangganan
            </h1>

            {/* Billing Cycle Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 rounded-xl p-1 flex">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-orange-600 shadow'
                      : 'text-gray-600'
                  }`}
                >
                  Bulanan
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    billingCycle === 'yearly'
                      ? 'bg-white text-orange-600 shadow'
                      : 'text-gray-600'
                  }`}
                >
                  Tahunan
                  <span className="ml-2 text-xs bg-lime-100 text-lime-700 px-2 py-0.5 rounded-full">
                    Hemat 17%
                  </span>
                </button>
              </div>
            </div>

            {/* Plan Card */}
            <div className="max-w-md mx-auto bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-6 border-2 border-orange-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Pro Plan</h3>
                  <p className="text-gray-600">Akses penuh semua fitur</p>
                </div>
                <span className="bg-pink-100 text-pink-700 text-xs font-bold px-3 py-1 rounded-full">
                  POPULER
                </span>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">
                  {PRICING[billingCycle].label}
                </span>
              </div>

              <ul className="space-y-3 mb-6">
                {[
                  'Invoice tanpa batas',
                  'Template premium',
                  'Custom branding',
                  'Email otomatis ke klien',
                  'Payment reminder otomatis',
                  'Priority support',
                  'Analytics dashboard',
                  'Ekspor Excel/CSV',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-lime-500" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={handleProceedToPayment}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all"
              >
                Lanjut ke Pembayaran
              </button>
            </div>
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
                  <p className="font-bold text-gray-900">Pro Plan - {billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan'}</p>
                  <p className="text-sm text-gray-600">InvoiceKirim Subscription</p>
                </div>
                <p className="text-xl font-bold text-orange-600">
                  {formatCurrency(PRICING[billingCycle].amount)}
                </p>
              </div>
            </div>

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
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  `Bayar ${formatCurrency(PRICING[billingCycle].amount)}`
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
      </main>
    </div>
  )
}
