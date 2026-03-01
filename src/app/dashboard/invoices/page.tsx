'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { FileText, Plus, Search, Filter, Trash2, Eye, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import DashboardHeader from '@/components/DashboardHeader'
import { StatusFilter } from '@/components/dashboard/StatusFilter'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  price: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  date: string
  dueDate: string | null
  clientName: string
  clientEmail: string
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELED'
  total: number
  items: InvoiceItem[]
}

export default function InvoicesPage() {
  const router = useRouter()
  const sessionResult = useSession()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [counts, setCounts] = useState({
    ALL: 0,
    DRAFT: 0,
    SENT: 0,
    PAID: 0,
    OVERDUE: 0,
    CANCELED: 0,
  })

  useEffect(() => {
    setMounted(true)

    if (!sessionResult || sessionResult.status === 'unauthenticated') {
      router.push('/login')
    } else if (sessionResult.status === 'authenticated') {
      fetchInvoices()
    }
  }, [sessionResult, router])

  const fetchInvoices = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.append('status', statusFilter)
      if (searchQuery) params.append('search', searchQuery)

      const [invoicesRes, allRes] = await Promise.all([
        fetch(`/api/invoices?${params.toString()}`),
        fetch('/api/invoices'), // Get all for counts
      ])

      if (!invoicesRes.ok || !allRes.ok) throw new Error('Gagal mengambil invoice')

      const invoicesData = await invoicesRes.json()
      const allData = await allRes.json()

      setInvoices(invoicesData.invoices || [])

      // Calculate counts
      const allInvoices = allData.invoices || []
      setCounts({
        ALL: allInvoices.length,
        DRAFT: allInvoices.filter((inv: Invoice) => inv.status === 'DRAFT').length,
        SENT: allInvoices.filter((inv: Invoice) => inv.status === 'SENT').length,
        PAID: allInvoices.filter((inv: Invoice) => inv.status === 'PAID').length,
        OVERDUE: allInvoices.filter((inv: Invoice) => inv.status === 'OVERDUE').length,
        CANCELED: allInvoices.filter((inv: Invoice) => inv.status === 'CANCELED').length,
      })
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (sessionResult?.status === 'authenticated') {
      const delayedFetch = setTimeout(() => {
        fetchInvoices()
      }, 500)

      return () => clearTimeout(delayedFetch)
    }
  }, [statusFilter, searchQuery, sessionResult?.status])

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus invoice ini?')) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menghapus invoice')
      }

      setInvoices(invoices.filter((inv) => inv.id !== id))
    } catch (error: any) {
      alert(error.message)
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      DRAFT: 'badge-orange',
      SENT: 'badge-yellow',
      PAID: 'badge-lime',
      OVERDUE: 'badge-pink',
      CANCELED: 'bg-gray-100 text-gray-600 line-through',
    }

    const labels = {
      DRAFT: 'Draft',
      SENT: 'Terkirim',
      PAID: 'Lunas',
      OVERDUE: 'Terlambat',
      CANCELED: 'Dibatalkan',
    }

    return (
      <span
        className={`px-3 py-1 rounded-xl text-xs font-bold ${
          styles[status as keyof typeof styles]
        }`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  if (!mounted || loading || !sessionResult || sessionResult.status === 'loading') {
    return (
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat invoice...</p>
        </div>
      </div>
    )
  }

  if (sessionResult.status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-fresh-bg">
      {/* Header */}
      <DashboardHeader
        title="Invoice Saya"
        showBackButton={true}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Saya</h1>
            <p className="text-gray-600">
              Kelola semua invoice bisnismu di satu tempat
            </p>
          </div>

          {/* Search, Filters and Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari invoice..."
                className="w-full sm:w-64 pl-12 pr-4 py-3 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-auto">
              <StatusFilter
                currentFilter={statusFilter}
                onFilterChange={setStatusFilter}
                counts={counts}
              />
            </div>

            {/* Add Invoice Button */}
            <Link
              href="/dashboard/invoices/create"
              className="flex items-center justify-center gap-2 px-6 py-3 text-white font-bold rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 transition-all shadow-lg shadow-orange-500/30"
            >
              <Plus size={18} />
              <span>Buat Invoice</span>
            </Link>
          </div>
        </div>

        {/* Invoice List */}
        {invoices.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-24 h-24 rounded-2xl icon-box-orange mx-auto mb-6">
              <FileText className="w-12 h-12 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Belum ada invoice
            </h3>
            <p className="text-gray-600 mb-8">
              Buat invoice pertamamu sekarang dan mulai kirim ke klien
            </p>
            <Link
              href="/dashboard/invoices/create"
              className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl btn-primary"
            >
              <Plus size={18} />
              Buat Invoice Pertama
            </Link>
          </div>
        ) : (
          <div className="card p-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-orange-100">
                    <th className="text-left py-3 text-sm font-bold text-gray-600">Invoice</th>
                    <th className="text-left py-3 text-sm font-bold text-gray-600">Klien</th>
                    <th className="text-left py-3 text-sm font-bold text-gray-600">Tanggal</th>
                    <th className="text-left py-3 text-sm font-bold text-gray-600">Status</th>
                    <th className="text-right py-3 text-sm font-bold text-gray-600">Total</th>
                    <th className="text-right py-3 text-sm font-bold text-gray-600">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-orange-50 hover:bg-orange-50/50 transition-colors">
                      <td className="py-4">
                        <div>
                          <div className="font-bold text-gray-900">{invoice.invoiceNumber}</div>
                          {invoice.dueDate && (
                            <div className="text-xs text-gray-500 mt-1">
                              Jatuh tempo: {formatDate(invoice.dueDate)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <div>
                          <div className="text-gray-700">{invoice.clientName}</div>
                          <div className="text-xs text-gray-500">{invoice.clientEmail}</div>
                        </div>
                      </td>
                      <td className="py-4 text-gray-600">
                        {formatDate(invoice.date)}
                      </td>
                      <td className="py-4">{getStatusBadge(invoice.status)}</td>
                      <td className="py-4 text-right font-bold text-gray-900">
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/invoices/${invoice.id}`}
                            className="p-2 text-gray-700 rounded-xl hover:bg-orange-50 transition-colors"
                            title="Lihat"
                          >
                            <Eye size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(invoice.id)}
                            disabled={deletingId === invoice.id || invoice.status !== 'DRAFT' && invoice.status !== 'CANCELED'}
                            className="p-2 text-pink-600 rounded-xl hover:bg-pink-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={invoice.status === 'DRAFT' || invoice.status === 'CANCELED' ? 'Hapus Invoice' : `Tidak dapat menghapus invoice dengan status ${invoice.status}`}
                          >
                            {deletingId === invoice.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
