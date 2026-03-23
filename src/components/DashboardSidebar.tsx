'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Receipt,
  UserCircle,
  Package,
  FileText,
  Settings,
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Bell,
  Users,
  Palette,
  Shield,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  badge?: string | number
}

const mainNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Invoice', href: '/dashboard/invoices', icon: Receipt },
  { name: 'Klien', href: '/dashboard/clients', icon: UserCircle },
  { name: 'Item', href: '/dashboard/items', icon: Package },
  { name: 'Template', href: '/dashboard/templates', icon: FileText },
]

const settingsNavItems: NavItem[] = [
  { name: 'Profil', href: '/dashboard/settings', icon: Settings },
  { name: 'Branding', href: '/dashboard/settings/branding', icon: Palette },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Notifikasi', href: '/dashboard/settings/notifications', icon: Bell },
  { name: 'Tim', href: '/dashboard/teams', icon: Users },
  { name: 'Keamanan', href: '/dashboard/settings/security', icon: Shield },
]

interface DashboardSidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
}

export function DashboardSidebar({
  collapsed = false,
  onCollapsedChange,
  mobileOpen = false,
  onMobileOpenChange,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(collapsed)

  useEffect(() => {
    onCollapsedChange?.(isCollapsed)
  }, [isCollapsed, onCollapsedChange])

  // Close mobile sidebar when route changes
  useEffect(() => {
    onMobileOpenChange?.(false)
  }, [pathname, onMobileOpenChange])

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const NavItem = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href)

    return (
      <Link
        href={item.href}
        onClick={() => onMobileOpenChange?.(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
          active
            ? 'bg-white/15 text-white font-semibold'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        )}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && (
          <>
            <span className="flex-1 text-sm">{item.name}</span>
            {item.badge && (
              <span className="px-2 py-0.5 text-xs bg-primary-500 rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => onMobileOpenChange?.(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'bg-brand-500 text-white transition-all duration-300 z-40 flex flex-col',
          // Desktop: fixed position
          'hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0',
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-64',
          // Mobile styles
          'fixed left-0 top-0 h-full',
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-primary flex-shrink-0">
              <span className="font-bold text-white text-xs tracking-tight">[iK]</span>
            </div>
            {(!isCollapsed || mobileOpen) && (
              <span className="font-bold text-base text-white">InvoiceKirim</span>
            )}
          </Link>
          {/* Mobile Close Button */}
          {mobileOpen && (
            <button
              onClick={() => onMobileOpenChange?.(false)}
              className="lg:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4 hide-scrollbar">
          {/* Main Navigation */}
          <div className="space-y-1">
            {(!isCollapsed || mobileOpen) && (
              <span className="px-3 text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                Menu Utama
              </span>
            )}
            <div className="space-y-0.5 mt-1.5">
              {mainNavItems.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* Settings Navigation */}
          <div className="space-y-1">
            {(!isCollapsed || mobileOpen) && (
              <span className="px-3 text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                Pengaturan
              </span>
            )}
            <div className="space-y-0.5 mt-1.5">
              {settingsNavItems.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* Help Section */}
          <div className="pt-3 border-t border-white/10">
            <Link
              href="/dashboard/bantuan"
              onClick={() => onMobileOpenChange?.(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                pathname.startsWith('/dashboard/bantuan')
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <HelpCircle className="w-5 h-5 flex-shrink-0" />
              {(!isCollapsed || mobileOpen) && <span className="text-sm">Bantuan</span>}
            </Link>
          </div>
        </nav>

        {/* Sidebar Footer */}
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

        {/* Collapse Button - Desktop Only */}
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

// Mobile Menu Button Component
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-brand-500 hover:bg-brand-50 transition-colors"
    >
      <Menu className="w-6 h-6" />
    </button>
  )
}
