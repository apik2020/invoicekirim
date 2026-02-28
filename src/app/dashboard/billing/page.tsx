'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CreditCard, FileText, Crown } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import { SubscriptionManager } from '@/components/billing/SubscriptionManager'
import { PaymentHistory } from '@/components/billing/PaymentHistory'

interface Subscription {
  id: string
  status: string
  planType: string
  stripeCurrentPeriodEnd: string | null
  stripeCustomerId: string | null
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
        setSubscription(data.subscription)
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

  return (
    <div className="min-h-screen bg-fresh-bg">
      <DashboardHeader title="Billing" showBackButton={true} backHref="/dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Pembayaran</h1>
          <p className="text-gray-600">Kelola langganan dan lihat riwayat pembayaran</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Crown className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Plan Saat Ini</p>
                <p className="text-xl font-bold text-gray-900">
                  {subscription?.planType === 'PRO' ? 'PRO' : 'FREE'}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-lime-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-lime-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-xl font-bold text-gray-900">
                  {subscription?.status === 'ACTIVE' && 'Aktif'}
                  {subscription?.status === 'CANCELED' && 'Akan Berakhir'}
                  {subscription?.status === 'FREE' && 'Gratis'}
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
                <p className="text-sm text-gray-600">Perpanjangan</p>
                <p className="text-sm font-semibold text-gray-900">
                  {subscription?.stripeCurrentPeriodEnd
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
