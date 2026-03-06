'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { FileText, Plus, Search, Trash2, Eye, Loader2, Download, Send } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DashboardLayout } from '@/components/DashboardLayout'

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

const statusConfig = {
  DRAFT: { label: 'Draft', className: 'status-draft' },
  SENT: { label: 'Terkirim', className: 'status-sent' },
  PAID: { label: 'Lunas', className: 'status-paid' },
  OVERDUE: { label: 'Terlambat', className: 'status-overdue' },
  CANCELED: { label: 'Dibatalkan', className: 'bg-gray-100 text-gray-600' },
}

// Helper function to calculate days overdue
const getDaysOverdue = (dueDate: string | null): number | null => {
  if (!dueDate) return null
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  const diffTime = today.getTime() - due.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : null
}

// Helper function to get effective status (considering due date)
const getEffectiveStatus = (invoice: Invoice): 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELED' => {
  // If already PAID, CANCELED, or OVERDUE, keep the status
  if (invoice.status === 'PAID' || invoice.status === 'CANCELED' || invoice.status === 'OVERDUE') {
    return invoice.status
  }

  // If DRAFT, keep as DRAFT
  if (invoice.status === 'DRAFT') {
    return 'DRAFT'
  }

  // If SENT and past due date, show as OVERDUE
  if (invoice.status === 'SENT' && invoice.dueDate) {
    const daysOverdue = getDaysOverdue(invoice.dueDate)
    if (daysOverdue && daysOverdue > 0) {
      return 'OVERDUE'
    }
  }

  return invoice.status
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
      // For OVERDUE filter, we need to fetch both SENT and OVERDUE invoices
      // then filter client-side by effective status
      let invoicesRes;
      if (statusFilter === 'OVERDUE') {
        // Fetch all invoices and filter client-side for effective OVERDUE status
        const params = new URLSearchParams()
        if (searchQuery) params.append('search', searchQuery)
        invoicesRes = await fetch(`/api/invoices?${params.toString()}`)
      } else {
        const params = new URLSearchParams()
        if (statusFilter !== 'ALL') params.append('status', statusFilter)
        if (searchQuery) params.append('search', searchQuery)
        invoicesRes = await fetch(`/api/invoices?${params.toString()}`)
      }

      const allRes = await fetch('/api/invoices')

      if (!invoicesRes.ok || !allRes.ok) throw new Error('Gagal mengambil invoice')

      const invoicesData = await invoicesRes.json()
      const allData = await allRes.json()

      // For OVERDUE filter, filter by effective status
      let filteredInvoices = invoicesData.invoices || []
      if (statusFilter === 'OVERDUE') {
        filteredInvoices = filteredInvoices.filter((inv: Invoice) => getEffectiveStatus(inv) === 'OVERDUE')
      }
      setInvoices(filteredInvoices)

      const allInvoices = allData.invoices || []
      setCounts({
        ALL: allInvoices.length,
        DRAFT: allInvoices.filter((inv: Invoice) => getEffectiveStatus(inv) === 'DRAFT').length,
        SENT: allInvoices.filter((inv: Invoice) => getEffectiveStatus(inv) === 'SENT').length,
        PAID: allInvoices.filter((inv: Invoice) => getEffectiveStatus(inv) === 'PAID').length,
        OVERDUE: allInvoices.filter((inv: Invoice) => getEffectiveStatus(inv) === 'OVERDUE').length,
        CANCELED: allInvoices.filter((inv: Invoice) => getEffectiveStatus(inv) === 'CANCELED').length,
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

  const getStatusBadge = (invoice: Invoice) => {
    const effectiveStatus = getEffectiveStatus(invoice)
    const config = statusConfig[effectiveStatus]
    const daysOverdue = effectiveStatus === 'OVERDUE' ? getDaysOverdue(invoice.dueDate) : null

    return (
      <div className="flex flex-col gap-1">
        <span className={`status-pill ${config?.className || ''}`}>
          {config?.label || effectiveStatus}
        </span>
        {daysOverdue && (
          <span className="text-xs text-primary-500 font-medium">
            {daysOverdue} hari terlambat
          </span>
        )}
      </div>
    )
  }

  if (!mounted || loading || !sessionResult || sessionResult.status === 'loading') {
    return (
      <DashboardLayout title="Invoice">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-brand-500 animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Memuat invoice...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (sessionResult.status === 'unauthenticated') {
    return null
  }

  return (
    <DashboardLayout title="Invoice">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-brand-500 mb-2">Invoice Saya</h1>
            <p className="text-text-secondary">
              Kelola semua invoice bisnismu di satu tempat
            </p>
          </div>
          <Link
            href="/dashboard/invoices/create"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 btn-primary font-bold"
          >
            <Plus size={18} />
            <span>Buat Invoice</span>
          </Link>
        </div>

        {/* Filters Bar */}
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari invoice..."
                className="input pl-12"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
              {[
                { key: 'ALL', label: 'Semua' },
                { key: 'DRAFT', label: 'Draft' },
                { key: 'SENT', label: 'Terkirim' },
                { key: 'PAID', label: 'Lunas' },
                { key: 'OVERDUE', label: 'Terlambat' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    statusFilter === filter.key
                      ? 'bg-brand-500 text-white'
                      : 'bg-surface-light text-text-secondary hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                  {counts[filter.key as keyof typeof counts] > 0 && (
                    <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                      statusFilter === filter.key
                        ? 'bg-white/20'
                        : 'bg-gray-300'
                    }`}>
                      {counts[filter.key as keyof typeof counts]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      {invoices.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-24 h-24 rounded-2xl icon-box-brand mx-auto mb-6">
            <FileText className="w-12 h-12 text-brand-500" />
          </div>
          <h3 className="text-2xl font-bold text-brand-500 mb-3">
            Belum ada invoice
          </h3>
          <p className="text-text-secondary mb-8 max-w-md mx-auto">
            Buat invoice pertamamu sekarang dan mulai kirim ke klien
          </p>
          <Link
            href="/dashboard/invoices/create"
            className="inline-flex items-center gap-2 px-6 py-3 btn-primary font-bold"
          >
            <Plus size={18} />
            Buat Invoice Pertama
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-light">
                <tr>
                  <th className="table-header">Invoice</th>
                  <th className="table-header">Klien</th>
                  <th className="table-header">Tanggal</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Total</th>
                  <th className="table-header text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="table-row">
                    <td className="table-cell">
                      <div>
                        <div className="font-bold text-text-primary">{invoice.invoiceNumber}</div>
                        {invoice.dueDate && (
                          <div className="text-xs text-text-muted mt-1">
                            Jatuh tempo: {formatDate(invoice.dueDate)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div>
                        <div className="text-text-primary">{invoice.clientName}</div>
                        <div className="text-xs text-text-muted">{invoice.clientEmail}</div>
                      </div>
                    </td>
                    <td className="table-cell text-text-secondary">
                      {formatDate(invoice.date)}
                    </td>
                    <td className="table-cell">{getStatusBadge(invoice)}</td>
                    <td className="table-cell text-right font-bold text-text-primary">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="p-2 text-brand-500 rounded-lg hover:bg-brand-50 transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye size={18} />
                        </Link>
                        <Link
                          href={`/dashboard/invoices/${invoice.id}?print=true`}
                          className="p-2 text-secondary-600 rounded-lg hover:bg-secondary-50 transition-colors"
                          title="Download PDF"
                        >
                          <Download size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          disabled={deletingId === invoice.id || (invoice.status !== 'DRAFT' && invoice.status !== 'CANCELED')}
                          className="p-2 text-primary-500 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    </DashboardLayout>
  )
}
