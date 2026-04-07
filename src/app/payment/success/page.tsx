'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle,
  XCircle,
  Loader2,
  Crown,
  ArrowRight,
  Receipt,
  Calendar,
  CreditCard,
} from 'lucide-react'
import { Logo } from '@/components/Logo'

interface PaymentStatus {
  status: 'LOADING' | 'SUCCESS' | 'PENDING' | 'FAILED'
  planName?: string
  amount?: number
  orderId?: string
  paymentMethod?: string
  activatedAt?: string
  expiresAt?: string
}

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'LOADING' })

  // Duitku redirect params:
  // - merchantOrderId: our order ID
  // - resultCode: 00=Success, 01=Pending, 02=Canceled
  // - reference: Duitku reference
  const merchantOrderId = searchParams.get('merchantOrderId')
  const resultCode = searchParams.get('resultCode')
  const reference = searchParams.get('reference')

  useEffect(() => {
    // Use merchantOrderId (from Duitku redirect) or reference as fallback
    const orderId = merchantOrderId || reference
    if (orderId) {
      verifyPayment(orderId, resultCode)
    } else {
      setPaymentStatus({ status: 'FAILED' })
    }
  }, [merchantOrderId, reference, resultCode])

  const verifyPayment = async (ref: string, resultCd?: string | null) => {
    // If Duitku already told us it was canceled (resultCode=02), skip API check
    if (resultCd === '02') {
      setPaymentStatus({ status: 'FAILED' })
      return
    }
    try {
      // Check payment status via API
      const res = await fetch(`/api/payments/verify?reference=${ref}`)
      const data = await res.json()

      if (res.ok && data.success) {
        setPaymentStatus({
          status: 'SUCCESS',
          planName: data.payment?.planName || 'PRO',
          amount: data.payment?.amount,
          orderId: data.payment?.orderId,
          paymentMethod: data.payment?.paymentMethod,
          activatedAt: data.payment?.activatedAt,
          expiresAt: data.payment?.expiresAt,
        })
      } else if (data.status === 'PENDING') {
        setPaymentStatus({
          status: 'PENDING',
          planName: data.payment?.planName,
        })
      } else {
        setPaymentStatus({ status: 'FAILED' })
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
      setPaymentStatus({ status: 'FAILED' })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-secondary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <Logo />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Loading State */}
        {paymentStatus.status === 'LOADING' && (
          <div className="text-center animate-fade-in">
            <div className="w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-12 h-12 text-brand-500 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-3">
              Memverifikasi Pembayaran...
            </h1>
            <p className="text-text-secondary">
              Mohon tunggu sebentar, kami sedang memverifikasi pembayaran Anda.
            </p>
          </div>
        )}

        {/* Success State */}
        {paymentStatus.status === 'SUCCESS' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-success-400 to-success-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-success-400/30">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-text-primary mb-3">
                Pembayaran Berhasil!
              </h1>
              <p className="text-text-secondary text-lg">
                Selamat! Langganan {paymentStatus.planName} Anda telah aktif.
              </p>
            </div>

            {/* Payment Details Card */}
            <div className="bg-white rounded-2xl shadow-card-hover p-6 mb-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-text-primary text-lg">
                    NotaBener {paymentStatus.planName}
                  </h2>
                  <p className="text-text-secondary text-sm">Langganan Aktif</p>
                </div>
              </div>

              <div className="space-y-4">
                {paymentStatus.amount && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-50">
                    <div className="flex items-center gap-3 text-text-secondary">
                      <CreditCard className="w-5 h-5" />
                      <span>Total Pembayaran</span>
                    </div>
                    <span className="font-bold text-text-primary">
                      {formatCurrency(paymentStatus.amount)}
                    </span>
                  </div>
                )}

                {paymentStatus.orderId && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-50">
                    <div className="flex items-center gap-3 text-text-secondary">
                      <Receipt className="w-5 h-5" />
                      <span>ID Transaksi</span>
                    </div>
                    <span className="font-mono text-sm text-text-primary">
                      {paymentStatus.orderId}
                    </span>
                  </div>
                )}

                {paymentStatus.activatedAt && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-50">
                    <div className="flex items-center gap-3 text-text-secondary">
                      <Calendar className="w-5 h-5" />
                      <span>Aktif Sejak</span>
                    </div>
                    <span className="text-text-primary">
                      {formatDate(paymentStatus.activatedAt)}
                    </span>
                  </div>
                )}

                {paymentStatus.expiresAt && (
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 text-text-secondary">
                      <Calendar className="w-5 h-5" />
                      <span>Berlaku Hingga</span>
                    </div>
                    <span className="text-text-primary">
                      {formatDate(paymentStatus.expiresAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* What's Next */}
            <div className="bg-gradient-to-br from-brand-50 to-secondary-50 rounded-2xl p-6 mb-8">
              <h3 className="font-bold text-text-primary mb-4">
                Apa yang bisa Anda lakukan sekarang?
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-success-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-text-primary">Buat invoice tanpa batas</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-success-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-text-primary">Kirim invoice via email</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-success-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-text-primary">Custom branding & logo</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-success-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-text-primary">Akses semua fitur premium</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-br from-brand-500 to-brand-600 text-white font-bold rounded-xl hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-500/30"
              >
                Mulai Gunakan NotaBener
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/dashboard/billing"
                className="block text-center text-brand-500 font-semibold hover:text-brand-600 transition-colors py-2"
              >
                Lihat Detail Billing
              </Link>
            </div>
          </div>
        )}

        {/* Pending State */}
        {paymentStatus.status === 'PENDING' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-400/30">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              </div>
              <h1 className="text-3xl font-bold text-text-primary mb-3">
                Pembayaran Sedang Diproses
              </h1>
              <p className="text-text-secondary text-lg">
                Pembayaran Anda sedang diverifikasi. Ini biasanya membutuhkan waktu beberapa menit.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-card p-6 mb-8 text-center">
              <p className="text-text-secondary">
                Jika Anda sudah menyelesaikan pembayaran, mohon tunggu beberapa saat.
                Status langganan akan diperbarui secara otomatis.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => (merchantOrderId || reference) && verifyPayment(merchantOrderId || reference || '')}
                className="flex items-center justify-center gap-2 w-full py-4 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors"
              >
                <Loader2 className="w-5 h-5" />
                Cek Status Lagi
              </button>
              <Link
                href="/dashboard/billing"
                className="block text-center text-brand-500 font-semibold hover:text-brand-600 transition-colors py-2"
              >
                Kembali ke Billing
              </Link>
            </div>
          </div>
        )}

        {/* Failed State */}
        {paymentStatus.status === 'FAILED' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-400/30">
                <XCircle className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-text-primary mb-3">
                Verifikasi Gagal
              </h1>
              <p className="text-text-secondary text-lg">
                Terjadi kesalahan saat memverifikasi pembayaran Anda.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-card p-6 mb-8 text-center">
              <p className="text-text-secondary mb-4">
                Jika Anda yakin sudah melakukan pembayaran, silakan hubungi customer support kami.
              </p>
              {(merchantOrderId || reference) && (
                <p className="text-sm text-text-muted">
                  Reference: <span className="font-mono">{merchantOrderId || reference}</span>
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Link
                href="/checkout"
                className="flex items-center justify-center gap-2 w-full py-4 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors"
              >
                Coba Lagi
              </Link>
              <Link
                href="/dashboard/billing"
                className="block text-center text-brand-500 font-semibold hover:text-brand-600 transition-colors py-2"
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
