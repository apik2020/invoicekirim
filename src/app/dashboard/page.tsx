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
  planName?: string
  isTrial?: boolean
  trialDaysLeft?: number
  trialEndsAt?: string | null
  pricingPlanId?: string | null
  invoiceLimit?: number
  invoiceCount?: number
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

  const getPlanBadge = () => {
    const planType = subscription?.planType || 'FREE'
    const planName = subscription?.planName || 'Free'
    const slug = subscription?.pricingPlanId

    if (isTrial) {
      return { label: 'Trial', color: 'bg-amber-100 text-amber-700 border-amber-200' }
    }
    if (slug === 'plan-professional' || (planType === 'PRO' && planName?.toLowerCase().includes('profesional'))) {
      return { label: 'Profesional', color: 'bg-purple-100 text-purple-700 border-purple-200' }
    }
    if (slug === 'plan-basic' || (planType === 'PRO' && planName?.toLowerCase().includes('basic'))) {
      return { label: 'Basic', color: 'bg-blue-100 text-blue-700 border-blue-200' }
    }
    return { label: 'Free', color: 'bg-gray-100 text-gray-600 border-gray-200' }
  }

  const planBadge = getPlanBadge()
  const invoiceLimit = subscription?.invoiceLimit
  const invoiceCount = subscription?.invoiceCount

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

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold mb-1">Upgrade ke Basic atau Profesional!</h3>
                <p className="text-white/90 text-sm">
                  Dapatkan fitur lengkap: template custom, branding, analytics, dan banyak lagi.
                  Mulai dari Rp 19.000/bulan.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <Link
                  href="/dashboard/pricing"
                  className="px-4 py-2.5 bg-white text-brand-600 font-bold rounded-xl hover:bg-white/90 transition-colors text-center text-sm"
                >
                  Lihat Paket
                </Link>
                <Link
                  href="/dashboard/checkout"
                  className="px-4 py-2.5 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 transition-colors text-center text-sm"
                >
                  Upgrade Sekarang
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Trial Banner for TRIALING users */}
        {isTrial && (
          <div className={`rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 ${
            trialDaysLeft <= 1
              ? 'bg-primary-50 border border-primary-200'
              : trialDaysLeft <= 3
                ? 'bg-highlight-100 border border-highlight-200'
                : 'bg-brand-50 border border-brand-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                trialDaysLeft <= 1 ? 'bg-primary-100' : 'bg-brand-100'
              }`}>
                {trialDaysLeft <= 1 ? (
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" />
                ) : (
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-brand-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-sm sm:text-base ${
                  trialDaysLeft <= 1 ? 'text-primary-700' : 'text-brand-600'
                }`}>
                  {trialDaysLeft <= 1
                    ? 'Trial berakhir hari ini!'
                    : `Trial: ${trialDaysLeft} hari tersisa`}
                </h3>
                <p className={`text-xs sm:text-sm ${
                  trialDaysLeft <= 1 ? 'text-primary-600' : 'text-text-secondary'
                }`}>
                  {trialDaysLeft <= 1
                    ? 'Upgrade sekarang agar tidak kehilangan akses fitur'
                    : 'Nikmati semua fitur premium selama masa trial'}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/pricing"
              className="px-4 py-2.5 btn-primary text-white font-bold rounded-xl text-center text-sm sm:self-center sm:whitespace-nowrap"
            >
              Pilih Paket
            </Link>
          </div>
        )}

        {/* Welcome Section with Plan Badge */}
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="font-bold text-2xl md:text-3xl text-brand-500 tracking-tight">
              Selamat Datang, {session?.user?.name || 'Kawan'}!
            </h1>
            <Link
              href="/dashboard/billing"
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${planBadge.color} hover:opacity-80 transition-opacity`}
            >
              {planBadge.label === 'Profesional' && <Crown className="w-3 h-3" />}
              {planBadge.label === 'Basic' && <Sparkles className="w-3 h-3" />}
              {planBadge.label}
            </Link>
          </div>
          <p className="text-text-secondary">
            Kelola invoice bisnismu dengan mudah dan profesional
          </p>
          {invoiceLimit !== -1 && invoiceLimit !== undefined && (
            <p className="text-sm text-text-muted mt-1">
              Invoice bulan ini: <span className="font-semibold text-text-primary">{invoiceCount || 0}</span>/{invoiceLimit === null ? '∞' : invoiceLimit}
            </p>
          )}
          {invoiceLimit === -1 && (
            <p className="text-sm text-text-muted mt-1">
              Invoice bulan ini: <span className="font-semibold text-text-primary">{invoiceCount || 0}</span>/Unlimited
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card p-4 sm:p-6">
          <h2 className="text-lg font-bold text-brand-500 mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            <Link
              href="/dashboard/invoices/create"
              className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors group text-center sm:text-left"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-primary group-hover:shadow-primary-lg transition-all">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-xs sm:text-sm">Buat Invoice</h3>
                <p className="text-xs text-text-muted hidden sm:block">Invoice baru</p>
              </div>
            </Link>
            <Link
              href="/dashboard/clients"
              className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors group text-center sm:text-left"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-brand group-hover:shadow-brand-lg transition-all">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-xs sm:text-sm">Klien</h3>
                <p className="text-xs text-text-muted hidden sm:block">Kelola klien</p>
              </div>
            </Link>
            <Link
              href="/dashboard/items"
              className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-secondary-50 hover:bg-secondary-100 border border-secondary-200 transition-colors group text-center sm:text-left"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-secondary-400 to-secondary-500 flex items-center justify-center shadow-brand group-hover:shadow-brand-lg transition-all">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-xs sm:text-sm">Item</h3>
                <p className="text-xs text-text-muted hidden sm:block">Katalog item</p>
              </div>
            </Link>
            <Link
              href="/dashboard/templates"
              className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-highlight-50 hover:bg-highlight-100 border border-highlight-200 transition-colors group text-center sm:text-left"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-highlight-400 to-highlight-500 flex items-center justify-center shadow-brand group-hover:shadow-brand-lg transition-all">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-xs sm:text-sm">Template</h3>
                <p className="text-xs text-text-muted hidden sm:block">Kelola template</p>
              </div>
            </Link>
            <Link
              href="/dashboard/invoices"
              className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-success-50 hover:bg-success-100 border border-success-200 transition-colors group text-center sm:text-left"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-success-400 to-success-500 flex items-center justify-center shadow-brand group-hover:shadow-brand-lg transition-all">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-xs sm:text-sm">Daftar Invoice</h3>
                <p className="text-xs text-text-muted hidden sm:block">Lihat invoice</p>
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
            <>
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-2">
                {data.invoices.map((invoice: any) => (
                  <Link
                    key={invoice.id}
                    href={`/dashboard/invoices/${invoice.id}`}
                    className="block p-3 rounded-xl bg-surface-light hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-text-primary text-sm">{invoice.invoiceNumber}</span>
                      <span className={`status-pill text-[10px] ${
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
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary">{invoice.clientName}</span>
                      <span className="font-bold text-text-primary text-sm">{formatCurrency(invoice.total)}</span>
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      {new Date(invoice.date).toLocaleDateString('id-ID')}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
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
            </>
          )}
        </div>

        {/* Plan Status */}
        {data.subscription && data.subscription.planType === 'FREE' && (
          <div className="card p-4 sm:p-6 bg-gradient-to-br from-brand-50 via-secondary-50/50 to-success-50/30 border-brand-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-lg font-bold text-brand-500 mb-1">
                  Paket Free — {invoiceCount || 0}/{invoiceLimit || 5} Invoice Bulan Ini
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary">
                  Upgrade ke Basic atau Profesional untuk invoice lebih banyak dan fitur premium
                </p>
              </div>
              <Link
                href="/dashboard/pricing"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 text-white font-bold rounded-xl btn-primary text-sm"
              >
                Upgrade Paket
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
