'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText, Plus, Users, Package, Loader2, Crown, Sparkles, Clock, X,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { DashboardLayout } from '@/components/DashboardLayout'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { RevenueByStatusChart } from '@/components/dashboard/RevenueByStatusChart'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { DueDateAlerts } from '@/components/dashboard/DueDateAlerts'
import { DueDateSummary } from '@/components/dashboard/DueDateSummary'
import { DashboardStatusSummary } from '@/components/dashboard/DashboardStatusSummary'
import { useAutoLogout } from '@/hooks/useAutoLogout'
import { SessionTimeoutModal } from '@/components/SessionTimeoutModal'
import { useAppSession } from '@/hooks/useAppSession'

interface Subscription {
  id: string
  status: string
  planType: string
  isTrial?: boolean
  trialDaysLeft?: number
  trialEndsAt?: string | null
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useAppSession()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(true)

  // Auto logout after 5 minutes of inactivity
  const { showWarning, timeRemaining, stayLoggedIn, logout } = useAutoLogout({
    timeout: 5 * 60 * 1000, // 5 minutes
    warningTime: 60 * 1000, // 1 minute warning before logout
    redirectPath: '/login',
  })

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch('/api/subscription')
      if (res.ok) {
        const subData = await res.json()
        setSubscription(subData)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }, [])

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/user/dashboard-data', {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Gagal mengambil data dashboard' }))

        if (response.status === 403 && errorData.error?.includes('Admin')) {
          router.push('/admin')
          return
        }

        throw new Error(errorData.error || 'Gagal mengambil data dashboard')
      }

      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil data')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated' && session?.user) {
      // Fetch dashboard data and subscription in parallel
      Promise.all([fetchDashboardData(), fetchSubscription()])
    }
  }, [status, session, router, fetchDashboardData, fetchSubscription])

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    fetchDashboardData()
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-brand-500 animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Memuat dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="card p-8 max-w-md mx-auto text-center mt-10">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-brand-500 mb-2">Gagal Memuat Dashboard</h2>
          <p className="text-text-secondary mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="btn-primary px-6 py-3 font-bold"
          >
            Coba Lagi
          </button>
        </div>
      </DashboardLayout>
    )
  }

  if (!data) {
    return null
  }

  const isFree = subscription?.status === 'FREE' && subscription?.planType === 'FREE'
  const isTrial = subscription?.isTrial || subscription?.status === 'TRIALING'
  const trialDaysLeft = subscription?.trialDaysLeft || 0

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Upgrade Banner for FREE users */}
        {isFree && showUpgradeBanner && (
          <div className="relative cta-gradient rounded-2xl p-6 text-white shadow-brand">
            <button
              onClick={() => setShowUpgradeBanner(false)}
              className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">Upgrade ke PRO!</h3>
                <p className="text-white/90 text-sm">
                  Dapatkan fitur unlimited invoice, template premium, analytics, dan banyak lagi.
                  Mulai trial 7 hari gratis tanpa kartu kredit.
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/dashboard/billing"
                  className="px-5 py-2.5 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 transition-colors"
                >
                  Mulai Trial Gratis
                </Link>
                <Link
                  href="/pricing"
                  className="px-5 py-2.5 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-colors"
                >
                  Lihat Harga
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Trial Banner for TRIALING users */}
        {isTrial && (
          <div className={`rounded-2xl p-4 flex items-center gap-4 ${
            trialDaysLeft <= 1
              ? 'bg-primary-50 border border-primary-200'
              : trialDaysLeft <= 3
                ? 'bg-highlight-100 border border-highlight-200'
                : 'bg-brand-50 border border-brand-200'
          }`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              trialDaysLeft <= 1 ? 'bg-primary-100' : 'bg-brand-100'
            }`}>
              {trialDaysLeft <= 1 ? (
                <Clock className="w-6 h-6 text-primary-500" />
              ) : (
                <Sparkles className="w-6 h-6 text-brand-500" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`font-bold ${
                trialDaysLeft <= 1 ? 'text-primary-700' : 'text-brand-600'
              }`}>
                {trialDaysLeft <= 1
                  ? 'Trial berakhir hari ini!'
                  : `Trial PRO: ${trialDaysLeft} hari tersisa`}
              </h3>
              <p className={`text-sm ${
                trialDaysLeft <= 1 ? 'text-primary-600' : 'text-text-secondary'
              }`}>
                {trialDaysLeft <= 1
                  ? 'Upgrade sekarang agar tidak kehilangan akses PRO'
                  : 'Nikmati semua fitur premium selama masa trial'}
              </p>
            </div>
            <Link
              href="/checkout"
              className="px-4 py-2 btn-primary text-white font-bold rounded-xl whitespace-nowrap"
            >
              Upgrade PRO
            </Link>
          </div>
        )}

        {/* Welcome Section */}
        <div>
          <h1 className="font-bold text-2xl md:text-3xl text-brand-500 mb-2 tracking-tight">
            Selamat Datang, {session?.user?.name || 'Kawan'}!
          </h1>
          <p className="text-text-secondary">
            Kelola invoice bisnismu dengan mudah dan profesional
          </p>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-brand-500 mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Link
              href="/dashboard/invoices/create"
              className="flex items-center gap-3 p-4 rounded-xl bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-primary group-hover:shadow-primary-lg transition-all">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary">Buat Invoice</h3>
                <p className="text-sm text-text-muted">Invoice baru</p>
              </div>
            </Link>
            <Link
              href="/dashboard/clients"
              className="flex items-center gap-3 p-4 rounded-xl bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-brand group-hover:shadow-brand-lg transition-all">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary">Klien</h3>
                <p className="text-sm text-text-muted">Kelola klien</p>
              </div>
            </Link>
            <Link
              href="/dashboard/items"
              className="flex items-center gap-3 p-4 rounded-xl bg-secondary-50 hover:bg-secondary-100 border border-secondary-200 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-400 to-secondary-500 flex items-center justify-center shadow-brand group-hover:shadow-brand-lg transition-all">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary">Item</h3>
                <p className="text-sm text-text-muted">Katalog item</p>
              </div>
            </Link>
            <Link
              href="/dashboard/templates"
              className="flex items-center gap-3 p-4 rounded-xl bg-highlight-50 hover:bg-highlight-100 border border-highlight-200 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-highlight-400 to-highlight-500 flex items-center justify-center shadow-brand group-hover:shadow-brand-lg transition-all">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary">Template</h3>
                <p className="text-sm text-text-muted">Kelola template</p>
              </div>
            </Link>
            <Link
              href="/dashboard/invoices"
              className="flex items-center gap-3 p-4 rounded-xl bg-success-50 hover:bg-success-100 border border-success-200 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success-400 to-success-500 flex items-center justify-center shadow-brand group-hover:shadow-brand-lg transition-all">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary">Daftar Invoice</h3>
                <p className="text-sm text-text-muted">Lihat invoice</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Due Date Alerts */}
        {(data.dueInvoices?.overdue?.length > 0 ||
          data.dueInvoices?.dueToday?.length > 0 ||
          data.dueInvoices?.dueThisWeek?.length > 0) && (
          <DueDateAlerts
            overdue={data.dueInvoices.overdue || []}
            dueToday={data.dueInvoices.dueToday || []}
            dueThisWeek={data.dueInvoices.dueThisWeek || []}
          />
        )}

        {/* Stats Grid */}
        <DashboardStatusSummary counts={data.stats?.statusCounts || {}} />

        {/* Revenue Charts */}
        {data.stats?.totalInvoices > 0 && data.analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueChart
                data={data.analytics.revenueByMonth || []}
                period={6}
              />
            </div>
            <div>
              <RevenueByStatusChart
                data={data.analytics.revenueByStatus || []}
              />
            </div>
          </div>
        )}

        {/* Due Date Summary Cards */}
        <DueDateSummary
          overdueCount={data.dueInvoices?.summary?.overdueCount || 0}
          overdueAmount={data.dueInvoices?.summary?.overdueAmount || 0}
          dueThisWeekCount={data.dueInvoices?.summary?.dueThisWeekCount || 0}
          dueThisWeekAmount={data.dueInvoices?.summary?.dueThisWeekAmount || 0}
        />

        {/* Activity Feed */}
        <div className="card p-6">
          <ActivityFeed activities={data.activityLogs || []} />
        </div>

        {/* Recent Invoices */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-brand-500">Invoice Terbaru</h2>
            <Link
              href="/dashboard/invoices"
              className="text-sm text-brand-500 hover:text-brand-600 font-medium"
            >
              Lihat Semua →
            </Link>
          </div>

          {(!data.invoices || data.invoices.length === 0) ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-2xl icon-box-brand mx-auto mb-4">
                <FileText className="w-10 h-10 text-brand-500" />
              </div>
              <h3 className="text-lg font-bold text-brand-500 mb-2">
                Belum ada invoice
              </h3>
              <p className="text-text-secondary mb-6">
                Buat invoice pertamamu sekarang
              </p>
              <Link
                href="/dashboard/invoices/create"
                className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl btn-primary"
              >
                Buat Invoice
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-light">
                  <tr>
                    <th className="table-header">Nomor</th>
                    <th className="table-header">Klien</th>
                    <th className="table-header">Tanggal</th>
                    <th className="table-header">Status</th>
                    <th className="table-header text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.map((invoice: any) => (
                    <tr key={invoice.id} className="table-row">
                      <td className="table-cell font-bold text-text-primary">{invoice.invoiceNumber}</td>
                      <td className="table-cell text-text-secondary">{invoice.clientName}</td>
                      <td className="table-cell text-text-secondary">
                        {new Date(invoice.date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="table-cell">
                        <span className={`status-pill ${
                          invoice.status === 'PAID'
                            ? 'status-paid'
                            : invoice.status === 'SENT'
                            ? 'status-sent'
                            : invoice.status === 'OVERDUE'
                            ? 'status-overdue'
                            : 'status-draft'
                        }`}>
                          {invoice.status === 'PAID' ? 'Lunas' : invoice.status === 'SENT' ? 'Terkirim' : invoice.status === 'OVERDUE' ? 'Terlambat' : 'Draft'}
                        </span>
                      </td>
                      <td className="table-cell text-right font-bold text-text-primary">
                        {formatCurrency(invoice.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Plan Status */}
        {data.subscription && data.subscription.planType === 'FREE' && (
          <div className="card p-6 bg-gradient-to-br from-brand-50 via-secondary-50/50 to-success-50/30 border-brand-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-brand-500 mb-2">
                  Paket Gratis - {data.stats?.totalInvoices || 0}/10 Invoice
                </h3>
                <p className="text-text-secondary">
                  Upgrade ke Paket Pro untuk invoice tanpa batas dan fitur premium lainnya
                </p>
              </div>
              <Link
                href="/checkout"
                className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl btn-primary whitespace-nowrap"
              >
                Upgrade ke Pro
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Session Timeout Warning Modal */}
      <SessionTimeoutModal
        show={showWarning}
        timeRemaining={timeRemaining}
        onStayLoggedIn={stayLoggedIn}
        onLogout={logout}
      />
    </DashboardLayout>
  )
}
