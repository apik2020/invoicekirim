'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Receipt,
  Search,
  Filter,
  Loader2,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { ClientDashboardLayout } from '@/components/ClientDashboardLayout'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Invoice {
  id: string
  invoiceNumber: string
  date: string
  dueDate: string | null
  companyName: string
  total: number
  status: string
  paidAt: string | null
  accessToken: string
  items: any[]
}

const statusOptions = [
  { value: 'ALL', label: 'Semua' },
  { value: 'SENT', label: 'Tertunda' },
  { value: 'PAID', label: 'Lunas' },
  { value: 'OVERDUE', label: 'Terlambat' },
]

export default function ClientInvoicesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', pagination.page.toString())
        params.set('limit', pagination.limit.toString())
        if (status !== 'ALL') params.set('status', status)
        if (search) params.set('search', search)

        const res = await fetch(`/api/client/invoices?${params.toString()}`)

        if (res.status === 401) {
          router.push('/client/auth/login')
          return
        }

        if (res.ok) {
          const data = await res.json()
          setInvoices(data.invoices || [])
          setPagination(prev => ({
            ...prev,
            ...data.pagination,
          }))
        }
      } catch (error) {
        console.error('Failed to fetch invoices:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [pagination.page, pagination.limit, status, router])

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-700',
      SENT: 'bg-teal-100 text-teal-700',
      PAID: 'bg-green-100 text-green-700',
      OVERDUE: 'bg-red-100 text-red-700',
      CANCELED: 'bg-gray-100 text-gray-700',
    }

    const labels: Record<string, string> = {
      DRAFT: 'Draft',
      SENT: 'Tertunda',
      PAID: 'Lunas',
      OVERDUE: 'Terlambat',
      CANCELED: 'Dibatalkan',
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.DRAFT}`}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <ClientDashboardLayout title="Invoice Saya">
      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Cari invoice..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="px-4 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors"
            >
              Cari
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setStatus(option.value)
                    setPagination(prev => ({ ...prev, page: 1 }))
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    status === option.value
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
            <p className="mt-2 text-gray-500">Memuat invoice...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Belum ada invoice</h3>
            <p className="text-gray-500">
              Invoice yang dikirim ke Anda akan muncul di sini
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Dari
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Jatuh Tempo
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-500">{invoice.items?.length || 0} item</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900">{invoice.companyName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900">{formatDate(invoice.date)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900">
                          {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(invoice.total)}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/invoice/${invoice.accessToken}`}
                            className="p-2 text-gray-500 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Lihat Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} invoice
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-700">
                    Halaman {pagination.page} dari {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ClientDashboardLayout>
  )
}
