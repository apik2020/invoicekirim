'use client'

import { useState, useEffect } from 'react'
import { Crown, X, Check, AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { AlertBox } from '@/components/Toast'

interface Subscription {
  id: string
  status: string
  planType: string
  stripeCurrentPeriodEnd: string | null
  stripeCustomerId: string | null
  isTrial?: boolean
  trialDaysLeft?: number
  trialEndsAt?: string | null
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
  const [startingTrial, setStartingTrial] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isPro = subscription?.planType === 'PRO'
  const isTrial = subscription?.isTrial || subscription?.status === 'TRIALING'
  const isActive = subscription?.status === 'ACTIVE' || isTrial
  const isCanceled = subscription?.status === 'CANCELED'
  const isFree = subscription?.status === 'FREE' && subscription?.planType === 'FREE'

  const handleStartTrial = async () => {
    if (!confirm('Mulai trial PRO 7 hari gratis? Setelah trial berakhir, Anda dapat memilih untuk upgrade ke PRO atau kembali ke FREE.')) {
      return
    }

    try {
      setStartingTrial(true)
      const res = await fetch('/api/subscription/start-trial', {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({
          type: 'success',
          text: 'Trial PRO 7 hari telah dimulai! Nikmati semua fitur premium.',
        })
        onSubscriptionChange?.()
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Gagal memulai trial',
        })
      }
    } catch (error) {
      console.error('Error starting trial:', error)
      setMessage({
        type: 'error',
        text: 'Terjadi kesalahan saat memulai trial',
      })
    } finally {
      setStartingTrial(false)
    }
  }

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

        {isTrial ? (
          <div className="space-y-3">
            <AlertBox type="warning" title="Trial PRO Aktif!">
              Nikmati semua fitur premium selama {subscription?.trialDaysLeft || 7} hari lagi.
            </AlertBox>
            <button
              onClick={handleUpgrade}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 transition-colors font-medium shadow-lg shadow-orange-200"
            >
              <Crown className="w-4 h-4" />
              Upgrade ke PRO Sekarang
            </button>
          </div>
        ) : isPro ? (
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
              <AlertBox type="warning" title="Langganan Akan Berakhir">
                <p>
                  Langganan Anda akan berakhir pada{' '}
                  <span className="font-semibold">
                    {subscription?.stripeCurrentPeriodEnd
                      ? formatDate(subscription.stripeCurrentPeriodEnd)
                      : 'akhir periode'}
                  </span>
                  . Setelah itu, akun Anda akan kembali ke plan FREE.
                </p>
              </AlertBox>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Start Free Trial Button */}
            <button
              onClick={handleStartTrial}
              disabled={startingTrial}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 transition-colors font-medium shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {startingTrial ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Mulai Trial PRO 7 Hari Gratis
            </button>
            <p className="text-center text-sm text-gray-500">
              Tidak perlu kartu kredit
            </p>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">atau</span>
              </div>
            </div>
            <button
              onClick={handleUpgrade}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors font-medium"
            >
              <Crown className="w-4 h-4" />
              Upgrade Langsung ke PRO
            </button>
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <AlertBox
          type={message.type === 'success' ? 'success' : 'error'}
          title={message.type === 'success' ? 'Berhasil' : 'Gagal'}
          onDismiss={() => setMessage(null)}
        >
          {message.text}
        </AlertBox>
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
