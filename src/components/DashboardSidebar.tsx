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
  Palette,
  Shield,
  Menu,
  X,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  badge?: string | number
}

// Main Navigation Items
const mainNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Invoice', href: '/dashboard/invoices', icon: Receipt },
  { name: 'Klien', href: '/dashboard/clients', icon: UserCircle },
  { name: 'Item', href: '/dashboard/items', icon: Package },
  { name: 'Template', href: '/dashboard/templates', icon: FileText },
]

// Settings Navigation Items
const settingsNavItems: NavItem[] = [
  { name: 'Profil', href: '/dashboard/settings', icon: Settings },
  { name: 'Branding', href: '/dashboard/settings/branding', icon: Palette },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Keamanan', href: '/dashboard/settings/security', icon: Shield },
]

// Mobile Bottom Navigation Items
const mobileNavItems: NavItem[] = [
  { name: 'Beranda', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Invoice', href: '/dashboard/invoices', icon: Receipt },
  { name: 'Buat', href: '/dashboard/invoices/create', icon: Plus },
  { name: 'Klien', href: '/dashboard/clients', icon: UserCircle },
  { name: 'Lainnya', href: '#more', icon: Menu },
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
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
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
        {isCollapsed && !mobileOpen && item.badge && (
          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs bg-primary-500 rounded-full">
            {item.badge}
          </span>
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
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-primary flex-shrink-0">
              <span className="font-bold text-white text-xs tracking-tight">[nB]</span>
            </div>
            {(!isCollapsed || mobileOpen) && (
              <span className="font-bold text-base text-white">NotaBener</span>
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

// Mobile Bottom Navigation Bar
export function MobileBottomNav() {
  const pathname = usePathname()
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    if (href === '#more') {
      return false
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* More Menu Modal */}
      {showMoreMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 lg:hidden"
            onClick={() => setShowMoreMenu(false)}
          />
          <div className="fixed bottom-20 left-4 right-4 bg-white rounded-2xl shadow-2xl z-50 lg:hidden animate-fade-in-up overflow-hidden">
            <div className="p-4 grid grid-cols-3 gap-3">
              {/* Items */}
              <Link
                href="/dashboard/items"
                onClick={() => setShowMoreMenu(false)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-brand-600" />
                </div>
                <span className="text-xs font-medium text-text-primary">Item</span>
              </Link>

              {/* Templates */}
              <Link
                href="/dashboard/templates"
                onClick={() => setShowMoreMenu(false)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-secondary-600" />
                </div>
                <span className="text-xs font-medium text-text-primary">Template</span>
              </Link>

              {/* Billing */}
              <Link
                href="/dashboard/billing"
                onClick={() => setShowMoreMenu(false)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-success-600" />
                </div>
                <span className="text-xs font-medium text-text-primary">Billing</span>
              </Link>

              {/* Settings */}
              <Link
                href="/dashboard/settings"
                onClick={() => setShowMoreMenu(false)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Settings className="w-6 h-6 text-gray-600" />
                </div>
                <span className="text-xs font-medium text-text-primary">Pengaturan</span>
              </Link>

              {/* Branding */}
              <Link
                href="/dashboard/settings/branding"
                onClick={() => setShowMoreMenu(false)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-highlight-100 flex items-center justify-center">
                  <Palette className="w-6 h-6 text-highlight-600" />
                </div>
                <span className="text-xs font-medium text-text-primary">Branding</span>
              </Link>

              {/* Logout */}
              <button
                onClick={() => {
                  setShowMoreMenu(false)
                  signOut({ callbackUrl: '/login' })
                }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-red-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <LogOut className="w-6 h-6 text-red-600" />
                </div>
                <span className="text-xs font-medium text-red-600">Logout</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 lg:hidden safe-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileNavItems.map((item) => {
            const active = isActive(item.href)

            if (item.href === '#more') {
              return (
                <button
                  key={item.name}
                  onClick={() => setShowMoreMenu(true)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[60px]',
                    'text-text-muted hover:text-text-primary'
                  )}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </button>
              )
            }

            // Special styling for "Buat" (Create) button
            if (item.name === 'Buat') {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center -mt-6"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                    <Plus className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-[10px] font-semibold text-primary-500 mt-1">{item.name}</span>
                </Link>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[60px]',
                  active
                    ? 'text-brand-500'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                <item.icon className={cn('w-6 h-6', active && 'stroke-[2.5]')} />
                <span className={cn('text-[10px] font-medium', active && 'font-semibold')}>{item.name}</span>
                {active && (
                  <div className="absolute bottom-0 w-8 h-0.5 bg-brand-500 rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
