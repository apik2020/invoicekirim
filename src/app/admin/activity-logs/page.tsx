'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, Loader2, LogOut, Users, DollarSign, Mail } from 'lucide-react'
import { ActivityLogTable } from '@/components/admin/ActivityLogTable'
import { AdminLogo } from '@/components/Logo'

export default function AdminActivityLogsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdminSession()
  }, [])

  const checkAdminSession = async () => {
    try {
      const res = await fetch('/api/admin/me')
      if (res.ok) {
        setLoading(false)
      } else {
        router.push('/admin/login')
      }
    } catch (error) {
      console.error('Error checking admin session:', error)
      router.push('/admin/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-fresh-bg">
      {/* Header */}
      <div className="bg-white border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <AdminLogo size="lg" linkToHome={false} />
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 rounded-xl border border-orange-200 text-gray-700 hover:bg-orange-50 font-medium"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/admin/users')}
                className="px-4 py-2 rounded-xl border border-orange-200 text-gray-700 hover:bg-orange-50 font-medium flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Users
              </button>
              <button
                onClick={() => router.push('/admin/payments')}
                className="px-4 py-2 rounded-xl border border-orange-200 text-gray-700 hover:bg-orange-50 font-medium flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Payments
              </button>
              <button
                onClick={() => router.push('/admin/email-templates')}
                className="px-4 py-2 rounded-xl border border-orange-200 text-gray-700 hover:bg-orange-50 font-medium flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Email Templates
              </button>
              <button
                onClick={() => router.push('/admin/activity-logs')}
                className="px-4 py-2 rounded-xl bg-orange-500 text-white font-medium flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                Activity Logs
              </button>
              <button
                onClick={async () => {
                  await fetch('/api/admin/logout', { method: 'POST' })
                  router.push('/admin/login')
                  router.refresh()
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Audit Logs</h2>
          <p className="text-gray-600">Lihat semua aktivitas pengguna dalam sistem</p>
        </div>

        {/* Activity Logs Table */}
        <ActivityLogTable />
      </div>
    </div>
  )
}
