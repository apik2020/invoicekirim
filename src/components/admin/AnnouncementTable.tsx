'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  Megaphone,
  Calendar,
  Users,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Announcement {
  id: string
  title: string
  message: string
  type: string
  targetType: string
  displayType: string
  isDismissible: boolean
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  createdAt: string
  _count: {
    announcement_reads: number
  }
}

interface AnnouncementTableProps {
  onCreateNew: () => void
  onAnnouncementSelect: (announcement: Announcement) => void
  onAnnouncementEdit: (announcement: Announcement) => void
  onAnnouncementDelete: (announcement: Announcement) => void
}

export function AnnouncementTable({
  onCreateNew,
  onAnnouncementSelect,
  onAnnouncementEdit,
  onAnnouncementDelete,
}: AnnouncementTableProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterActive, setFilterActive] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    fetchAnnouncements()
  }, [page, debouncedSearch, sortBy, sortOrder, filterActive, filterType])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      })

      if (debouncedSearch) params.append('search', debouncedSearch)
      if (filterActive) params.append('isActive', filterActive)
      if (filterType) params.append('type', filterType)

      const res = await fetch(`/api/admin/announcements?${params}`)
      const data = await res.json()

      if (res.ok) {
        setAnnouncements(data.announcements)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Info className="w-4 h-4 text-blue-600" />
    }
  }

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      info: 'bg-blue-100 text-blue-700',
      success: 'bg-green-100 text-green-700',
      warning: 'bg-yellow-100 text-yellow-700',
      error: 'bg-red-100 text-red-700',
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${colors[type] || colors.info}`}>
        {getTypeIcon(type)}
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    )
  }

  const getDisplayBadge = (displayType: string) => {
    const colors: Record<string, string> = {
      banner: 'bg-purple-100 text-purple-700',
      modal: 'bg-pink-100 text-pink-700',
      toast: 'bg-cyan-100 text-cyan-700',
    }

    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${colors[displayType] || colors.banner}`}>
        {displayType.charAt(0).toUpperCase() + displayType.slice(1)}
      </span>
    )
  }

  const getStatusBadge = (announcement: Announcement) => {
    const now = new Date()
    const startsAt = announcement.startsAt ? new Date(announcement.startsAt) : null
    const endsAt = announcement.endsAt ? new Date(announcement.endsAt) : null

    if (!announcement.isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700">
          <XCircle className="w-3 h-3" />
          Inactive
        </span>
      )
    }

    if (startsAt && now < startsAt) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-yellow-100 text-yellow-700">
          <Calendar className="w-3 h-3" />
          Scheduled
        </span>
      )
    }

    if (endsAt && now > endsAt) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700">
          <XCircle className="w-3 h-3" />
          Expired
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-lime-100 text-lime-700">
        <CheckCircle className="w-3 h-3" />
        Active
      </span>
    )
  }

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-gray-900">Pengumuman</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-200 text-sm hover:bg-orange-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Buat Pengumuman
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari pengumuman..."
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
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                className="px-4 py-2 rounded-lg border border-orange-200 focus:border-orange-500 focus:outline-none"
              >
                <option value="">Semua</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipe
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 rounded-lg border border-orange-200 focus:border-orange-500 focus:outline-none"
              >
                <option value="">Semua</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterActive('')
                  setFilterType('')
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
      ) : announcements.length === 0 ? (
        <div className="text-center py-12">
          <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Tidak ada pengumuman ditemukan</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-orange-100">
                <th className="text-left py-3 text-sm font-bold text-gray-600">
                  Pengumuman
                </th>
                <th className="text-left py-3 text-sm font-bold text-gray-600">
                  Tipe
                </th>
                <th className="text-left py-3 text-sm font-bold text-gray-600">
                  Tampilan
                </th>
                <th className="text-left py-3 text-sm font-bold text-gray-600">
                  Status
                </th>
                <th
                  className="text-left py-3 text-sm font-bold text-gray-600 cursor-pointer hover:text-orange-600"
                  onClick={() => handleSort('_count.announcement_reads')}
                >
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Dilihat
                  </div>
                </th>
                <th
                  className="text-left py-3 text-sm font-bold text-gray-600 cursor-pointer hover:text-orange-600"
                  onClick={() => handleSort('endsAt')}
                >
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Berakhir
                    {sortBy === 'endsAt' && (
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
              {announcements.map((announcement) => (
                <tr key={announcement.id} className="border-b border-orange-50 hover:bg-orange-50/50">
                  <td className="py-4">
                    <div className="max-w-xs">
                      <p className="font-semibold text-gray-900 truncate">{announcement.title}</p>
                      <p className="text-sm text-gray-500 truncate">{announcement.message}</p>
                    </div>
                  </td>
                  <td className="py-4">
                    {getTypeBadge(announcement.type)}
                  </td>
                  <td className="py-4">
                    {getDisplayBadge(announcement.displayType)}
                  </td>
                  <td className="py-4">
                    {getStatusBadge(announcement)}
                  </td>
                  <td className="py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {announcement._count.announcement_reads}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-gray-600">
                      {announcement.endsAt ? formatDate(announcement.endsAt) : 'Tanpa Batas'}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onAnnouncementSelect(announcement)}
                        className="p-2 rounded-lg hover:bg-orange-100 text-orange-600 transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onAnnouncementEdit(announcement)}
                        className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                        title="Edit Pengumuman"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onAnnouncementDelete(announcement)}
                        className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                        title="Hapus Pengumuman"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
