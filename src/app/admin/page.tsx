'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  BarChart3,
  Crown,
  Loader2,
  LogOut,
  Mail,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAutoLogout } from '@/hooks/useAutoLogout'
import { SessionTimeoutModal } from '@/components/SessionTimeoutModal'
import { AdminLogo } from '@/components/Logo'

interface Admin {
  id: string
  email: string
  name: string
}

interface AnalyticsData {
  summary: {
    totalUsers: number
    totalInvoices: number
    totalRevenue: number
    activeSubscriptions: number
    usersWithSubscription: number
    usersWithoutSubscription: number
    revenueGrowth: number
    invoiceGrowth: number
    userGrowth: number
  }
  recentUsers: Array<{
    id: string
    name: string | null
    email: string
    createdAt: string
  }>
  recentInvoices: Array<{
    id: string
    invoiceNumber: string
    clientName: string
    total: number
    status: string
    date: string
    createdAt: string
    user: {
      name: string | null
      email: string
    }
  }>
  invoicesByStatus: Array<{
    status: string
    count: number
  }>
  invoicesByMonth: Array<{
    month: string
    count: number | string
  }>
  usersByMonth: Array<{
    month: string
    count: number | string
  }>
  topClients: Array<{
    clientEmail: string
    invoiceCount: number
    totalRevenue: number
  }>
  revenueByMonth: Array<{
    month: string
    revenue: number | string
    count: number | string
  }>
}

