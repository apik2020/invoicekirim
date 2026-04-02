'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Crown,
  Download,
  Loader2,
} from 'lucide-react'

interface ReportData {
  overview: {
    totalUsers: number
    newUsers: number
    totalInvoices: number
    paidInvoices: number
    totalRevenue: number
    currentPeriodRevenue: number
    previousPeriodRevenue: number
    revenueGrowth: string
    subscriptions: number
    activeSubscriptions: number
  }
  charts: {
    monthlyRevenue: Array<{ month: string; year: number; revenue: number }>
    userGrowth: Array<{ month: string; year: number; users: number }>
  }
  planDistribution: Array<{ plan: string; count: number }>
}

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    fetchReports()
  }, [period])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/reports?period=${period}`)
      const result = await res.json()

      if (res.ok) {
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const exportToCSV = () => {
    if (!data) return

    // Create CSV content
    let csv = 'Report,Value\n'
    csv += `Total Users,${data.overview.totalUsers}\n`
    csv += `New Users (${period}),${data.overview.newUsers}\n`
    csv += `Total Invoices,${data.overview.totalInvoices}\n`
    csv += `Paid Invoices (${period}),${data.overview.paidInvoices}\n`
    csv += `Total Revenue,${data.overview.totalRevenue}\n`
    csv += `Current Period Revenue,${data.overview.currentPeriodRevenue}\n`
    csv += `Revenue Growth,${data.overview.revenueGrowth}%\n`
    csv += `Total Subscriptions,${data.overview.subscriptions}\n`
    csv += `Active Subscriptions,${data.overview.activeSubscriptions}\n`

    // Download
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `notabener-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getGrowthIcon = (growth: number) => {
    if (growth >= 0) {
      return <TrendingUp className="w-4 h-4 text-green-500" />
    }
    return <TrendingDown className="w-4 h-4 text-red-500" />
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Reports & Analytics</h1>
            <p className="text-text-secondary">Analisis performa bisnis Anda</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 focus:border-brand-500 focus:outline-none"
            >
              <option value="day">Hari Ini</option>
              <option value="week">Minggu Ini</option>
              <option value="month">Bulan Ini</option>
              <option value="year">Tahun Ini</option>
            </select>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        ) : data ? (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">{data.overview.totalUsers}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      +{data.overview.newUsers} baru periode ini
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(data.overview.totalRevenue)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {getGrowthIcon(parseFloat(data.overview.revenueGrowth))}
                      <span className={`text-sm ${parseFloat(data.overview.revenueGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.overview.revenueGrowth}%
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Invoices</p>
                    <p className="text-3xl font-bold text-gray-900">{data.overview.totalInvoices}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {data.overview.paidInvoices} paid this period
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Subscriptions</p>
                    <p className="text-3xl font-bold text-gray-900">{data.overview.activeSubscriptions}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      dari {data.overview.subscriptions} total
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Revenue</h3>
                <div className="h-64 flex items-end gap-2">
                  {data.charts.monthlyRevenue.map((item, i) => {
                    const maxRevenue = Math.max(...data.charts.monthlyRevenue.map((d) => d.revenue), 1)
                    const height = (item.revenue / maxRevenue) * 100
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full bg-gradient-to-t from-brand-500 to-brand-400 rounded-t transition-all hover:from-brand-600 hover:to-brand-500"
                          style={{ height: `${Math.max(height, 2)}%` }}
                          title={formatCurrency(item.revenue)}
                        />
                        <span className="text-xs text-gray-500">{item.month}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* User Growth Chart */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">User Growth</h3>
                <div className="h-64 flex items-end gap-2">
                  {data.charts.userGrowth.map((item, i) => {
                    const maxUsers = Math.max(...data.charts.userGrowth.map((d) => d.users), 1)
                    const height = (item.users / maxUsers) * 100
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-600 hover:to-blue-500"
                          style={{ height: `${Math.max(height, 2)}%` }}
                          title={`${item.users} users`}
                        />
                        <span className="text-xs text-gray-500">{item.month}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Plan Distribution */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Plan Distribution</h3>
              <div className="flex gap-6">
                {data.planDistribution.map((plan) => {
                  const total = data.planDistribution.reduce((acc, p) => acc + p.count, 0)
                  const percentage = ((plan.count / total) * 100).toFixed(1)
                  return (
                    <div key={plan.plan} className="flex-1 p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{plan.plan}</span>
                        <span className="text-sm text-gray-500">{percentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${plan.plan === 'PRO' ? 'bg-brand-500' : 'bg-gray-400'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{plan.count}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  )
}
