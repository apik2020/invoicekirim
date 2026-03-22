'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSession } from '@/hooks/useAppSession'
import { CreditCard, FileText, Crown, Clock, AlertTriangle, Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { SubscriptionManager } from '@/components/billing/SubscriptionManager'
import { PaymentHistory } from '@/components/billing/PaymentHistory'

interface Subscription {
  id: string
  status: string
  planType: string
  stripeCurrentPeriodEnd: string | null
  stripeCustomerId: string | null
  trialEndsAt?: string | null
  isTrial?: boolean
  trialDaysLeft?: number
}

export default function BillingPage() {
  const router = useRouter()
  const { data: session, status } = useAppSession()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'subscription' | 'payments'>('subscription')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSubscription()
    }
  }, [status])

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/subscription')
      const data = await res.json()

      if (res.ok) {
        setSubscription(data)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    return null
  }

  const isTrial = subscription?.isTrial || subscription?.status === 'TRIALING'
  const trialDaysLeft = subscription?.trialDaysLeft || 0

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-500 mb-2">Billing & Pembayaran</h1>
        <p className="text-text-secondary">Kelola langganan dan lihat riwayat pembayaran</p>
      </div>

      {/* Trial Banner */}
      {isTrial && (
        <div className={`mb-8 p-4 rounded-2xl flex items-center gap-4 ${
          trialDaysLeft <= 1
            ? 'bg-primary-50 border border-primary-200'
            : trialDaysLeft <= 3
              ? 'bg-highlight-100 border border-highlight-200'
              : 'bg-brand-50 border border-brand-200'
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            trialDaysLeft <= 1
              ? 'bg-primary-100'
              : trialDaysLeft <= 3
                ? 'bg-highlight-200'
                : 'bg-brand-100'
          }`}>
            {trialDaysLeft <= 1 ? (
              <AlertTriangle className="w-6 h-6 text-primary-500" />
            ) : (
              <Clock className="w-6 h-6 text-brand-500" />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`font-bold ${
              trialDaysLeft <= 1 ? 'text-primary-700' : 'text-brand-600'
            }`}>
              {trialDaysLeft <= 1
                ? 'Trial Anda akan berakhir hari ini!'
                : `Trial PRO: ${trialDaysLeft} hari tersisa`}
            </h3>
            <p className={`text-sm ${
              trialDaysLeft <= 1 ? 'text-primary-600' : 'text-text-secondary'
            }`}>
              {trialDaysLeft <= 1
                ? 'Upgrade sekarang untuk tetap menikmati fitur PRO'
                : 'Nikmati semua fitur PRO selama masa trial'}
            </p>
          </div>
          <a
            href="/checkout"
            className="btn-primary px-4 py-2 font-bold"
          >
            Upgrade PRO
          </a>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Plan Card */}
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              isTrial
                ? 'bg-gradient-to-br from-primary-500 to-highlight-500 shadow-primary'
                : 'bg-brand-100'
            }`}>
              <Crown className={`w-7 h-7 ${isTrial ? 'text-white' : 'text-brand-500'}`} />
            </div>
            <div>
              <p className="text-sm text-text-muted">Plan Saat Ini</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-brand-500">
                  {subscription?.planType === 'PRO' ? 'PRO' : 'FREE'}
                </p>
                {isTrial && (
                  <span className="badge bg-primary-100 text-primary-700">
                    TRIAL
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              isTrial ? 'bg-highlight-100' : 'bg-success-100'
            }`}>
              <FileText className={`w-7 h-7 ${isTrial ? 'text-highlight-600' : 'text-success-600'}`} />
            </div>
            <div>
              <p className="text-sm text-text-muted">Status</p>
              <p className="text-xl font-bold text-brand-500">
                {isTrial && 'Trial'}
                {subscription?.status === 'ACTIVE' && 'Aktif'}
                {subscription?.status === 'CANCELED' && 'Akan Berakhir'}
                {!isTrial && subscription?.status === 'FREE' && 'Gratis'}
              </p>
            </div>
          </div>
        </div>

        {/* Renewal Card */}
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary-100 flex items-center justify-center">
              <CreditCard className="w-7 h-7 text-secondary-600" />
            </div>
            <div>
              <p className="text-sm text-text-muted">
                {isTrial ? 'Trial Berakhir' : 'Perpanjangan'}
              </p>
              <p className="text-lg font-bold text-brand-500">
                {isTrial && subscription?.trialEndsAt
                  ? new Date(subscription.trialEndsAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : subscription?.stripeCurrentPeriodEnd
                    ? new Date(subscription.stripeCurrentPeriodEnd).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'subscription'
                ? 'btn-primary'
                : 'btn-secondary'
            }`}
          >
            Langganan
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'payments'
                ? 'btn-primary'
                : 'btn-secondary'
            }`}
          >
            Riwayat Pembayaran
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'subscription' && (
        <div className="max-w-2xl">
          <SubscriptionManager
            subscription={subscription}
            onSubscriptionChange={fetchSubscription}
          />
        </div>
      )}

      {activeTab === 'payments' && (
        <PaymentHistory userId={session?.user?.id} />
      )}
    </DashboardLayout>
  )
}