export default function AdminDashboard() {
  const router = useRouter()
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [period, setPeriod] = useState('30')

  // Auto logout after 1 minute of inactivity (for testing)
  const { showWarning, timeRemaining, stayLoggedIn, logout } = useAutoLogout({
    timeout: 1 * 60 * 1000, // 1 minute (testing)
    warningTime: 30 * 1000, // 30 seconds warning
    redirectPath: '/admin/login',
  })

  useEffect(() => {
    checkAdminSession()
  }, [])

  const checkAdminSession = async () => {
    try {
      const res = await fetch('/api/admin/me')
      if (res.ok) {
        const adminData = await res.json()
        setAdmin(adminData)
        fetchAnalytics()
      } else {
        router.push('/admin/login')
      }
    } catch (error) {
      console.error('Error checking admin session:', error)
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`)
      const data = await res.json()

      if (!res.ok) {
        console.error('Analytics API error:', data)
        throw new Error(data.error || 'Failed to fetch analytics')
      }

      setData(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      alert(error instanceof Error ? error.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'Draft',
      SENT: 'Terkirim',
      PAID: 'Lunas',
      OVERDUE: 'Terlambat',
      CANCELED: 'Dibatalkan',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'badge-orange',
      SENT: 'badge-lemon',
      PAID: 'badge-lime',
      OVERDUE: 'badge-pink',
      CANCELED: 'bg-gray-100 text-gray-600',
    }
    return colors[status] || 'badge-orange'
  }

  const calculateBarWidth = (value: number, max: number) => {
    return `${Math.min((value / max) * 100, 100)}%`
  }

  const maxInvoiceCount = Math.max(...(data?.invoicesByStatus?.map((s: any) => Number(s.count)) || [0]))
  const maxRevenue = Math.max(...(data?.revenueByMonth?.map((r: any) => Number(r.revenue)) || [0]))
  const maxUserCount = Math.max(...(data?.usersByMonth?.map((u: any) => Number(u.count)) || [0]))

  return (
    <div className="min-h-screen bg-fresh-bg">

      {/* Header */}
      <div className="bg-white border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <AdminLogo size="lg" linkToHome={false} />
            <div className="flex items-center gap-4">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2 rounded-xl border border-orange-200 text-black focus:border-orange-500 focus:outline-none transition-colors"
              >
                <option value="7">7 Hari Terakhir</option>
                <option value="30">30 Hari Terakhir</option>
                <option value="90">90 Hari Terakhir</option>
                <option value="365">1 Tahun</option>
              </select>
              <button
                onClick={async () => {
                  await fetch('/api/admin/logout', { method: 'POST' })
                  router.push('/admin/login')
                  router.refresh()
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 focus:border-red-500 focus:outline-none transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Admin Navigation */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 rounded-xl bg-orange-500 text-white font-medium"
          >
            Dashboard
          </button>
          <button
            onClick={() => router.push('/admin/users')}
            className="px-4 py-2 rounded-xl border border-orange-200 text-gray-700 hover:bg-orange-50 font-medium flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Users
          </button>
          <button
            onClick={() => router.push('/admin/payments')}
            className="px-4 py-2 rounded-xl border border-orange-200 text-gray-700 hover:bg-orange-50 font-medium flex items-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            Payments
          </button>
          <button
            onClick={() => router.push('/admin/email-templates')}
            className="px-4 py-2 rounded-xl border border-orange-200 text-gray-700 hover:bg-orange-50 font-medium flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Email Templates
          </button>
          <button
            onClick={() => router.push('/admin/activity-logs')}
            className="px-4 py-2 rounded-xl border border-orange-200 text-gray-700 hover:bg-orange-50 font-medium flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            Activity Logs
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Users with Subscription */}
          <div className="card card-hover p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="icon-box icon-box-lime">
                <Crown className="w-6 h-6 text-lime-600" />
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500">
                dari {data?.summary?.totalUsers ?? 0} user
              </div>
            </div>
            <h3 className="text-sm font-bold text-gray-600 mb-1">User Berlangganan</h3>
            <p className="text-3xl font-bold text-gray-900">{data?.summary?.usersWithSubscription ?? 0}</p>
          </div>

          {/* Users without Subscription */}
          <div className="card card-hover p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="icon-box icon-box-orange">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500">
                dari {data?.summary?.totalUsers ?? 0} user
              </div>
            </div>
            <h3 className="text-sm font-bold text-gray-600 mb-1">User Gratis</h3>
            <p className="text-3xl font-bold text-gray-900">{data?.summary?.usersWithoutSubscription ?? 0}</p>
          </div>

          {/* Total Invoices */}
          <div className="card card-hover p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="icon-box icon-box-lemon">
                <FileText className="w-6 h-6 text-lemon-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-semibold ${
                (data?.summary?.invoiceGrowth ?? 0) >= 0 ? 'text-lime-600' : 'text-pink-600'
              }`}>
                {(data?.summary?.invoiceGrowth ?? 0) >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {Math.abs(data?.summary?.invoiceGrowth ?? 0)}%
              </div>
            </div>
            <h3 className="text-sm font-bold text-gray-600 mb-1">Total Invoices</h3>
            <p className="text-3xl font-bold text-gray-900">{data?.summary?.totalInvoices ?? 0}</p>
          </div>

          {/* Total Revenue */}
          <div className="card card-hover p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="icon-box icon-box-lime">
                <DollarSign className="w-6 h-6 text-lime-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-semibold ${
                (data?.summary?.revenueGrowth ?? 0) >= 0 ? 'text-lime-600' : 'text-pink-600'
              }`}>
                {(data?.summary?.revenueGrowth ?? 0) >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {Math.abs(data?.summary?.revenueGrowth ?? 0)}%
              </div>
            </div>
            <h3 className="text-sm font-bold text-gray-600 mb-1">Total Revenue</h3>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(data?.summary?.totalRevenue ?? 0)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Invoice Status Breakdown */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Status Invoice</h2>
            <div className="space-y-4">
              {data?.invoicesByStatus?.map((status) => (
                <div key={status.status}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-3 py-1 rounded-xl text-xs font-bold ${getStatusColor(status.status)}`}>
                      {getStatusLabel(status.status)}
                    </span>
                    <span className="text-sm font-bold text-gray-900">{status.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-pink-400 rounded-full transition-all duration-500"
                      style={{ width: calculateBarWidth(Number(status.count), maxInvoiceCount) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Clients */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Top Klien</h2>
            <div className="space-y-3">
              {data?.topClients?.slice(0, 5).map((client, index) => (
                <div key={client.clientEmail} className="flex items-center justify-between py-3 border-b border-orange-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold ${
                      index === 0 ? 'bg-orange-500' :
                      index === 1 ? 'bg-lemon-500' :
                      index === 2 ? 'bg-lime-500' :
                      'bg-pink-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{client.clientEmail}</p>
                      <p className="text-xs text-gray-500">{client.invoiceCount} invoice</p>
                    </div>
                  </div>
                  <p className="font-bold text-gray-900">{formatCurrency(client.totalRevenue)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="card p-6 mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Pendapatan per Bulan</h2>
          <div className="space-y-3">
            {data?.revenueByMonth?.slice(0, 6).map((item) => {
              const revenue = Number(item.revenue)
              const month = new Date(item.month as string).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
              return (
                <div key={item.month as string}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">{month}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{Number(item.count)} invoice</span>
                      <span className="font-bold text-gray-900">{formatCurrency(revenue)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-lime-400 to-green-500 rounded-full transition-all duration-500"
                      style={{ width: calculateBarWidth(revenue, maxRevenue || 1) }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="card p-6 mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Pertumbuhan User</h2>
          <div className="space-y-3">
            {data?.usersByMonth?.slice(0, 6).map((item) => {
              const count = Number(item.count)
              const month = new Date(item.month as string).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
              return (
                <div key={item.month as string}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">{month}</span>
                    <span className="font-bold text-gray-900">{count} user baru</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 via-lemon-400 to-lime-400 rounded-full transition-all duration-500"
                      style={{ width: calculateBarWidth(count, maxUserCount || 1) }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Users */}
        <div className="card p-6 mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-6">User Terbaru</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-orange-100">
                  <th className="text-left py-3 text-sm font-bold text-gray-600">Nama</th>
                  <th className="text-left py-3 text-sm font-bold text-gray-600">Email</th>
                  <th className="text-left py-3 text-sm font-bold text-gray-600">Tanggal Daftar</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentUsers?.map((user) => (
                  <tr key={user.id} className="border-b border-orange-50">
                    <td className="py-3">
                      <p className="font-semibold text-gray-900">{user.name || '-'}</p>
                    </td>
                    <td className="py-3">
                      <p className="text-gray-600">{user.email}</p>
                    </td>
                    <td className="py-3">
                      <p className="text-gray-600">{formatDate(user.createdAt)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Invoice Terbaru</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-orange-100">
                  <th className="text-left py-3 text-sm font-bold text-gray-600">No. Invoice</th>
                  <th className="text-left py-3 text-sm font-bold text-gray-600">Klien</th>
                  <th className="text-left py-3 text-sm font-bold text-gray-600">Pembuat</th>
                  <th className="text-left py-3 text-sm font-bold text-gray-600">Total</th>
                  <th className="text-left py-3 text-sm font-bold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentInvoices?.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-orange-50 hover:bg-orange-50/50">
                    <td className="py-3">
                      <p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                    </td>
                    <td className="py-3">
                      <p className="text-gray-600">{invoice.clientName}</p>
                    </td>
                    <td className="py-3">
                      <p className="text-gray-600">{invoice.user.name || invoice.user.email}</p>
                    </td>
                    <td className="py-3">
                      <p className="font-bold text-gray-900">{formatCurrency(invoice.total)}</p>
                    </td>
                    <td className="py-3">
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
