'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Crown,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { cn } from '@/lib/utils'

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
    users: {
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
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [period, setPeriod] = useState('30')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/admin/analytics?period=${period}`)
      const responseData = await res.json()

      if (!res.ok) {
        console.error('Analytics API error:', responseData)
        setError(responseData.error || responseData.details || 'Failed to fetch analytics')
        throw new Error(responseData.error || 'Failed to fetch analytics')
      }

      setData(responseData)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

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

  const maxInvoiceCount = Math.max(...(data?.invoicesByStatus?.map((s) => Number(s.count)) || [0]))
  const maxRevenue = Math.max(...(data?.revenueByMonth?.map((r) => Number(r.revenue)) || [0]))
  const maxUserCount = Math.max(...(data?.usersByMonth?.map((u) => Number(u.count)) || [0]))

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-700">Gagal memuat data</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <button
                onClick={() => fetchAnalytics()}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !data && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-text-secondary">Memuat data...</p>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Dashboard Overview</h1>
            <p className="text-text-secondary">Pantau aktivitas dan performa aplikasi</p>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-text-primary text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 transition-all"
          >
            <option value="7">7 Hari Terakhir</option>
            <option value="30">30 Hari Terakhir</option>
            <option value="90">90 Hari Terakhir</option>
            <option value="365">1 Tahun</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Users with Subscription */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-text-muted bg-gray-100 px-2 py-1 rounded-full">
                dari {data?.summary?.totalUsers ?? 0} user
              </span>
            </div>
            <p className="text-sm font-medium text-text-secondary mb-1">User Berlangganan</p>
            <p className="text-3xl font-bold text-text-primary">{data?.summary?.usersWithSubscription ?? 0}</p>
          </div>

          {/* Users without Subscription */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-text-muted bg-gray-100 px-2 py-1 rounded-full">
                dari {data?.summary?.totalUsers ?? 0} user
              </span>
            </div>
            <p className="text-sm font-medium text-text-secondary mb-1">User Gratis</p>
            <p className="text-3xl font-bold text-text-primary">{data?.summary?.usersWithoutSubscription ?? 0}</p>
          </div>

          {/* Total Invoices */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className={cn(
                'flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full',
                (data?.summary?.invoiceGrowth ?? 0) >= 0 ? 'text-success-600 bg-success-50' : 'text-red-600 bg-red-50'
              )}>
                {(data?.summary?.invoiceGrowth ?? 0) >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {Math.abs(data?.summary?.invoiceGrowth ?? 0)}%
              </div>
            </div>
            <p className="text-sm font-medium text-text-secondary mb-1">Total Invoices</p>
            <p className="text-3xl font-bold text-text-primary">{data?.summary?.totalInvoices ?? 0}</p>
          </div>

          {/* Total Revenue */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className={cn(
                'flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full',
                (data?.summary?.revenueGrowth ?? 0) >= 0 ? 'text-success-600 bg-success-50' : 'text-red-600 bg-red-50'
              )}>
                {(data?.summary?.revenueGrowth ?? 0) >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {Math.abs(data?.summary?.revenueGrowth ?? 0)}%
              </div>
            </div>
            <p className="text-sm font-medium text-text-secondary mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-text-primary">{formatCurrency(data?.summary?.totalRevenue ?? 0)}</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invoice Status Breakdown */}
          <div className="card p-5">
            <h2 className="text-lg font-bold text-text-primary mb-5">Status Invoice</h2>
            <div className="space-y-4">
              {data?.invoicesByStatus?.map((status) => (
                <div key={status.status}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn('badge', getStatusColor(status.status))}>
                      {getStatusLabel(status.status)}
                    </span>
                    <span className="text-sm font-bold text-text-primary">{status.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
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
          <div className="card p-5">
            <h2 className="text-lg font-bold text-text-primary mb-5">Top Klien</h2>
            <div className="space-y-3">
              {data?.topClients?.slice(0, 5).map((client, index) => (
                <div key={client.clientEmail} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold',
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                      index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                      'bg-gradient-to-br from-gray-200 to-gray-400'
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary text-sm">{client.clientEmail}</p>
                      <p className="text-xs text-text-muted">{client.invoiceCount} invoice</p>
                    </div>
                  </div>
                  <p className="font-bold text-text-primary text-sm">{formatCurrency(client.totalRevenue)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="card p-5">
          <h2 className="text-lg font-bold text-text-primary mb-5">Pendapatan per Bulan</h2>
          <div className="space-y-3">
            {data?.revenueByMonth?.slice(0, 6).map((item, index) => {
              const revenue = Number(item.revenue)
              const month = new Date(item.month as string).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
              return (
                <div key={`revenue-${item.month as string}-${index}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-secondary">{month}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-muted">{Number(item.count)} invoice</span>
                      <span className="font-bold text-text-primary text-sm">{formatCurrency(revenue)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
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
        <div className="card p-5">
          <h2 className="text-lg font-bold text-text-primary mb-5">Pertumbuhan User</h2>
          <div className="space-y-3">
            {data?.usersByMonth?.slice(0, 6).map((item, index) => {
              const count = Number(item.count)
              const month = new Date(item.month as string).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
              return (
                <div key={`users-${item.month as string}-${index}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-secondary">{month}</span>
                    <span className="font-bold text-text-primary text-sm">{count} user baru</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
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

        {/* Tables Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="card p-5">
            <h2 className="text-lg font-bold text-text-primary mb-5">User Terbaru</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="table-header">Nama</th>
                    <th className="table-header">Email</th>
                    <th className="table-header">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recentUsers?.slice(0, 5).map((user) => (
                    <tr key={user.id} className="table-row">
                      <td className="table-cell">
                        <p className="font-medium text-text-primary">{user.name || '-'}</p>
                      </td>
                      <td className="table-cell">
                        <p className="text-text-secondary text-sm">{user.email}</p>
                      </td>
                      <td className="table-cell">
                        <p className="text-text-muted text-sm">{formatDate(user.createdAt)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="card p-5">
            <h2 className="text-lg font-bold text-text-primary mb-5">Invoice Terbaru</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="table-header">No. Invoice</th>
                    <th className="table-header">Klien</th>
                    <th className="table-header">Total</th>
                    <th className="table-header">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recentInvoices?.slice(0, 5).map((invoice) => (
                    <tr key={invoice.id} className="table-row">
                      <td className="table-cell">
                        <p className="font-medium text-text-primary">{invoice.invoiceNumber}</p>
                      </td>
                      <td className="table-cell">
                        <p className="text-text-secondary text-sm">{invoice.clientName}</p>
                      </td>
                      <td className="table-cell">
                        <p className="font-bold text-text-primary text-sm">{formatCurrency(invoice.total)}</p>
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
      </div>
    </AdminLayout>
  )
}
