'use client'

import { useState, useEffect } from 'react'
import { ClientDashboardSidebar, ClientMobileMenuButton } from './ClientDashboardSidebar'
import { cn } from '@/lib/utils'
import { Menu } from 'lucide-react'

interface ClientDashboardLayoutProps {
  children: React.ReactNode
  title?: string
  showBackButton?: boolean
  backHref?: string
  actions?: React.ReactNode
}

export function ClientDashboardLayout({
  children,
  title = 'Dashboard',
  showBackButton = false,
  backHref = '/client/dashboard',
  actions,
}: ClientDashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  // Fetch unread counts
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        const [notifRes, msgRes] = await Promise.all([
          fetch('/api/client/notifications?unreadOnly=true'),
          fetch('/api/client/messages/unread-count'),
        ])

        if (notifRes.ok) {
          const data = await notifRes.json()
          setUnreadNotifications(data.unreadCount || 0)
        }

        if (msgRes.ok) {
          const data = await msgRes.json()
          setUnreadMessages(data.unreadCount || 0)
        }
      } catch (error) {
        console.error('Failed to fetch unread counts:', error)
      }
    }

    fetchUnreadCounts()
  }, [])

  return (
    <div className="min-h-screen bg-surface-light">
      <div className="fixed top-4 left-4 z-30 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg bg-white shadow-sm text-text-secondary hover:text-brand-500"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <ClientDashboardSidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
        unreadNotifications={unreadNotifications}
        unreadMessages={unreadMessages}
      />

      <div
        className={cn(
          'transition-all duration-300 min-h-screen',
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        )}
      >
        {/* Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="lg:hidden w-10" /> {/* Spacer for mobile menu */}
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
