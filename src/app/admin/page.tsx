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
  LogOut,
  Mail,
  Crown,
  Loader2,
  LayoutDashboard,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAutoLogout } from '@/hooks/useAutoLogout'
import { SessionTimeoutModal } from '@/components/SessionTimeoutModal'
import { AdminLogo } from '@/components/Logo'
import { cn } from '@/lib/utils'

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

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Payments', href: '/admin/payments', icon: DollarSign },
  { name: 'Email Templates', href: '/admin/email-templates', icon: Mail },
  { name: 'Activity Logs', href: '/admin/activity-logs', icon: Activity },
]

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
      <div className="min-h-screen bg-surface-light flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="w-16 h-16 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Memuat dashboard...</p>
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
      DRAFT: 'badge-draft',
      SENT: 'badge-sent',
      PAID: 'badge-paid',
      OVERDUE: 'badge-overdue',
      CANCELED: 'bg-gray-100 text-gray-600',
    }
    return colors[status] || 'badge-draft'
  }

  const calculateBarWidth = (value: number, max: number) => {
    return `${Math.min((value / max) * 100, 100)}%`
  }

  const maxInvoiceCount = Math.max(...(data?.invoicesByStatus?.map((s: any) => Number(s.count)) || [0]))
  const maxRevenue = Math.max(...(data?.revenueByMonth?.map((r: any) => Number(r.revenue)) || [0]))
  const maxUserCount = Math.max(...(data?.usersByMonth?.map((u: any) => Number(u.count)) || [0]))

  return (
    <div className="min-h-screen bg-surface-light">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <AdminLogo size="lg" linkToHome={false} />
            <div className="flex items-center gap-3 sm:gap-4">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 sm:px-4 py-2 rounded-xl border border-gray-200 text-text-primary text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 transition-all"
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
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-all font-medium text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Admin Navigation */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
          {navItems.map((item) => {
            const isActive = item.href === '/admin'
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={cn(
                  'flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-sm transition-all',
                  isActive
                    ? 'bg-brand-500 text-white'
                    : 'border border-gray-200 text-text-secondary hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50'
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.name}</span>
              </button>
            )
          })}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
          {/* Users with Subscription */}
          <div className="card card-hover p-5 sm:p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div className="icon-box icon-box-success">
                <Crown className="w-6 h-6 text-success-600" />
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-text-muted">
                dari {data?.summary?.totalUsers ?? 0} user
              </div>
            </div>
            <h3 className="text-sm font-bold text-text-secondary mb-1">User Berlangganan</h3>
            <p className="text-2xl sm:text-3xl font-bold text-text-primary">{data?.summary?.usersWithSubscription ?? 0}</p>
          </div>

          {/* Users without Subscription */}
          <div className="card card-hover p-5 sm:p-6 animate-fade-in-up animation-delay-100">
            <div className="flex items-center justify-between mb-4">
              <div className="icon-box icon-box-primary">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-text-muted">
                dari {data?.summary?.totalUsers ?? 0} user
              </div>
            </div>
            <h3 className="text-sm font-bold text-text-secondary mb-1">User Gratis</h3>
            <p className="text-2xl sm:text-3xl font-bold text-text-primary">{data?.summary?.usersWithoutSubscription ?? 0}</p>
          </div>

          {/* Total Invoices */}
          <div className="card card-hover p-5 sm:p-6 animate-fade-in-up animation-delay-200">
            <div className="flex items-center justify-between mb-4">
              <div className="icon-box icon-box-secondary">
                <FileText className="w-6 h-6 text-secondary-600" />
              </div>
              <div className={cn(
                'flex items-center gap-1 text-sm font-semibold',
                (data?.summary?.invoiceGrowth ?? 0) >= 0 ? 'text-success-600' : 'text-primary-600'
              )}>
                {(data?.summary?.invoiceGrowth ?? 0) >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {Math.abs(data?.summary?.invoiceGrowth ?? 0)}%
              </div>
            </div>
            <h3 className="text-sm font-bold text-text-secondary mb-1">Total Invoices</h3>
            <p className="text-2xl sm:text-3xl font-bold text-text-primary">{data?.summary?.totalInvoices ?? 0}</p>
          </div>

          {/* Total Revenue */}
          <div className="card card-hover p-5 sm:p-6 animate-fade-in-up animation-delay-300">
            <div className="flex items-center justify-between mb-4">
              <div className="icon-box icon-box-brand">
                <DollarSign className="w-6 h-6 text-brand-600" />
              </div>
              <div className={cn(
                'flex items-center gap-1 text-sm font-semibold',
                (data?.summary?.revenueGrowth ?? 0) >= 0 ? 'text-success-600' : 'text-primary-600'
              )}>
                {(data?.summary?.revenueGrowth ?? 0) >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {Math.abs(data?.summary?.revenueGrowth ?? 0)}%
              </div>
            </div>
            <h3 className="text-sm font-bold text-text-secondary mb-1">Total Revenue</h3>
            <p className="text-2xl sm:text-3xl font-bold text-text-primary">{formatCurrency(data?.summary?.totalRevenue ?? 0)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10">
          {/* Invoice Status Breakdown */}
          <div className="card p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-6">Status Invoice</h2>
            <div className="space-y-4">
              {data?.invoicesByStatus?.map((status) => (
                <div key={status.status}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn('badge', getStatusColor(status.status))}>
                      {getStatusLabel(status.status)}
                    </span>
                    <span className="text-sm font-bold text-text-primary">{status.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-400 to-brand-500 rounded-full transition-all duration-500"
                      style={{ width: calculateBarWidth(Number(status.count), maxInvoiceCount) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Clients */}
          <div className="card p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-6">Top Klien</h2>
            <div className="space-y-3">
              {data?.topClients?.slice(0, 5).map((client, index) => (
                <div key={client.clientEmail} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold',
                      index === 0 ? 'bg-primary-500' :
                      index === 1 ? 'bg-brand-500' :
                      index === 2 ? 'bg-success-500' :
                      'bg-secondary-500'
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary text-sm">{client.clientEmail}</p>
                      <p className="text-xs text-text-muted">{client.invoiceCount} invoice</p>
                    </div>
                  </div>
                  <p className="font-bold text-text-primary text-sm sm:text-base">{formatCurrency(client.totalRevenue)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="card p-5 sm:p-6 mb-8 sm:mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-6">Pendapatan per Bulan</h2>
          <div className="space-y-3">
            {data?.revenueByMonth?.slice(0, 6).map((item) => {
              const revenue = Number(item.revenue)
              const month = new Date(item.month as string).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
              return (
                <div key={item.month as string}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-text-secondary">{month}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-muted">{Number(item.count)} invoice</span>
                      <span className="font-bold text-text-primary">{formatCurrency(revenue)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-success-400 to-success-500 rounded-full transition-all duration-500"
                      style={{ width: calculateBarWidth(revenue, maxRevenue || 1) }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="card p-5 sm:p-6 mb-8 sm:mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-6">Pertumbuhan User</h2>
          <div className="space-y-3">
            {data?.usersByMonth?.slice(0, 6).map((item) => {
              const count = Number(item.count)
              const month = new Date(item.month as string).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
              return (
                <div key={item.month as string}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-text-secondary">{month}</span>
                    <span className="font-bold text-text-primary">{count} user baru</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-400 via-brand-400 to-success-400 rounded-full transition-all duration-500"
                      style={{ width: calculateBarWidth(count, maxUserCount || 1) }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Users */}
        <div className="card p-5 sm:p-6 mb-8 sm:mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-6">User Terbaru</h2>
          <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">Nama</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Tanggal Daftar</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentUsers?.map((user) => (
                  <tr key={user.id} className="table-row">
                    <td className="table-cell">
                      <p className="font-semibold text-text-primary">{user.name || '-'}</p>
                    </td>
                    <td className="table-cell">
                      <p className="text-text-secondary">{user.email}</p>
                    </td>
                    <td className="table-cell">
                      <p className="text-text-secondary">{formatDate(user.createdAt)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="card p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-6">Invoice Terbaru</h2>
          <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">No. Invoice</th>
                  <th className="table-header">Klien</th>
                  <th className="table-header">Pembuat</th>
                  <th className="table-header">Total</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentInvoices?.map((invoice) => (
                  <tr key={invoice.id} className="table-row">
                    <td className="table-cell">
                      <p className="font-semibold text-text-primary">{invoice.invoiceNumber}</p>
                    </td>
                    <td className="table-cell">
                      <p className="text-text-secondary">{invoice.clientName}</p>
                    </td>
                    <td className="table-cell">
                      <p className="text-text-secondary">{invoice.user.name || invoice.user.email}</p>
                    </td>
                    <td className="table-cell">
                      <p className="font-bold text-text-primary">{formatCurrency(invoice.total)}</p>
                    </td>
                    <td className="table-cell">
                      <span className={cn('badge', getStatusColor(invoice.status))}>
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
