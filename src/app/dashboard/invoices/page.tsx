'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { FileText, Plus, Search, Filter, Trash2, Eye, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import DashboardHeader from '@/components/DashboardHeader'

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

      const res = await fetch(`/api/invoices?${params.toString()}`)
      if (!res.ok) throw new Error('Gagal mengambil invoice')

      const data = await res.json()
      setInvoices(data.invoices || [])
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
      DRAFT: 'bg-gray-100 text-slate-light-700',
      SENT: 'bg-teal-100 text-teal-700',
      PAID: 'bg-green-light-100 text-teal-light-700',
      OVERDUE: 'bg-red-100 text-red-700',
      CANCELED: 'bg-gray-100 text-slate-light-700 line-through',
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
      <div className="min-h-screen bg-gray flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-dark animate-spin mx-auto mb-4" />
          <p className="text-slate">Memuat invoice...</p>
        </div>
      </div>
    )
  }

  if (sessionResult.status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray">
      {/* Header */}
      <DashboardHeader
        title="Invoice Saya"
        showBackButton={true}
        actions={
          <Link
            href="/dashboard/invoices/create"
            className="flex items-center gap-2 px-5 py-2.5 text-white font-bold rounded-xl btn-primary"
          >
            <Plus size={18} />
            Buat Invoice
          </Link>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="font-bold text-3xl md:text-4xl text-dark mb-2 tracking-tight">
            Invoice Saya
          </h1>
          <p className="text-slate">
            Kelola semua invoice bisnismu di satu tempat
          </p>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari invoice..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
              />
            </div>
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-slate" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
              >
                <option value="ALL">Semua Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Terkirim</option>
                <option value="PAID">Lunas</option>
                <option value="OVERDUE">Terlambat</option>
                <option value="CANCELED">Dibatalkan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoice List */}
        {invoices.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-24 h-24 rounded-2xl icon-box mx-auto mb-6">
              <FileText className="w-12 h-12 text-slate" />
            </div>
            <h3 className="text-2xl font-bold text-dark mb-3">
              Belum ada invoice
            </h3>
            <p className="text-slate mb-8">
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
                  <tr className="border-b border-slate">
                    <th className="text-left py-3 text-sm font-bold text-slate">Invoice</th>
                    <th className="text-left py-3 text-sm font-bold text-slate">Klien</th>
                    <th className="text-left py-3 text-sm font-bold text-slate">Tanggal</th>
                    <th className="text-left py-3 text-sm font-bold text-slate">Status</th>
                    <th className="text-right py-3 text-sm font-bold text-slate">Total</th>
                    <th className="text-right py-3 text-sm font-bold text-slate">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-slate hover:bg-gray transition-colors">
                      <td className="py-4">
                        <div>
                          <div className="font-bold text-dark">{invoice.invoiceNumber}</div>
                          {invoice.dueDate && (
                            <div className="text-xs text-slate mt-1">
                              Jatuh tempo: {formatDate(invoice.dueDate)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <div>
                          <div className="text-slate">{invoice.clientName}</div>
                          <div className="text-xs text-slate">{invoice.clientEmail}</div>
                        </div>
                      </td>
                      <td className="py-4 text-slate">
                        {formatDate(invoice.date)}
                      </td>
                      <td className="py-4">{getStatusBadge(invoice.status)}</td>
                      <td className="py-4 text-right font-bold text-dark">
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/invoices/${invoice.id}`}
                            className="p-2 text-dark rounded-xl hover:bg-gray transition-colors"
                            title="Lihat"
                          >
                            <Eye size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(invoice.id)}
                            disabled={deletingId === invoice.id || invoice.status !== 'DRAFT' && invoice.status !== 'CANCELED'}
                            className="p-2 text-teal-light rounded-xl hover:bg-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
