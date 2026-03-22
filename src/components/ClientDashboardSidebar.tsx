'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Receipt,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  MessageCircle,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  badge?: string | number
}

const mainNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard },
  { name: 'Invoice', href: '/client/dashboard/invoices', icon: Receipt },
  { name: 'Pesan', href: '/client/dashboard/messages', icon: MessageCircle },
  { name: 'Bantuan', href: '/client/dashboard/support', icon: HelpCircle },
]

const settingsNavItems: NavItem[] = [
  { name: 'Notifikasi', href: '/client/dashboard/notifications', icon: Bell },
  { name: 'Pengaturan', href: '/client/dashboard/settings', icon: Settings },
]

interface ClientDashboardSidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
  unreadNotifications?: number
  unreadMessages?: number
}

export function ClientDashboardSidebar({
  collapsed = false,
  onCollapsedChange,
  mobileOpen = false,
  onMobileOpenChange,
  unreadNotifications = 0,
  unreadMessages = 0,
}: ClientDashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(collapsed)

  useEffect(() => {
    onCollapsedChange?.(isCollapsed)
  }, [isCollapsed, onCollapsedChange])

  useEffect(() => {
    onMobileOpenChange?.(false)
  }, [pathname, onMobileOpenChange])

  const handleLogout = async () => {
    await fetch('/api/client/auth/logout', { method: 'POST' })
    router.push('/client/auth/login')
  }

  const isActive = (href: string) => {
    if (href === '/client/dashboard') {
      return pathname === '/client/dashboard'
    }
    return pathname.startsWith(href)
  }

  const NavItem = ({ item, badge }: { item: NavItem; badge?: number }) => {
    const active = isActive(item.href)

    return (
      <Link
        href={item.href}
        onClick={() => onMobileOpenChange?.(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
          active
            ? 'bg-white/15 text-white font-semibold'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        )}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {(!isCollapsed || mobileOpen) && (
          <>
            <span className="flex-1 text-sm">{item.name}</span>
            {badge && badge > 0 && (
              <span className="px-2 py-0.5 text-xs bg-primary-500 rounded-full">
                {badge}
              </span>
            )}
          </>
        )}
        {isCollapsed && !mobileOpen && badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs bg-primary-500 rounded-full">
            {badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => onMobileOpenChange?.(false)}
        />
      )}

      <aside
        className={cn(
          'bg-brand-500 text-white transition-all duration-300 z-40 flex flex-col',
          'hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0',
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-64',
          'fixed left-0 top-0 h-full',
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <Link href="/client/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-primary flex-shrink-0">
              <span className="font-bold text-white text-xs tracking-tight">[iK]</span>
            </div>
            {(!isCollapsed || mobileOpen) && (
              <span className="font-bold text-base text-white">Client Portal</span>
            )}
          </Link>
          {mobileOpen && (
            <button
              onClick={() => onMobileOpenChange?.(false)}
              className="lg:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4 hide-scrollbar">
          <div className="space-y-1">
            {(!isCollapsed || mobileOpen) && (
              <span className="px-3 text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                Menu
              </span>
            )}
            <div className="space-y-0.5 mt-1.5">
              {mainNavItems.map((item) => {
                const badge = item.href.includes('notifications')
                  ? unreadNotifications
                  : item.href.includes('messages')
                  ? unreadMessages
                  : undefined
                return <NavItem key={item.href} item={item} badge={badge} />
              })}
            </div>
          </div>

          <div className="space-y-1">
            {(!isCollapsed || mobileOpen) && (
              <span className="px-3 text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                Pengaturan
              </span>
            )}
            <div className="space-y-0.5 mt-1.5">
              {settingsNavItems.map((item) => {
                const badge = item.href.includes('notifications')
                  ? unreadNotifications
                  : undefined
                return <NavItem key={item.href} item={item} badge={badge} />
              })}
            </div>
          </div>
        </nav>

        <div className="px-3 py-3 border-t border-white/10 flex-shrink-0">
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full',
              'text-white/70 hover:bg-primary-500/20 hover:text-white'
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {(!isCollapsed || mobileOpen) && <span className="text-sm">Logout</span>}
          </button>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-brand-500 rounded-full border border-white/20 items-center justify-center text-white hover:bg-brand-600 transition-colors shadow-lg"
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </aside>
    </>
  )
}

export function ClientMobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-brand-500 hover:bg-brand-50 transition-colors"
    >
      <Menu className="w-6 h-6" />
    </button>
  )
}
