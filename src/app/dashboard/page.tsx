'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, Users, Package, Loader2, Crown, Sparkles, Clock, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import DashboardHeader from '@/components/DashboardHeader'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { RevenueByStatusChart } from '@/components/dashboard/RevenueByStatusChart'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { DueDateAlerts } from '@/components/dashboard/DueDateAlerts'
import { DueDateSummary } from '@/components/dashboard/DueDateSummary'
import { DashboardStatusSummary } from '@/components/dashboard/DashboardStatusSummary'
import { useAutoLogout } from '@/hooks/useAutoLogout'
import { SessionTimeoutModal } from '@/components/SessionTimeoutModal'

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
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(true)

  // Auto logout after 1 minute of inactivity (for testing)
  const { showWarning, timeRemaining, stayLoggedIn, logout } = useAutoLogout({
    timeout: 1 * 60 * 1000, // 1 minute (testing)
    warningTime: 30 * 1000, // 30 seconds warning
    redirectPath: '/login',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated' && session?.user) {
      fetchDashboardData()
      fetchSubscription()
    }
  }, [status, session, router])

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/subscription')
      if (res.ok) {
        const subData = await res.json()
        setSubscription(subData)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setError(null)
      const response = await fetch('/api/user/dashboard-data', {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Gagal mengambil data dashboard' }))

        // If user is admin, redirect to admin dashboard
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
  }

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    fetchDashboardData()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center">
        <div className="card p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-pink-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Gagal Memuat Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="btn-primary text-white px-6 py-3 rounded-xl font-bold"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="min-h-screen bg-fresh-bg">
      <DashboardHeader title="Dashboard" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <DashboardContent
          session={session}
          data={data}
          subscription={subscription}
          showUpgradeBanner={showUpgradeBanner}
          setShowUpgradeBanner={setShowUpgradeBanner}
        />
      </div>

      {/* Session Timeout Warning Modal */}
      <SessionTimeoutModal
        show={showWarning}
        timeRemaining={timeRemaining}
        onStayLoggedIn={stayLoggedIn}
        onLogout={logout}
      />
    </div>
  )
}

