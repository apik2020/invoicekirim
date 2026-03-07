'use client'

import { useState } from 'react'
import { DashboardSidebar, MobileMenuButton } from './DashboardSidebar'
import DashboardHeader from './DashboardHeader'
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
    <div className="min-h-screen bg-surface-light">
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
          {children}
        </main>
      </div>
    </div>
  )
}
