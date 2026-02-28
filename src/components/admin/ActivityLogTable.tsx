'use client'

import { useState, useEffect } from 'react'
import { Activity, Filter, Calendar, User, FileText, Download } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface ActivityLog {
  id: string
  action: string
  entityType: string
  entityId: string
  title: string
  description: string | null
  metadata: any
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface ActivityLogTableProps {
  userIdFilter?: string
}

export function ActivityLogTable({ userIdFilter }: ActivityLogTableProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchLogs()
  }, [page, action, entityType, startDate, endDate, userIdFilter])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })

      if (userIdFilter) params.append('userId', userIdFilter)
      if (action) params.append('action', action)
      if (entityType) params.append('entityType', entityType)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const res = await fetch(`/api/admin/activity-logs?${params}`)
      const data = await res.json()

      if (res.ok) {
        setLogs(data.logs)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const headers = ['Date', 'User', 'Action', 'Entity Type', 'Title', 'Description']
    const rows = logs.map(log => [
      formatDate(log.createdAt),
      log.user.name || log.user.email,
      log.action,
      log.entityType,
      log.title,
      log.description || '',
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setAction('')
    setEntityType('')
    setStartDate('')
    setEndDate('')
  }

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      CREATED: 'bg-lime-100 text-lime-700',
      UPDATED: 'bg-blue-100 text-blue-700',
      DELETED: 'bg-pink-100 text-pink-700',
      SENT: 'bg-orange-100 text-orange-700',
      PAID: 'bg-green-100 text-green-700',
      OVERDUE: 'bg-red-100 text-red-700',
      CANCELED: 'bg-gray-100 text-gray-700',
      REMINDED: 'bg-yellow-100 text-yellow-700',
      VIEWED: 'bg-purple-100 text-purple-700',
    }

    return (
      <span
        className={`px-2 py-1 rounded-lg text-xs font-bold ${
          colors[action] || 'bg-gray-100 text-gray-700'
        }`}
      >
        {action}
      </span>
    )
  }

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-orange-600" />
          <h2 className="text-xl font-bold text-gray-900">Activity Logs</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-200 text-sm hover:bg-orange-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-200 text-green-600 hover:bg-green-50 text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-orange-200 focus:border-orange-500 focus:outline-none"
              >
                <option value="">Semua</option>
                <option value="CREATED">Created</option>
                <option value="UPDATED">Updated</option>
                <option value="DELETED">Deleted</option>
                <option value="SENT">Sent</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELED">Canceled</option>
                <option value="REMINDED">Reminded</option>
                <option value="VIEWED">Viewed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entity Type
              </label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-orange-200 focus:border-orange-500 focus:outline-none"
              >
                <option value="">Semua</option>
                <option value="Invoice">Invoice</option>
                <option value="Client">Client</option>
                <option value="Item">Item</option>
                <option value="Template">Template</option>
                <option value="Subscription">Subscription</option>
              </select>
            </div>
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
          </div>
          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Reset Filter
            </button>
          </div>
        </div>
      )}

      {/* Logs Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Tidak ada activity log ditemukan</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-orange-100">
                <th className="text-left py-3 text-sm font-bold text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Waktu
                  </div>
                </th>
                <th className="text-left py-3 text-sm font-bold text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    User
                  </div>
                </th>
                <th className="text-left py-3 text-sm font-bold text-gray-600">
                  Action
                </th>
                <th className="text-left py-3 text-sm font-bold text-gray-600">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Entity
                  </div>
                </th>
                <th className="text-left py-3 text-sm font-bold text-gray-600">
                  Activity
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-orange-50 hover:bg-orange-50/50">
                  <td className="py-4">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">
                        {formatDate(log.createdAt)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleTimeString('id-ID')}
                      </p>
                    </div>
                  </td>
                  <td className="py-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {log.user.name || 'Tanpa Nama'}
                      </p>
                      <p className="text-xs text-gray-500">{log.user.email}</p>
                    </div>
                  </td>
                  <td className="py-4">{getActionBadge(log.action)}</td>
                  <td className="py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {log.entityType}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        {log.entityId.slice(0, 8)}...
                      </p>
                    </div>
                  </td>
                  <td className="py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {log.title}
                      </p>
                      {log.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {log.description}
                        </p>
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
