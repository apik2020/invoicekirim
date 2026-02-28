'use client'

import { useState, useEffect } from 'react'
import { Download, FileText, Calendar, Filter, X } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  receiptNumber: string | null
  receiptUrl: string | null
  createdAt: string
  stripePaymentId: string
}

interface PaymentHistoryProps {
  userId?: string
}

export function PaymentHistory({ userId }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchPayments()
  }, [page, startDate, endDate])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })

      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const res = await fetch(`/api/billing/payments?${params}`)
      const data = await res.json()

      if (res.ok) {
        setPayments(data.payments)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadReceipt = async (paymentId: string) => {
    try {
      // First ensure receipt exists
      await fetch(`/api/payments/${paymentId}/receipt`, {
        method: 'POST',
      })

      // Open receipt in new tab
      window.open(`/api/payments/${paymentId}/receipt`, '_blank')
    } catch (error) {
      console.error('Error downloading receipt:', error)
      alert('Gagal mengunduh receipt')
    }
  }

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pending',
      COMPLETED: 'Lunas',
      FAILED: 'Gagal',
      REFUNDED: 'Refund',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      COMPLETED: 'bg-lime-100 text-lime-700',
      FAILED: 'bg-pink-100 text-pink-700',
      REFUNDED: 'bg-gray-100 text-gray-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Riwayat Pembayaran</h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-200 text-sm hover:bg-orange-50 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-orange-200 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-orange-200 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Reset Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payments Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Belum ada riwayat pembayaran</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-orange-100">
                <th className="text-left py-3 text-sm font-bold text-gray-600">
                  Tanggal
                </th>
                <th className="text-left py-3 text-sm font-bold text-gray-600">
                  Jumlah
                </th>
                <th className="text-left py-3 text-sm font-bold text-gray-600">
                  Status
                </th>
                <th className="text-left py-3 text-sm font-bold text-gray-600">
                  Receipt
                </th>
                <th className="text-right py-3 text-sm font-bold text-gray-600">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-orange-50">
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {formatDate(payment.createdAt)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </span>
                  </td>
                  <td className="py-4">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${getStatusColor(
                        payment.status
                      )}`}
                    >
                      {getStatusLabel(payment.status)}
                    </span>
                  </td>
                  <td className="py-4">
                    {payment.receiptNumber ? (
                      <span className="text-sm text-gray-600 font-mono">
                        {payment.receiptNumber}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-4 text-right">
                    {payment.status === 'COMPLETED' && (
                      <button
                        onClick={() => downloadReceipt(payment.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-orange-600 hover:bg-orange-50 transition-colors ml-auto"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Receipt</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-orange-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-50 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Halaman {page} dari {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg border border-orange-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
