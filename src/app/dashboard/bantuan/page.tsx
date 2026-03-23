'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  HelpCircle,
  Plus,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle,
  MessageCircle,
  ChevronRight,
  Filter,
} from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { formatDate } from '@/lib/utils'

interface Ticket {
  id: string
  subject: string
  description: string
  category: string
  priority: string
  status: string
  lastReplyAt: string | null
  createdAt: string
  _count: {
    support_messages: number
  }
}

interface Stats {
  open: number
  inProgress: number
  resolved: number
}

const statusOptions = [
  { value: '', label: 'Semua' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'Dalam Proses' },
  { value: 'waiting_customer', label: 'Menunggu Respon' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

export default function BantuanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<Stats>({ open: 0, inProgress: 0, resolved: 0 })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [statusFilter, setStatusFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchTickets()
  }, [pagination.page, statusFilter])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      if (statusFilter) params.append('status', statusFilter)

      const res = await fetch(`/api/user/support?${params.toString()}`)

      if (res.status === 401) {
        router.push('/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setTickets(data.tickets || [])
        setStats(data.stats || { open: 0, inProgress: 0, resolved: 0 })
        setPagination((prev) => ({
          ...prev,
          ...data.pagination,
        }))
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      open: { bg: 'bg-blue-100', text: 'text-blue-700' },
      in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      waiting_customer: { bg: 'bg-purple-100', text: 'text-purple-700' },
      resolved: { bg: 'bg-green-100', text: 'text-green-700' },
      closed: { bg: 'bg-gray-100', text: 'text-gray-700' },
    }

    const labels: Record<string, string> = {
      open: 'Open',
      in_progress: 'Dalam Proses',
      waiting_customer: 'Menunggu Respon',
      resolved: 'Resolved',
      closed: 'Closed',
    }

    const style = styles[status] || styles.open

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {labels[status] || status}
      </span>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      normal: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700',
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority] || styles.normal}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    )
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: 'Pertanyaan Umum',
      billing: 'Pembayaran & Tagihan',
      technical: 'Masalah Teknis',
      feature_request: 'Permintaan Fitur',
    }
    return labels[category] || category
  }

  return (
    <DashboardLayout title="Bantuan">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pusat Bantuan</h1>
          <p className="text-gray-500 mt-1">Kirim pertanyaan atau laporkan masalah kepada tim support</p>
        </div>
        <Link
          href="/dashboard/bantuan/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Buat Tiket Baru
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tiket Open</p>
              <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Dalam Proses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Daftar Tiket</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setStatusFilter(option.value)
                    setPagination((prev) => ({ ...prev, page: 1 }))
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === option.value
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

      {/* Tickets List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
            <p className="mt-2 text-gray-500">Memuat tiket...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Belum ada tiket</h3>
            <p className="text-gray-500 mb-4">
              Anda belum pernah membuat tiket bantuan
            </p>
            <Link
              href="/dashboard/bantuan/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Buat Tiket Baru
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/dashboard/bantuan/${ticket.id}`}
                className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 truncate">{ticket.subject}</h4>
                    {getPriorityBadge(ticket.priority)}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-1">{ticket.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-400">
                      {formatDate(ticket.createdAt)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {getCategoryLabel(ticket.category)}
                    </span>
                    {ticket._count.support_messages > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <MessageCircle className="w-3 h-3" />
                        {ticket._count.support_messages} pesan
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(ticket.status)}
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} tiket
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sebelumnya
              </button>
              <span className="text-sm text-gray-700">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
