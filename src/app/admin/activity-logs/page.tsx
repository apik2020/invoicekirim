'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity,
  Loader2,
  LogOut,
  Users,
  DollarSign,
  Mail,
  LayoutDashboard,
} from 'lucide-react'
import { ActivityLogTable } from '@/components/admin/ActivityLogTable'
import { AdminLogo } from '@/components/Logo'
import { cn } from '@/lib/utils'

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Payments', href: '/admin/payments', icon: DollarSign },
  { name: 'Email Templates', href: '/admin/email-templates', icon: Mail },
  { name: 'Activity Logs', href: '/admin/activity-logs', icon: Activity },
]

export default function AdminActivityLogsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    checkAdminSession()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-light flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="w-16 h-16 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-light">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <AdminLogo size="lg" linkToHome={false} />
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  await fetch('/api/admin/logout', { method: 'POST' })
                  router.push('/admin/login')
                  router.refresh()
                }}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-all font-medium text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Admin Navigation */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
          {navItems.map((item) => {
            const isActive = item.href === '/admin/activity-logs'
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={cn(
                  'flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-sm transition-all',
                  isActive
                    ? 'bg-brand-500 text-white'
                    : 'border border-gray-200 text-text-secondary hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50'
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.name}</span>
              </button>
            )
          })}
        </div>

        {/* Page Header */}
        <div className="mb-6 sm:mb-8 animate-fade-in-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">Audit Logs</h1>
          <p className="text-text-secondary text-sm sm:text-base">Lihat semua aktivitas pengguna dalam sistem</p>
        </div>

        {/* Activity Logs Table */}
        <div className="animate-fade-in-up animation-delay-100">
          <ActivityLogTable />
        </div>
      </div>
    </div>
  )
}
