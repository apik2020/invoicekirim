'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Users,
  Crown,
  Gift,
  Clock,
  RefreshCw,
  Edit,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { cn } from '@/lib/utils'

interface Subscription {
  id: string
  planType: string
  status: string
  trialEndsAt: string | null
  monthlyInvoiceLimit: number | null
  pricingPlan: {
    id: string
    name: string
    slug: string
    features: any[]
  } | null
}

interface User {
  id: string
  name: string | null
  email: string
  createdAt: string
  subscription: Subscription | null
  invoiceCountThisMonth: number
}

interface PricingPlan {
  id: string
  name: string
  slug: string
  price_monthly: number
  price_yearly: number
}

export default function AdminClientAccessPage() {
  const [users, setUsers] = useState<User[]>([])
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 20 })
  const [planFilter, setPlanFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Edit modal state
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    pricingPlanId: '',
    status: '',
    trialDays: 0,
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(planFilter && { plan: planFilter }),
        ...(statusFilter && { status: statusFilter }),
      })

      const res = await fetch(`/api/admin/user-subscriptions?${params}`)
      const data = await res.json()

      if (res.ok) {
        setUsers(data.users)
        setPricingPlans(data.pricingPlans)
        setPagination(prev => ({ ...prev, total: data.pagination.total, totalPages: data.pagination.totalPages }))
      } else {
        setError(data.error || 'Gagal memuat data')
      }
    } catch {
      setError('Gagal memuat data subscription')
    } finally {
      setIsLoading(false)
    }
  }, [page, debouncedSearch, planFilter, statusFilter, pagination.limit])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setEditForm({
      pricingPlanId: user.subscription?.pricingPlan?.id || '',
      status: user.subscription?.status || 'FREE',
      trialDays: 0,
    })
    setShowEditModal(true)
    setError('')
    setSuccess('')
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return
    setIsSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/user-subscriptions?userId=${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengupdate subscription')
      }

      setSuccess('Subscription berhasil diupdate!')
      setShowEditModal(false)
      setEditingUser(null)
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetToFree = async (userId: string) => {
    if (!confirm('Apakah Anda yakin ingin mereset subscription user ini ke paket Gratis?')) return

    try {
      const res = await fetch(`/api/admin/user-subscriptions?userId=${userId}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mereset subscription')
      }

      setSuccess('Subscription berhasil direset ke Free!')
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      FREE: 'bg-gray-100 text-gray-700',
      TRIALING: 'bg-yellow-100 text-yellow-700',
      ACTIVE: 'bg-green-100 text-green-700',
      CANCELED: 'bg-red-100 text-red-700',
    }
    const labels: Record<string, string> = {
      FREE: 'Gratis',
      TRIALING: 'Trial',
      ACTIVE: 'Aktif',
      CANCELED: 'Dibatalkan',
    }
    return (
      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', styles[status] || styles.FREE)}>
        {labels[status] || status}
      </span>
    )
  }

  const getPlanBadge = (user: User) => {
    if (!user.subscription?.pricingPlan) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          Gratis
        </span>
      )
    }

    const plan = user.subscription.pricingPlan
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-700">
        {plan.name}
      </span>
    )
  }

  const getInvoiceUsage = (user: User) => {
    const limit = user.subscription?.monthlyInvoiceLimit
    const used = user.invoiceCountThisMonth

    if (limit === null) {
      return (
        <span className="text-green-600 font-medium">
          {used} (Unlimited)
        </span>
      )
    }

    // Ensure limit is a number
    const safeLimit = limit || 0
    const percentage = safeLimit > 0 ? Math.min(100, (used / safeLimit) * 100) : 0
    const isOverLimit = safeLimit > 0 && used > safeLimit

    return (
      <div className="flex items-center gap-2">
        <span className={isOverLimit ? 'text-red-600 font-medium' : 'text-text-secondary'}>
          {used} / {limit}
        </span>
        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isOverLimit ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
            )}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Kelola Akses Klien</h1>
              <p className="text-text-secondary">Atur subscription dan hak akses klien</p>
            </div>
          </div>
          <button
            onClick={() => fetchUsers()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all text-sm"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <Gift className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Paket Gratis</p>
                <p className="text-xl font-bold text-text-primary">
                  {users.filter(u => !u.subscription?.pricingPlan || u.subscription?.pricingPlan?.slug === 'gratis').length}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <Crown className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Paket Pro</p>
                <p className="text-xl font-bold text-text-primary">
                  {users.filter(u => u.subscription?.pricingPlan?.slug === 'pro').length}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Trial</p>
                <p className="text-xl font-bold text-text-primary">
                  {users.filter(u => u.subscription?.status === 'TRIALING').length}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Over Limit</p>
                <p className="text-xl font-bold text-text-primary">
                  {users.filter(u => {
                    const limit = u.subscription?.monthlyInvoiceLimit
                    return limit !== null && limit !== undefined && u.invoiceCountThisMonth > limit
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Cari nama atau email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:border-brand-300 focus:ring focus:ring-brand-200 outline-none text-sm"
                />
              </div>
            </div>
            <select
              value={planFilter}
              onChange={(e) => { setPlanFilter(e.target.value); setPage(1) }}
              className="px-4 py-2 rounded-xl border border-gray-200 focus:border-brand-300 focus:ring focus:ring-brand-200 outline-none text-sm"
            >
              <option value="">Semua Paket</option>
              {pricingPlans.map((plan) => (
                <option key={plan.id} value={plan.slug.toUpperCase()}>{plan.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="px-4 py-2 rounded-xl border border-gray-200 focus:border-brand-300 focus:ring focus:ring-brand-200 outline-none text-sm"
            >
              <option value="">Semua Status</option>
              <option value="FREE">Gratis</option>
              <option value="TRIALING">Trial</option>
              <option value="ACTIVE">Aktif</option>
              <option value="CANCELED">Dibatalkan</option>
            </select>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="card p-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-3 text-red-700">
              <X className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="card p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-3 text-green-700">
              <Check className="w-5 h-5" />
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">User</th>
                <th className="table-header">Paket</th>
                <th className="table-header">Status</th>
                <th className="table-header">Invoice Bulan Ini</th>
                <th className="table-header">Trial</th>
                <th className="table-header">Bergabung</th>
                <th className="table-header">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500" />
                    <p className="text-text-muted mt-2">Memuat data...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-text-muted">
                    Tidak ada user ditemukan
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-text-primary">{user.name || '-'}</p>
                        <p className="text-sm text-text-muted">{user.email}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      {getPlanBadge(user)}
                    </td>
                    <td className="table-cell">
                      {getStatusBadge(user.subscription?.status || 'FREE')}
                    </td>
                    <td className="table-cell">
                      {getInvoiceUsage(user)}
                    </td>
                    <td className="table-cell text-sm text-text-secondary">
                      {user.subscription?.trialEndsAt ? (
                        <span className="text-yellow-600">
                          {new Date(user.subscription.trialEndsAt).toLocaleDateString('id-ID')}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="table-cell text-sm text-text-secondary">
                      {new Date(user.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-text-secondary hover:text-brand-600 transition-colors"
                          title="Edit Subscription"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResetToFree(user.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-text-secondary hover:text-red-600 transition-colors"
                          title="Reset ke Free"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-100">
              <p className="text-sm text-text-muted">
                Menampilkan {((page - 1) * pagination.limit) + 1} - {Math.min(page * pagination.limit, pagination.total)} dari {pagination.total} user
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-text-secondary">
                  Halaman {page} dari {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-text-primary">Edit Subscription</h2>
              <p className="text-sm text-text-muted">
                {editingUser.name || editingUser.email}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Plan Select */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Pilih Paket
                </label>
                <select
                  value={editForm.pricingPlanId}
                  onChange={(e) => setEditForm({ ...editForm, pricingPlanId: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-brand-300 focus:ring focus:ring-brand-200 outline-none"
                >
                  <option value="">Gratis (Tanpa Paket)</option>
                  {pricingPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name} - Rp {plan.price_monthly.toLocaleString('id-ID')}/bulan</option>
                  ))}
                </select>
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Status Subscription
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-brand-300 focus:ring focus:ring-brand-200 outline-none"
                >
                  <option value="FREE">Gratis</option>
                  <option value="TRIALING">Trial</option>
                  <option value="ACTIVE">Aktif</option>
                  <option value="CANCELED">Dibatalkan</option>
                </select>
              </div>

              {/* Trial Days */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Durasi Trial (Hari)
                </label>
                <input
                  type="number"
                  value={editForm.trialDays}
                  onChange={(e) => setEditForm({ ...editForm, trialDays: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-brand-300 focus:ring focus:ring-brand-200 outline-none"
                />
                <p className="text-xs text-text-muted mt-1">
                  Isi jika ingin memberikan masa trial baru
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowEditModal(false); setEditingUser(null) }}
                className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all text-sm font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl btn-primary text-sm font-medium disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Simpan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
