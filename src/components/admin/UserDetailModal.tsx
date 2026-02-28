'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Crown, FileText, Activity, CreditCard } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

interface UserDetail {
  user: any
  payments: any[]
  activityLogs: any[]
}

interface UserDetailModalProps {
  userId: string | null
  onClose: () => void
}

export function UserDetailModal({ userId, onClose }: UserDetailModalProps) {
  const [data, setData] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'overview' | 'invoices' | 'payments' | 'activity'>('overview')
  const [updatingSubscription, setUpdatingSubscription] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchUserDetail()
    }
  }, [userId])

  const fetchUserDetail = async () => {
    if (!userId) return

    try {
      setLoading(true)
      const res = await fetch(`/api/admin/users/${userId}`)
      const result = await res.json()

      if (res.ok) {
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching user detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSubscription = async (planType: 'FREE' | 'PRO') => {
    if (!userId) return

    try {
      setUpdatingSubscription(true)
      const res = await fetch(`/api/admin/users/${userId}/subscription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType,
          status: planType === 'PRO' ? 'ACTIVE' : 'FREE',
        }),
      })

      if (res.ok) {
        fetchUserDetail()
      }
    } catch (error) {
      console.error('Error updating subscription:', error)
    } finally {
      setUpdatingSubscription(false)
    }
  }

  if (!userId) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Detail User</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading || !data ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* User Info Card */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {data.user.name || 'Tanpa Nama'}
                  </h3>
                  <p className="text-gray-600">{data.user.email}</p>
                  {data.user.companyName && (
                    <p className="text-sm text-gray-500 mt-1">{data.user.companyName}</p>
                  )}
                </div>

                {/* Subscription Quick Action */}
                <div className="flex items-center gap-2">
                  {data.user.subscription?.planType === 'PRO' ? (
                    <button
                      onClick={() => updateSubscription('FREE')}
                      disabled={updatingSubscription}
                      className="px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingSubscription ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Downgrade to FREE'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => updateSubscription('PRO')}
                      disabled={updatingSubscription}
                      className="px-4 py-2 rounded-lg bg-lime-500 text-white hover:bg-lime-600 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {updatingSubscription ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Crown className="w-4 h-4" />
                          Upgrade to PRO
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="p-4 bg-orange-50 rounded-xl">
                  <FileText className="w-5 h-5 text-orange-600 mb-2" />
                  <p className="text-sm text-gray-600">Invoices</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.user._count.invoices}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <Activity className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="text-sm text-gray-600">Clients</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.user._count.clients}
                  </p>
                </div>
                <div className="p-4 bg-pink-50 rounded-xl">
                  <CreditCard className="w-5 h-5 text-pink-600 mb-2" />
                  <p className="text-sm text-gray-600">Payments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.payments.length}
                  </p>
                </div>
                <div className="p-4 bg-lime-50 rounded-xl">
                  <Crown className="w-5 h-5 text-lime-600 mb-2" />
                  <p className="text-sm text-gray-600">Plan</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.user.subscription?.planType || 'FREE'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setTab('overview')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    tab === 'overview'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setTab('payments')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    tab === 'payments'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Payments ({data.payments.length})
                </button>
                <button
                  onClick={() => setTab('activity')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    tab === 'activity'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Activity Logs ({data.activityLogs.length})
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {tab === 'overview' && (
                <div className="space-y-6">
                  {/* Subscription Info */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3">
                      Informasi Langganan
                    </h4>
                    <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Plan Type</span>
                        <span className="text-sm font-medium text-gray-900">
                          {data.user.subscription?.planType || 'FREE'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status</span>
                        <span className="text-sm font-medium text-gray-900">
                          {data.user.subscription?.status || 'FREE'}
                        </span>
                      </div>
                      {data.user.subscription?.stripeCurrentPeriodEnd && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Period End</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatDate(data.user.subscription.stripeCurrentPeriodEnd)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Company Info */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3">
                      Informasi Perusahaan
                    </h4>
                    <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Nama Perusahaan</span>
                        <span className="text-sm font-medium text-gray-900">
                          {data.user.companyName || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Email</span>
                        <span className="text-sm font-medium text-gray-900">
                          {data.user.companyEmail || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Telepon</span>
                        <span className="text-sm font-medium text-gray-900">
                          {data.user.companyPhone || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'payments' && (
                <div className="space-y-3">
                  {data.payments.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Tidak ada pembayaran</p>
                  ) : (
                    data.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="p-4 border border-gray-200 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(payment.createdAt)}
                          </p>
                          {payment.receiptNumber && (
                            <p className="text-xs text-gray-500 font-mono">
                              {payment.receiptNumber}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            payment.status === 'COMPLETED'
                              ? 'bg-lime-100 text-lime-700'
                              : payment.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-pink-100 text-pink-700'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === 'activity' && (
                <div className="space-y-3">
                  {data.activityLogs.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Tidak ada aktivitas</p>
                  ) : (
                    data.activityLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-4 border border-gray-200 rounded-xl"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{log.title}</p>
                            {log.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {log.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              {formatDate(log.createdAt)}
                            </p>
                          </div>
                          <span className="px-2 py-1 rounded-lg text-xs font-bold bg-orange-100 text-orange-700">
                            {log.action}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
