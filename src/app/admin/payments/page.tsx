'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import {
  Search,
  Download,
  RefreshCw,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AdminLayout } from '@/components/admin/AdminLayout'
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
  } | null
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

function PaymentsContent() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PaymentData | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [status, debouncedSearch])

  const fetchPayments = useCallback(async () => {
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
    } finally {
      setLoading(false)
    }
  }, [page, status, debouncedSearch])

  // Fetch payments when filters change
  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

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
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Daftar Pembayaran</h1>
          <p className="text-text-secondary">Kelola dan pantau semua pembayaran</p>
        </div>

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Total Revenue</p>
                  <p className="text-xl font-bold text-text-primary">
                    {formatCurrency(data.summary.totalRevenue)}
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Completed</p>
                  <p className="text-xl font-bold text-text-primary">{data.summary.completedCount}</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Pending</p>
                  <p className="text-xl font-bold text-text-primary">{data.summary.pendingCount}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search by receipt number, payment ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 text-sm"
              />
            </div>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 text-sm"
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
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-text-secondary hover:bg-gray-50 transition-all text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchPayments}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-text-secondary hover:bg-gray-50 transition-all text-sm"
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
          <div className="card overflow-hidden">
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
                              {payment.user?.name || '-'}
                            </span>
                            <span className="text-xs text-text-muted">
                              {payment.user?.email || '-'}
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
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t border-gray-100 gap-3">
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
    </AdminLayout>
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
                  {payment.user?.name || payment.user?.email || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Email</span>
                <span className="text-sm text-text-primary">{payment.user?.email || '-'}</span>
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