function DashboardContent({
  session,
  data,
  subscription,
  showUpgradeBanner,
  setShowUpgradeBanner,
}: {
  session: any
  data: any
  subscription: Subscription | null
  showUpgradeBanner: boolean
  setShowUpgradeBanner: (show: boolean) => void
}) {
  const isFree = subscription?.status === 'FREE' && subscription?.planType === 'FREE'
  const isTrial = subscription?.isTrial || subscription?.status === 'TRIALING'
  const trialDaysLeft = subscription?.trialDaysLeft || 0

  return (
    <div className="space-y-10">
      {/* Upgrade Banner for FREE users */}
      {isFree && showUpgradeBanner && (
        <div className="relative bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-2xl p-6 text-white shadow-lg">
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
                className="px-5 py-2.5 bg-white text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-colors"
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
            ? 'bg-red-50 border border-red-200'
            : trialDaysLeft <= 3
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-orange-50 border border-orange-200'
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            trialDaysLeft <= 1 ? 'bg-red-100' : 'bg-orange-100'
          }`}>
            {trialDaysLeft <= 1 ? (
              <Clock className="w-6 h-6 text-red-600" />
            ) : (
              <Sparkles className="w-6 h-6 text-orange-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`font-bold ${
              trialDaysLeft <= 1 ? 'text-red-800' : 'text-gray-900'
            }`}>
              {trialDaysLeft <= 1
                ? 'Trial berakhir hari ini!'
                : `Trial PRO: ${trialDaysLeft} hari tersisa`}
            </h3>
            <p className={`text-sm ${
              trialDaysLeft <= 1 ? 'text-red-700' : 'text-gray-600'
            }`}>
              {trialDaysLeft <= 1
                ? 'Upgrade sekarang agar tidak kehilangan akses PRO'
                : 'Nikmati semua fitur premium selama masa trial'}
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all whitespace-nowrap"
          >
            Upgrade PRO
          </Link>
        </div>
      )}

      {/* Welcome Section */}
      <div>
        <h1 className="font-bold text-3xl md:text-4xl text-gray-900 mb-2 tracking-tight">
          Selamat Datang, {session?.user?.name || 'Kawan'}! 👋
        </h1>
        <p className="text-gray-600">
          Kelola invoice bisnismu dengan mudah dan profesional
        </p>
      </div>

      {/* Quick Actions - MOVED TO TOP */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Link
            href="/dashboard/invoices/create"
            className="flex items-center gap-3 p-4 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Buat Invoice</h3>
              <p className="text-sm text-gray-600">Invoice baru</p>
            </div>
          </Link>
          <Link
            href="/dashboard/clients"
            className="flex items-center gap-3 p-4 rounded-xl bg-pink-50 hover:bg-pink-100 border border-pink-200 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Klien</h3>
              <p className="text-sm text-gray-600">Kelola klien</p>
            </div>
          </Link>
          <Link
            href="/dashboard/items"
            className="flex items-center gap-3 p-4 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Item</h3>
              <p className="text-sm text-gray-600">Katalog item</p>
            </div>
          </Link>
          <Link
            href="/dashboard/templates"
            className="flex items-center gap-3 p-4 rounded-xl bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-lime-500 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Template</h3>
              <p className="text-sm text-gray-600">Kelola template</p>
            </div>
          </Link>
          <Link
            href="/dashboard/invoices"
            className="flex items-center gap-3 p-4 rounded-xl bg-lime-50 hover:bg-lime-100 border border-lime-200 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lime-500 to-green-500 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Daftar Invoice</h3>
              <p className="text-sm text-gray-600">Lihat invoice</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Due Date Alerts - Show at top if any */}
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

      {/* Revenue Charts - Only show if there's data */}
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

      {/* Activity Feed - Now full width in its own section */}
      <div className="card p-6">
        <ActivityFeed activities={data.activityLogs || []} />
      </div>

      {/* Recent Invoices */}
      <div className="card p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Invoice Terbaru</h2>
          <Link
            href="/dashboard/invoices"
            className="text-sm text-gray-900 hover:text-orange-600 font-medium"
          >
            Lihat Semua →
          </Link>
        </div>

        {(!data.invoices || data.invoices.length === 0) ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-2xl icon-box-orange mx-auto mb-4">
              <FileText className="w-10 h-10 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Belum ada invoice
            </h3>
            <p className="text-gray-600 mb-6">
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
              <thead>
                <tr className="border-b border-orange-100">
                  <th className="text-left py-3 text-sm font-bold text-gray-600">Nomor</th>
                  <th className="text-left py-3 text-sm font-bold text-gray-600">Klien</th>
                  <th className="text-left py-3 text-sm font-bold text-gray-600">Tanggal</th>
                  <th className="text-left py-3 text-sm font-bold text-gray-600">Status</th>
                  <th className="text-right py-3 text-sm font-bold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((invoice: any) => (
                  <tr key={invoice.id} className="border-b border-orange-50 hover:bg-orange-50/50 transition-colors">
                    <td className="py-4 font-bold text-gray-900">{invoice.invoiceNumber}</td>
                    <td className="py-4 text-gray-600">{invoice.clientName}</td>
                    <td className="py-4 text-gray-600">
                      {new Date(invoice.date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                        invoice.status === 'PAID'
                          ? 'badge-lime'
                          : invoice.status === 'SENT'
                          ? 'badge-yellow'
                          : invoice.status === 'OVERDUE'
                          ? 'badge-pink'
                          : 'badge-orange'
                      }`}>
                        {invoice.status === 'PAID' ? 'Lunas' : invoice.status === 'SENT' ? 'Terkirim' : invoice.status === 'OVERDUE' ? 'Terlambat' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-4 text-right font-bold text-gray-900">
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
        <div className="card p-8 bg-gradient-to-br from-orange-100 via-yellow-100 to-lime-100 border-orange-300">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Paket Gratis - {data.stats?.totalInvoices || 0}/10 Invoice
              </h3>
              <p className="text-gray-700">
                Upgrade ke Paket Pro untuk invoice tanpa batas dan fitur premium lainnya
              </p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl btn-primary whitespace-nowrap"
            >
              Upgrade ke Pro
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
