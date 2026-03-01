'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CreditCard, FileText, Crown, Clock, AlertTriangle } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
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
  const { data: session, status } = useSession()
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
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const isTrial = subscription?.isTrial || subscription?.status === 'TRIALING'
  const trialDaysLeft = subscription?.trialDaysLeft || 0

  return (
    <div className="min-h-screen bg-fresh-bg">
      <DashboardHeader title="Billing" showBackButton={true} backHref="/dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Pembayaran</h1>
          <p className="text-gray-600">Kelola langganan dan lihat riwayat pembayaran</p>
        </div>

        {/* Trial Banner */}
        {isTrial && (
          <div className={`mb-8 p-4 rounded-xl flex items-center gap-4 ${
            trialDaysLeft <= 1
              ? 'bg-red-50 border border-red-200'
              : trialDaysLeft <= 3
                ? 'bg-yellow-50 border border-yellow-200'
                : 'bg-orange-50 border border-orange-200'
          }`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              trialDaysLeft <= 1
                ? 'bg-red-100'
                : trialDaysLeft <= 3
                  ? 'bg-yellow-100'
                  : 'bg-orange-100'
            }`}>
              {trialDaysLeft <= 1 ? (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              ) : (
                <Clock className="w-6 h-6 text-orange-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`font-bold ${
                trialDaysLeft <= 1 ? 'text-red-800' : 'text-gray-900'
              }`}>
                {trialDaysLeft <= 1
                  ? 'Trial Anda akan berakhir hari ini!'
                  : `Trial PRO: ${trialDaysLeft} hari tersisa`}
              </h3>
              <p className={`text-sm ${
                trialDaysLeft <= 1 ? 'text-red-700' : 'text-gray-600'
              }`}>
                {trialDaysLeft <= 1
                  ? 'Upgrade sekarang untuk tetap menikmati fitur PRO'
                  : 'Nikmati semua fitur PRO selama masa trial'}
              </p>
            </div>
            <a
              href="/checkout"
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all"
            >
              Upgrade PRO
            </a>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isTrial ? 'bg-gradient-to-br from-orange-500 to-pink-500' : 'bg-orange-100'
              }`}>
                <Crown className={`w-6 h-6 ${isTrial ? 'text-white' : 'text-orange-600'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Plan Saat Ini</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-gray-900">
                    {subscription?.planType === 'PRO' ? 'PRO' : 'FREE'}
                  </p>
                  {isTrial && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-orange-100 text-orange-700">
                      TRIAL
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isTrial ? 'bg-orange-100' : 'bg-lime-100'
              }`}>
                <FileText className={`w-6 h-6 ${isTrial ? 'text-orange-600' : 'text-lime-600'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-xl font-bold text-gray-900">
                  {isTrial && 'Trial'}
                  {subscription?.status === 'ACTIVE' && 'Aktif'}
                  {subscription?.status === 'CANCELED' && 'Akan Berakhir'}
                  {!isTrial && subscription?.status === 'FREE' && 'Gratis'}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {isTrial ? 'Trial Berakhir' : 'Perpanjangan'}
                </p>
                <p className="text-sm font-semibold text-gray-900">
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
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${
                activeTab === 'subscription'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Langganan
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${
                activeTab === 'payments'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
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
          <PaymentHistory userId={session.user?.id} />
        )}
      </div>
    </div>
  )
}
