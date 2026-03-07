'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import {
  CreditCard,
  Search,
  Download,
  RefreshCw,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  LogOut,
  AlertCircle,
  Users,
  Mail,
  Activity,
  LayoutDashboard,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AdminLogo } from '@/components/Logo'
import { cn } from '@/lib/utils'

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  description: string
  stripePaymentIntentId: string | null
  receiptNumber: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface PaymentData {
  payments: Payment[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  summary: {
    totalRevenue: number
    completedCount: number
    pendingCount: number
  }
}

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Payments', href: '/admin/payments', icon: DollarSign },
  { name: 'Email Templates', href: '/admin/email-templates', icon: Mail },
  { name: 'Activity Logs', href: '/admin/activity-logs', icon: Activity },
]

function PaymentsContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PaymentData | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    checkAdminSession()
  }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [status, debouncedSearch])

  // Fetch payments when filters change
  useEffect(() => {
    if (!loading) {
      fetchPayments()
    }
  }, [page, status, debouncedSearch])

  const checkAdminSession = async () => {
    try {
      const res = await fetch('/api/admin/me')
      if (res.ok) {
        fetchPayments()
      } else {
        router.push('/admin/login')
      }
    } catch (error) {
      console.error('Error checking admin session:', error)
      router.push('/admin/login')
    }
  }

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(status && { status }),
        ...(debouncedSearch && { search: debouncedSearch }),
      })

      const res = await fetch(`/api/admin/payments?${params}`)
      const result = await res.json()

      if (res.ok) {
        setData(result)
      } else {
        throw new Error(result.error || 'Failed to fetch payments')
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      alert(error instanceof Error ? error.message : 'Failed to fetch payments')
    } finally {
      setLoading(false)
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      COMPLETED: 'Selesai',
      PENDING: 'Pending',
      FAILED: 'Gagal',
      REFUNDED: 'Refund',
    }
    return labels[status] || status
  }

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      COMPLETED: CheckCircle,
      PENDING: Clock,
      FAILED: XCircle,
      REFUNDED: AlertCircle,
    }
    return icons[status] || Clock
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: 'badge-paid',
      PENDING: 'badge-overdue',
      FAILED: 'bg-red-50 text-red-700',
      REFUNDED: 'bg-gray-100 text-gray-600',
    }
    return colors[status] || 'badge-draft'
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...(status && { status }),
        ...(debouncedSearch && { search: debouncedSearch }),
        export: 'true',
      })

      const res = await fetch(`/api/admin/payments?${params}`)
      const blob = await res.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting payments:', error)
      alert('Failed to export payments')
    }
  }

  return (
    <div className="min-h-screen bg-surface-light">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <AdminLogo size="lg" linkToHome={false} />
            <div className="flex items-center gap-3">
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
            const isActive = item.href === '/admin/payments'
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

        {/* Page Header */}
        <div className="mb-6 sm:mb-8 animate-fade-in-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">Daftar Pembayaran</h1>
          <p className="text-text-secondary text-sm sm:text-base">Kelola dan pantau semua pembayaran</p>
        </div>

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="card p-5 sm:p-6 animate-fade-in-up">
              <div className="flex items-center gap-4">
                <div className="icon-box icon-box-success">
                  <DollarSign className="w-6 h-6 text-success-600" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Total Revenue</p>
                  <p className="text-xl sm:text-2xl font-bold text-text-primary">
                    {formatCurrency(data.summary.totalRevenue)}
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-5 sm:p-6 animate-fade-in-up animation-delay-100">
              <div className="flex items-center gap-4">
                <div className="icon-box icon-box-brand">
                  <CheckCircle className="w-6 h-6 text-brand-600" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Completed</p>
                  <p className="text-xl sm:text-2xl font-bold text-text-primary">{data.summary.completedCount}</p>
                </div>
              </div>
            </div>
            <div className="card p-5 sm:p-6 animate-fade-in-up animation-delay-200">
              <div className="flex items-center gap-4">
                <div className="icon-box icon-box-primary">
                  <Clock className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Pending</p>
                  <p className="text-xl sm:text-2xl font-bold text-text-primary">{data.summary.pendingCount}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card p-4 sm:p-6 mb-6 sm:mb-8 animate-fade-in-up animation-delay-100">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search by receipt number, payment ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 text-sm"
              />
            </div>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 text-sm"
            >
              <option value="">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-text-secondary hover:bg-gray-50 transition-all text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchPayments}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-text-secondary hover:bg-gray-50 transition-all text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Payments Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-brand-500 animate-spin" />
          </div>
        ) : (
          <div className="card overflow-hidden animate-fade-in-up animation-delay-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="table-header">Date</th>
                    <th className="table-header">Receipt</th>
                    <th className="table-header">User</th>
                    <th className="table-header">Amount</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.payments.map((payment) => {
                    const StatusIcon = getStatusIcon(payment.status)
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="table-cell text-sm">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="table-cell">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-text-primary">
                              {payment.receiptNumber || '-'}
                            </span>
                            {payment.stripePaymentIntentId && (
                              <span className="text-xs text-text-muted">
                                {payment.stripePaymentIntentId.slice(0, 20)}...
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-text-primary">
                              {payment.user.name || '-'}
                            </span>
                            <span className="text-xs text-text-muted">
                              {payment.user.email}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell text-sm font-semibold text-text-primary">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="table-cell">
                          <span className={cn('badge', getStatusColor(payment.status))}>
                            <StatusIcon className="w-3 h-3" />
                            {getStatusLabel(payment.status)}
                          </span>
                        </td>
                        <td className="table-cell">
                          <button
                            onClick={() => {
                              setSelectedPayment(payment)
                              setShowDetailModal(true)
                            }}
                            className="text-brand-500 hover:text-brand-600 text-sm font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-100 gap-3">
                <p className="text-sm text-text-secondary">
                  Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                  {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                  {data.pagination.total} payments
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={data.pagination.page === 1}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-text-secondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-text-secondary">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                    disabled={data.pagination.page === data.pagination.totalPages}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-text-secondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Detail Modal */}
      {showDetailModal && selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedPayment(null)
          }}
          onRefresh={fetchPayments}
        />
      )}
    </div>
  )
}

// Payment Detail Modal Component
function PaymentDetailModal({
  payment,
  onClose,
  onRefresh,
}: {
  payment: Payment
  onClose: () => void
  onRefresh: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')

  const handleRefund = async () => {
    if (!confirm(`Are you sure you want to refund this payment?`)) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/payments/${payment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refund',
          refundAmount: refundAmount ? parseFloat(refundAmount) : undefined,
          refundReason,
        }),
      })

      if (res.ok) {
        alert('Payment refunded successfully')
        onClose()
        onRefresh()
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Failed to refund payment')
      }
    } catch (error) {
      console.error('Error refunding payment:', error)
      alert(error instanceof Error ? error.message : 'Failed to refund payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary">Payment Details</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Amount */}
            <div className="p-4 bg-success-50 rounded-xl border border-success-200">
              <p className="text-sm text-text-secondary mb-1">Amount</p>
              <p className="text-3xl font-bold text-text-primary">
                {formatCurrency(payment.amount)}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Status</span>
                <span className="text-sm font-semibold text-text-primary">{payment.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Receipt Number</span>
                <span className="text-sm font-semibold text-text-primary">
                  {payment.receiptNumber || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Date</span>
                <span className="text-sm font-semibold text-text-primary">
                  {formatDate(payment.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">User</span>
                <span className="text-sm font-semibold text-text-primary">
                  {payment.user.name || payment.user.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Email</span>
                <span className="text-sm text-text-primary">{payment.user.email}</span>
              </div>
              {payment.description && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-sm text-text-secondary mb-1">Description</p>
                  <p className="text-sm text-text-primary">{payment.description}</p>
                </div>
              )}
            </div>

            {/* Refund Section - Only for completed payments */}
            {payment.status === 'COMPLETED' && payment.stripePaymentIntentId && (
              <div className="pt-6 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Process Refund</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">
                      Refund Amount (leave empty for full refund)
                    </label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder={payment.amount.toString()}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">
                      Reason
                    </label>
                    <input
                      type="text"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Reason for refund..."
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                  </div>
                  <button
                    onClick={handleRefund}
                    disabled={loading}
                    className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? 'Processing...' : 'Process Refund'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-light flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-brand-500 animate-spin" />
      </div>
    }>
      <PaymentsContent />
    </Suspense>
  )
}
