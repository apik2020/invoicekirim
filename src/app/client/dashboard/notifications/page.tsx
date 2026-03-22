'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Bell,
  Receipt,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Trash2,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react'
import { ClientDashboardLayout } from '@/components/ClientDashboardLayout'
import { formatDate } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  data: any
}

const typeOptions = [
  { value: 'ALL', label: 'Semua' },
  { value: 'invoice_sent', label: 'Invoice Baru' },
  { value: 'payment_reminder', label: 'Pengingat' },
  { value: 'payment_received', label: 'Pembayaran' },
  { value: 'overdue', label: 'Terlambat' },
  { value: 'message', label: 'Pesan' },
]

export default function ClientNotificationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [unreadCount, setUnreadCount] = useState(0)
  const [type, setType] = useState('ALL')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [pagination.page, type])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())
      if (type !== 'ALL') params.set('type', type)

      const res = await fetch(`/api/client/notifications?${params.toString()}`)

      if (res.status === 401) {
        router.push('/client/auth/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setPagination(prev => ({ ...prev, ...data.pagination }))
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch('/api/client/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      })

      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/client/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })

      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/client/notifications?id=${notificationId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        setPagination(prev => ({ ...prev, total: prev.total - 1 }))
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'invoice_sent':
        return <Receipt className="w-5 h-5 text-brand-500" />
      case 'payment_reminder':
        return <Clock className="w-5 h-5 text-orange-500" />
      case 'payment_received':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'message':
        return <MessageCircle className="w-5 h-5 text-blue-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getNotificationLink = (notification: Notification) => {
    if (notification.data?.invoiceId) {
      return `/client/dashboard/invoices`
    }
    return null
  }

  return (
    <ClientDashboardLayout title="Notifikasi">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <span className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-sm font-medium">
              {unreadCount} belum dibaca
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Tandai Semua Dibaca
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {typeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  setType(option.value)
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  type === option.value
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

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
            <p className="mt-2 text-gray-500">Memuat notifikasi...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada notifikasi</h3>
            <p className="text-gray-500">Notifikasi akan muncul di sini</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {notifications.map(notification => {
                const link = getNotificationLink(notification)
                const content = (
                  <div
                    className={`p-4 flex items-start gap-4 transition-colors ${
                      !notification.isRead ? 'bg-brand-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p
                            className={`text-sm ${
                              !notification.isRead ? 'font-semibold' : ''
                            } text-gray-900`}
                          >
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.isRead && (
                            <button
                              onClick={e => {
                                e.preventDefault()
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                              className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"
                              title="Tandai dibaca"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={e => {
                              e.preventDefault()
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-2" />
                    )}
                  </div>
                )

                return link ? (
                  <Link key={notification.id} href={link} className="block">
                    {content}
                  </Link>
                ) : (
                  <div key={notification.id}>{content}</div>
                )
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Menampilkan {((pagination.page - 1) * pagination.limit) + 1} -{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} dari{' '}
                  {pagination.total} notifikasi
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-700">
                    Halaman {pagination.page} dari {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
