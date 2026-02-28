'use client'

import { useState, useEffect } from 'react'
import { Crown, X, Check, AlertCircle, Loader2 } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Subscription {
  id: string
  status: string
  planType: string
  stripeCurrentPeriodEnd: string | null
  stripeCustomerId: string | null
}

interface SubscriptionManagerProps {
  subscription: Subscription | null
  onSubscriptionChange?: () => void
}

export function SubscriptionManager({
  subscription,
  onSubscriptionChange,
}: SubscriptionManagerProps) {
  const [loading, setLoading] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [downgrading, setDowngrading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isPro = subscription?.planType === 'PRO'
  const isActive = subscription?.status === 'ACTIVE'
  const isCanceled = subscription?.status === 'CANCELED'

  const handleCancelSubscription = async () => {
    if (!confirm('Apakah Anda yakin ingin membatalkan langganan? Akses PRO akan tetap aktif hingga akhir periode berlangganan.')) {
      return
    }

    try {
      setCanceling(true)
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Langganan akan dibatalkan pada ${formatDate(data.cancelAt)}`,
        })
        onSubscriptionChange?.()
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Gagal membatalkan langganan',
        })
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      setMessage({
        type: 'error',
        text: 'Terjadi kesalahan saat membatalkan langganan',
      })
    } finally {
      setCanceling(false)
    }
  }

  const handleDowngrade = async () => {
    if (!confirm('Apakah Anda yakin ingin downgrade ke FREE? Akses PRO akan tetap aktif hingga akhir periode berlangganan.')) {
      return
    }

    try {
      setDowngrading(true)
      const res = await fetch('/api/subscription/downgrade', {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({
          type: 'success',
          text: 'Langganan akan downgrade ke FREE pada akhir periode',
        })
        onSubscriptionChange?.()
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Gagal downgrade langganan',
        })
      }
    } catch (error) {
      console.error('Error downgrading subscription:', error)
      setMessage({
        type: 'error',
        text: 'Terjadi kesalahan saat downgrade langganan',
      })
    } finally {
      setDowngrading(false)
    }
  }

  const handleUpgrade = async () => {
    // Redirect to pricing page
    window.location.href = '/pricing#pro'
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className={`card p-6 ${isPro ? 'border-lime-200 bg-gradient-to-r from-lime-50 to-green-50' : 'border-orange-200'}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isPro ? 'bg-lime-500' : 'bg-orange-500'}`}>
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isPro ? 'Plan PRO' : 'Plan FREE'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isPro
                  ? 'Nikmati semua fitur premium tanpa batas'
                  : 'Upgrade ke PRO untuk akses fitur lengkap'}
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
            isPro ? 'bg-lime-100 text-lime-700' : 'bg-orange-100 text-orange-700'
          }`}>
            {subscription?.status === 'ACTIVE' && 'Aktif'}
            {subscription?.status === 'CANCELED' && 'Akan Berakhir'}
            {subscription?.status === 'FREE' && 'Gratis'}
          </div>
        </div>

        {isPro && subscription?.stripeCurrentPeriodEnd && (
          <div className="mt-4 pt-4 border-t border-lime-200">
            <p className="text-sm text-gray-600">
              {isCanceled ? 'Langganan berakhir pada' : 'Perpanjangan otomatis pada'}{' '}
              <span className="font-semibold text-gray-900">
                {formatDate(subscription.stripeCurrentPeriodEnd)}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Plan Comparison */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Fitur Langganan</h3>
        <div className="space-y-3">
          <FeatureRow
            feature="Invoice tak terbatas"
            available={isPro}
          />
          <FeatureRow
            feature="Template invoice custom"
            available={isPro}
          />
          <FeatureRow
            feature="Branding perusahaan"
            available={isPro}
          />
          <FeatureRow
            feature="Analytics & laporan"
            available={isPro}
          />
          <FeatureRow
            feature="Export PDF tanpa watermark"
            available={isPro}
          />
          <FeatureRow
            feature="Support prioritas"
            available={isPro}
          />
          <FeatureRow
            feature="Maksimal 10 invoice/bulan"
            available={!isPro}
            limited={!isPro}
          />
          <FeatureRow
            feature="Template dasar"
            available={!isPro}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Kelola Langganan</h3>

        {isPro ? (
          <div className="space-y-3">
            {isActive && !isCanceled && (
              <>
                <button
                  onClick={handleCancelSubscription}
                  disabled={canceling}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {canceling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  Batalkan Langganan
                </button>
                <button
                  onClick={handleDowngrade}
                  disabled={downgrading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downgrading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  Downgrade ke FREE
                </button>
              </>
            )}
            {isCanceled && (
              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  Langganan Anda akan berakhir pada{' '}
                  <span className="font-semibold">
                    {subscription?.stripeCurrentPeriodEnd
                      ? formatDate(subscription.stripeCurrentPeriodEnd)
                      : 'akhir periode'}
                  </span>
                  . Setelah itu, akun Anda akan kembali ke plan FREE.
                </p>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleUpgrade}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 transition-colors font-medium shadow-lg shadow-orange-200"
          >
            <Crown className="w-4 h-4" />
            Upgrade ke PRO
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-xl border ${
            message.type === 'success'
              ? 'bg-lime-50 border-lime-200 text-lime-800'
              : 'bg-pink-50 border-pink-200 text-pink-800'
          }`}
        >
          <p className="text-sm">{message.text}</p>
          <button
            onClick={() => setMessage(null)}
            className="mt-2 text-sm underline"
          >
            Tutup
          </button>
        </div>
      )}
    </div>
  )
}

interface FeatureRowProps {
  feature: string
  available: boolean
  limited?: boolean
}

function FeatureRow({ feature, available, limited }: FeatureRowProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
        available
          ? 'bg-lime-100'
          : limited
          ? 'bg-yellow-100'
          : 'bg-gray-100'
      }`}>
        {available ? (
          <Check className="w-3 h-3 text-lime-600" />
        ) : (
          <X className="w-3 h-3 text-gray-400" />
        )}
      </div>
      <span className={`text-sm ${available ? 'text-gray-900' : 'text-gray-500'}`}>
        {feature}
      </span>
    </div>
  )
}
