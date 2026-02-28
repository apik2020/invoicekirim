'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  Crown,
  Users,
  Calendar,
  FileText,
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

interface User {
  id: string
  name: string | null
  email: string
  companyName: string | null
  createdAt: string
  subscription: {
    id: string
    planType: string
    status: string
    stripeCurrentPeriodEnd: string | null
  } | null
  _count: {
    invoices: number
  }
}

interface UserTableProps {
  onUserSelect: (user: User) => void
  onUserEdit?: (user: User) => void
  onUserDelete?: (user: User) => void
}

export function UserTable({ onUserSelect, onUserEdit, onUserDelete }: UserTableProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterPlanType, setFilterPlanType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    fetchUsers()
  }, [page, debouncedSearch, sortBy, sortOrder, filterPlanType, filterStatus])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      })

      if (debouncedSearch) params.append('search', debouncedSearch)
      if (filterPlanType) params.append('planType', filterPlanType)
      if (filterStatus) params.append('status', filterStatus)

      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()

      if (res.ok) {
        setUsers(data.users)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
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

  const getPlanTypeBadge = (planType: string) => {
    if (planType === 'PRO') {
      return (
        <span className="px-2 py-1 rounded-lg text-xs font-bold bg-lime-100 text-lime-700 flex items-center gap-1">
          <Crown className="w-3 h-3" />
          PRO
        </span>
      )
    }
    return (
      <span className="px-2 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700">
        FREE
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-lime-100 text-lime-700',
      CANCELED: 'bg-gray-100 text-gray-700',
      FREE: 'bg-orange-100 text-orange-700',
      PAST_DUE: 'bg-pink-100 text-pink-700',
    }

    return (
      <span
        className={`px-2 py-1 rounded-lg text-xs font-bold ${colors[status] || 'bg-gray-100 text-gray-700'}`}
      >
        {status}
      </span>
    )
  }

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-gray-900">Pengguna</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-200 text-sm hover:bg-orange-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari user berdasarkan nama, email, atau perusahaan..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-orange-200 focus:border-orange-500 focus:outline-none"
          />
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipe Plan
              </label>
              <select
                value={filterPlanType}
                onChange={(e) => setFilterPlanType(e.target.value)}
                className="px-4 py-2 rounded-lg border border-orange-200 focus:border-orange-500 focus:outline-none"
              >
                <option value="">Semua</option>
                <option value="FREE">FREE</option>
                <option value="PRO">PRO</option>
              </select>
            </div>
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
                <option value="ACTIVE">Active</option>
                <option value="CANCELED">Canceled</option>
                <option value="FREE">Free</option>
                <option value="PAST_DUE">Past Due</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterPlanType('')
                  setFilterStatus('')
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
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Tidak ada user ditemukan</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-orange-100">
                <th className="text-left py-3 text-sm font-bold text-gray-600">
                  User
                </th>
                <th className="text-left py-3 text-sm font-bold text-gray-600">
                  Plan
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
                    Tanggal Daftar
                    {sortBy === 'createdAt' && (
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          sortOrder === 'asc' ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </div>
                </th>
                <th className="text-left py-3 text-sm font-bold text-gray-600">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Invoices
                  </div>
                </th>
                <th className="text-right py-3 text-sm font-bold text-gray-600">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-orange-50 hover:bg-orange-50/50">
                  <td className="py-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {user.name || 'Tanpa Nama'}
                      </p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {user.companyName && (
                        <p className="text-xs text-gray-500">{user.companyName}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4">
                    {user.subscription ? getPlanTypeBadge(user.subscription.planType) : '-'}
                  </td>
                  <td className="py-4">
                    {user.subscription ? getStatusBadge(user.subscription.status) : '-'}
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-gray-600">
                      {formatDate(user.createdAt)}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {user._count.invoices}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onUserSelect(user)}
                        className="p-2 rounded-lg hover:bg-orange-100 text-orange-600 transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {onUserEdit && (
                        <button
                          onClick={() => onUserEdit(user)}
                          className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {onUserDelete && (
                        <button
                          onClick={() => onUserDelete(user)}
                          className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                          title="Hapus User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
