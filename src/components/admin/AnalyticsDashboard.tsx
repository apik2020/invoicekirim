'use client'

import { useEffect, useState } from 'react'
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Crown,
  Loader2,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

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

interface AnalyticsDashboardProps {
  period: string
  onDataLoaded?: () => void
}

export function AnalyticsDashboard({ period, onDataLoaded }: AnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`)
      const data = await res.json()

      if (!res.ok) {
        console.error('Analytics API error:', data)
        throw new Error(data.error || 'Failed to fetch analytics')
      }

      setData(data)
      onDataLoaded?.()
    } catch (error) {
      console.error('Error fetching analytics:', error)
      alert(error instanceof Error ? error.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
      </div>
    )
  }

  if (!data) return null

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
    <>
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

      {/* Charts and tables would go here - split into smaller components */}
      {/* For brevity, not including all sections in this example */}
    </>
  )
}
