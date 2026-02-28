'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  CreditCard,
  Search,
  Filter,
  Download,
  RefreshCw,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpDown,
  Loader2,
  LogOut,
  Eye,
  AlertCircle,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

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

function PaymentsContent() {
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
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

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/admin/login')
      return
    }

    if (sessionStatus === 'authenticated') {
      fetchPayments()
    }
  }, [sessionStatus, page, status, debouncedSearch])

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
      COMPLETED: 'text-lime-600 bg-lime-50',
      PENDING: 'text-orange-600 bg-orange-50',
      FAILED: 'text-red-600 bg-red-50',
      REFUNDED: 'text-gray-600 bg-gray-50',
    }
    return colors[status] || 'text-gray-600 bg-gray-50'
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

  if (sessionStatus === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-fresh-bg">
      {/* Header */}
      <div className="bg-white border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin - Payments</h1>
              <p className="text-gray-600 text-sm">Manage & monitor all payments</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="icon-box icon-box-lime">
                  <DollarSign className="w-6 h-6 text-lime-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(data.summary.totalRevenue)}
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="icon-box icon-box-lime">
                  <CheckCircle className="w-6 h-6 text-lime-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{data.summary.completedCount}</p>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="icon-box icon-box-orange">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{data.summary.pendingCount}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by receipt number, payment ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:outline-none"
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
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchPayments}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Payments Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Date</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Receipt</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">User</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.payments.map((payment) => {
                    const StatusIcon = getStatusIcon(payment.status)
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {payment.receiptNumber || '-'}
                            </span>
                            {payment.stripePaymentIntentId && (
                              <span className="text-xs text-gray-400">
                                {payment.stripePaymentIntentId.slice(0, 20)}...
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {payment.user.name || '-'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {payment.user.email}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm font-semibold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}>
                            <StatusIcon className="w-3 h-3" />
                            {getStatusLabel(payment.status)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => {
                              setSelectedPayment(payment)
                              setShowDetailModal(true)
                            }}
                            className="text-orange-600 hover:text-orange-700 text-sm font-medium"
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
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                  {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                  {data.pagination.total} payments
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={data.pagination.page === 1}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                    disabled={data.pagination.page === data.pagination.totalPages}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Amount */}
            <div className="p-4 bg-lime-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-1">Amount</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(payment.amount)}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className="text-sm font-semibold text-gray-900">{payment.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Receipt Number</span>
                <span className="text-sm font-semibold text-gray-900">
                  {payment.receiptNumber || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Date</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatDate(payment.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">User</span>
                <span className="text-sm font-semibold text-gray-900">
                  {payment.user.name || payment.user.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Email</span>
                <span className="text-sm text-gray-900">{payment.user.email}</span>
              </div>
              {payment.description && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Description</p>
                  <p className="text-sm text-gray-900">{payment.description}</p>
                </div>
              )}
            </div>

            {/* Refund Section - Only for completed payments */}
            {payment.status === 'COMPLETED' && payment.stripePaymentIntentId && (
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Refund</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Refund Amount (leave empty for full refund)
                    </label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder={payment.amount.toString()}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Reason
                    </label>
                    <input
                      type="text"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Reason for refund..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleRefund}
                    disabled={loading}
                    className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-orange-600 animate-spin" />
      </div>
    }>
      <PaymentsContent />
    </Suspense>
  )
}
