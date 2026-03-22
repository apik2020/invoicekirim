'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Receipt,
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { ClientDashboardLayout } from '@/components/ClientDashboardLayout'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Invoice {
  id: string
  invoiceNumber: string
  companyName: string
  total: number
  status: string
  dueDate: string | null
  createdAt: string
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  data: any
}

interface DashboardStats {
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  totalAmount: number
  paidAmount: number
  pendingAmount: number
}

export default function ClientDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [clientName, setClientName] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch client data
        const meRes = await fetch('/api/client/me')
        if (meRes.status === 401) {
          router.push('/client/auth/login')
          return
        }
        const meData = await meRes.json()
        setClientName(meData.name || 'Client')

        // Fetch invoices
        const invoicesRes = await fetch('/api/client/invoices')
        if (invoicesRes.ok) {
          const invoicesData = await invoicesRes.json()
          setRecentInvoices(invoicesData.invoices?.slice(0, 5) || [])

          // Calculate stats
          const allInvoices = invoicesData.invoices || []
          const paid = allInvoices.filter((i: Invoice) => i.status === 'PAID')
          const pending = allInvoices.filter((i: Invoice) => i.status === 'SENT')
          const overdue = allInvoices.filter((i: Invoice) => i.status === 'OVERDUE')

          setStats({
            totalInvoices: allInvoices.length,
            paidInvoices: paid.length,
            pendingInvoices: pending.length,
            overdueInvoices: overdue.length,
            totalAmount: allInvoices.reduce((sum: number, i: Invoice) => sum + i.total, 0),
            paidAmount: paid.reduce((sum: number, i: Invoice) => sum + i.total, 0),
            pendingAmount: pending.reduce((sum: number, i: Invoice) => sum + i.total, 0) +
                          overdue.reduce((sum: number, i: Invoice) => sum + i.total, 0),
          })
        }

        // Fetch notifications
        const notifRes = await fetch('/api/client/notifications?limit=5')
        if (notifRes.ok) {
          const notifData = await notifRes.json()
          setNotifications(notifData.notifications || [])
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-700',
      SENT: 'bg-teal-100 text-teal-700',
      PAID: 'bg-green-100 text-green-700',
      OVERDUE: 'bg-red-100 text-red-700',
      CANCELED: 'bg-gray-100 text-gray-700',
    }

    const labels: Record<string, string> = {
      DRAFT: 'Draft',
      SENT: 'Tertunda',
      PAID: 'Lunas',
      OVERDUE: 'Terlambat',
      CANCELED: 'Dibatalkan',
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.DRAFT}`}>
        {labels[status] || status}
      </span>
    )
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invoice_sent':
        return <Receipt className="w-5 h-5 text-brand-500" />
      case 'payment_reminder':
        return <Clock className="w-5 h-5 text-orange-500" />
      case 'payment_received':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-light flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    )
  }

  return (
    <ClientDashboardLayout title="Dashboard">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-6 mb-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Selamat Datang, {clientName}!</h2>
        <p className="text-white/80">
          Kelola invoice dan pantau status pembayaran Anda di sini.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-brand-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Invoice</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalInvoices || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Lunas</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.paidInvoices || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tertunda</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.pendingInvoices || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Terlambat</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.overdueInvoices || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Amount Summary */}
      {stats && stats.pendingAmount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm text-orange-700">
                Total tagihan tertunda: <strong>{formatCurrency(stats.pendingAmount)}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Invoice Terbaru</h3>
            <Link
              href="/client/dashboard/invoices"
              className="text-sm text-brand-500 hover:text-brand-600 flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentInvoices.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Belum ada invoice
              </div>
            ) : (
              recentInvoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/client/dashboard/invoices/${invoice.id}`}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {invoice.invoiceNumber}
                    </p>
                    <p className="text-sm text-gray-500">{invoice.companyName}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(invoice.total)}
                    </p>
                    {getStatusBadge(invoice.status)}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifikasi Terbaru</h3>
            <Link
              href="/client/dashboard/notifications"
              className="text-sm text-brand-500 hover:text-brand-600 flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Belum ada notifikasi
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 flex items-start gap-3 ${!notif.isRead ? 'bg-brand-50' : ''}`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.isRead ? 'font-semibold' : ''} text-gray-900`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(notif.createdAt)}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </ClientDashboardLayout>
  )
}
