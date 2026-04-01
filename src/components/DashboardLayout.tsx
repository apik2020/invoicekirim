'use client'

import { useState } from 'react'
import { DashboardSidebar, MobileMenuButton, MobileBottomNav } from './DashboardSidebar'
import DashboardHeader from './DashboardHeader'
import { SubscriptionGuard } from '@/hooks/useSubscriptionGuard'
import { AnnouncementBanner } from './AnnouncementBanner'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  showBackButton?: boolean
  backHref?: string
  actions?: React.ReactNode
}

export function DashboardLayout({
  children,
  title = 'Dashboard',
  showBackButton = false,
  backHref = '/dashboard',
  actions,
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <SubscriptionGuard>
      <div className="min-h-screen bg-surface-light pb-20 lg:pb-0"> {/* Add bottom padding for mobile nav */}
        {/* Modal and Toast Announcements - Global */}
        <AnnouncementBanner displayType="modal" />
        <AnnouncementBanner displayType="toast" />
        {/* Mobile Menu Button - Fixed position */}
        <div className="fixed top-4 left-4 z-30 lg:hidden">
          <MobileMenuButton onClick={() => setMobileOpen(true)} />
        </div>

        {/* Sidebar */}
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        />

        {/* Main Content */}
        <div
          className={cn(
            'transition-all duration-300 min-h-screen',
            // Desktop margin based on sidebar state
            sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          )}
        >
          <DashboardHeader
            title={title}
            showBackButton={showBackButton}
            backHref={backHref}
            actions={actions}
          />
          <main className="p-4 sm:p-6 lg:p-8">
            {/* Announcement Banner */}
            <div className="mb-6 -mt-2 -mx-2 sm:mx-0">
              <AnnouncementBanner displayType="banner" />
            </div>

            {children}
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </SubscriptionGuard>
  )
}
