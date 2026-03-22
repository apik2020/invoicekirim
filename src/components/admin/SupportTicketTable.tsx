'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  ChevronDown,
  Eye,
  Calendar,
  MessageCircle,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  User,
} from 'lucide-react'
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
  userId: string | null
  clientId: string | null
  users: {
    id: string
    name: string | null
    email: string
  } | null
  client: {
    id: string
    name: string
    email: string
  } | null
  _count: {
    support_messages: number
  }
}

interface SupportTicketTableProps {
  onTicketSelect: (ticket: Ticket) => void
}

export function SupportTicketTable({ onTicketSelect }: SupportTicketTableProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    fetchTickets()
  }, [page, debouncedSearch, sortBy, sortOrder, filterStatus, filterPriority])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      })

      if (debouncedSearch) params.append('search', debouncedSearch)
      if (filterStatus) params.append('status', filterStatus)
      if (filterPriority) params.append('priority', filterPriority)

      const res = await fetch(`/api/admin/support?${params}`)
      const data = await res.json()

      if (res.ok) {
        setTickets(data.tickets)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      open: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <AlertCircle className="w-3 h-3" /> },
      in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="w-3 h-3" /> },
      waiting_customer: { bg: 'bg-purple-100', text: 'text-purple-700', icon: <User className="w-3 h-3" /> },
      resolved: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
      closed: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <XCircle className="w-3 h-3" /> },
    }

    const style = styles[status] || styles.open

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${style.bg} ${style.text}`}>
        {style.icon}
        {status.replace('_', ' ').toUpperCase()}
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
      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${styles[priority] || styles.normal}`}>
        {priority.toUpperCase()}
      </span>
    )
  }

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      general: 'bg-gray-100 text-gray-700',
      billing: 'bg-green-100 text-green-700',
      technical: 'bg-blue-100 text-blue-700',
      feature_request: 'bg-purple-100 text-purple-700',
    }

    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${styles[category] || styles.general}`}>
        {category.replace('_', ' ')}
      </span>
    )
  }

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-gray-900">Support Tickets</h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-200 text-sm hover:bg-orange-50 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari ticket berdasarkan subjek, deskripsi, atau user..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-orange-200 focus:border-orange-500 focus:outline-none"
          />
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 rounded-lg border border-orange-200 focus:border-orange-500 focus:outline-none"
              >
                <option value="">Semua</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_customer">Waiting Customer</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-4 py-2 rounded-lg border border-orange-200 focus:border-orange-500 focus:outline-none"
              >
                <option value="">Semua</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterStatus('')
                  setFilterPriority('')
                  setSearchInput('')
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Reset Filter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Tidak ada ticket ditemukan</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-orange-100">
                <th className="text-left py-3 text-sm font-bold text-gray-600">
                  Ticket
                </th>
                <th className="text-left py-3 text-sm font-bold text-gray-600">
                  User
                </th>
                <th className="text-left py-3 text-sm font-bold text-gray-600">
                  Kategori
                </th>
                <th className="text-left py-3 text-sm font-bold text-gray-600">
                  Priority
                </th>
                <th className="text-left py-3 text-sm font-bold text-gray-600">
                  Status
                </th>
                <th
                  className="text-left py-3 text-sm font-bold text-gray-600 cursor-pointer hover:text-orange-600"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Dibuat
                    {sortBy === 'createdAt' && (
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          sortOrder === 'asc' ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </div>
                </th>
                <th className="text-right py-3 text-sm font-bold text-gray-600">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-orange-50 hover:bg-orange-50/50">
                  <td className="py-4">
                    <div className="max-w-xs">
                      <p className="font-semibold text-gray-900 truncate">{ticket.subject}</p>
                      <p className="text-sm text-gray-500 truncate">{ticket.description}</p>
                    </div>
                  </td>
                  <td className="py-4">
                    <div>
                      {ticket.client ? (
                        <>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {ticket.client.name}
                            </p>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-teal-100 text-teal-700 font-medium">
                              CLIENT
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{ticket.client.email}</p>
                        </>
                      ) : ticket.users ? (
                        <>
                          <p className="font-medium text-gray-900">
                            {ticket.users.name || 'Tanpa Nama'}
                          </p>
                          <p className="text-sm text-gray-500">{ticket.users.email}</p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">Unknown</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4">
                    {getCategoryBadge(ticket.category)}
                  </td>
                  <td className="py-4">
                    {getPriorityBadge(ticket.priority)}
                  </td>
                  <td className="py-4">
                    {getStatusBadge(ticket.status)}
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-gray-600">
                      {formatDate(ticket.createdAt)}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => onTicketSelect(ticket)}
                      className="p-2 rounded-lg hover:bg-orange-100 text-orange-600 transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
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
