'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  Users,
  DollarSign,
  Activity,
  Mail,
  LogOut,
  Loader2,
  LayoutDashboard,
  Menu,
  X,
  Shield,
  ChevronLeft,
  ChevronDown,
  Settings,
  BarChart3,
  Megaphone,
  MessageCircle,
} from 'lucide-react'
import { useAutoLogout } from '@/hooks/useAutoLogout'
import { SessionTimeoutModal } from '@/components/SessionTimeoutModal'
import { AdminLogo } from '@/components/Logo'
import { cn } from '@/lib/utils'

interface Admin {
  id: string
  email: string
  name: string
}

interface AdminLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  name: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  children?: { name: string; href: string }[]
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Client Access', href: '/admin/client-access', icon: Shield },
  { name: 'Payments', href: '/admin/payments', icon: DollarSign },
  { name: 'Activity Logs', href: '/admin/activity-logs', icon: Activity },
  { name: 'Email Templates', href: '/admin/email-templates', icon: Mail },
  { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
  { name: 'Support', href: '/admin/support', icon: MessageCircle },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  {
    name: 'Settings',
    icon: Settings,
    children: [
      { name: 'Email', href: '/admin/settings/email' },
      { name: 'Pricing Plans', href: '/admin/settings/pricing' },
      { name: 'Pricing Features', href: '/admin/settings/pricing-features' },
    ],
  },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
    const pathname = usePathname()
    const [admin, setAdmin] = useState<Admin | null>(null)
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // Auto logout after 30 minutes of inactivity
  const { showWarning, timeRemaining, stayLoggedIn, logout } = useAutoLogout({
    timeout: 30 * 60 * 1000, // 30 minutes
    warningTime: 60 * 1000, // 1 minute warning
    redirectPath: '/admin/login',
  })

  const checkAdminSession = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/me')
      if (res.ok) {
        const adminData = await res.json()
        setAdmin(adminData)
      } else {
        router.push('/admin/login')
      }
    } catch (error) {
      console.error('Error checking admin session:', error)
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkAdminSession()
  }, [checkAdminSession])

  useEffect(() => {
    // Close mobile menu on route change
    setMobileMenuOpen(false)
  }, [pathname])

  // Auto-open dropdown if current path is in its children
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.children) {
        const isActive = item.children.some((child) => pathname.startsWith(child.href))
        if (isActive) {
          setOpenDropdown(item.name)
        }
      }
    })
  }, [pathname])

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  const isDropdownActive = (item: NavItem) => {
    if (item.children) {
      return item.children.some((child) => pathname.startsWith(child.href))
    }
    return false
  }

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-light flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="w-16 h-16 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-light">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full transition-all duration-300 ease-in-out',
          'lg:translate-x-0',
          sidebarOpen ? 'w-64' : 'w-20',
          mobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        )}
        style={{ backgroundColor: '#0A637D' }}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {(sidebarOpen || mobileMenuOpen) ? (
            <Image
              src="/images/notabener-logo.png"
              alt="NotaBener"
              width={168}
              height={32}
              className="h-8 w-auto"
              priority
            />
          ) : (
            <Image
              src="/images/notabener-icon.png"
              alt="NotaBener"
              width={28}
              height={28}
              className="w-7 h-7"
              priority
            />
          )}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:block p-2 rounded-lg hover:bg-white/10"
          >
            <ChevronLeft className={cn(
              'w-5 h-5 text-white/70 transition-transform',
              !sidebarOpen && 'rotate-180'
            )} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0
            const isDropdownOpen = openDropdown === item.name
            const isParentActive = hasChildren && isDropdownActive(item)

            if (hasChildren) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleDropdown(item.name)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all',
                      isParentActive
                        ? 'bg-white/15 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white',
                      !sidebarOpen && !mobileMenuOpen && 'justify-center px-0'
                    )}
                    title={!sidebarOpen ? item.name : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {(sidebarOpen || mobileMenuOpen) && (
                      <>
                        <span className="flex-1 text-left">{item.name}</span>
                        <ChevronDown className={cn(
                          'w-4 h-4 transition-transform',
                          isDropdownOpen && 'rotate-180'
                        )} />
                      </>
                    )}
                  </button>
                  {isDropdownOpen && (sidebarOpen || mobileMenuOpen) && (
                    <div className="mt-1 ml-4 pl-4 border-l-2 border-white/20 space-y-1">
                      {item.children!.map((child) => {
                        const childActive = isActive(child.href)
                        return (
                          <button
                            key={child.name}
                            onClick={() => router.push(child.href)}
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                              childActive
                                ? 'bg-orange-500 text-white'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                            )}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{child.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            const active = item.href ? isActive(item.href) : false
            return (
              <button
                key={item.name}
                onClick={() => item.href && router.push(item.href)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all',
                  active
                    ? 'bg-orange-500 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                  !sidebarOpen && !mobileMenuOpen && 'justify-center px-0'
                )}
                title={!sidebarOpen ? item.name : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {(sidebarOpen || mobileMenuOpen) && (
                  <span>{item.name}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Admin Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
          {(sidebarOpen || mobileMenuOpen) ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{admin?.name || 'Admin'}</p>
                  <p className="text-xs text-white/60 truncate">{admin?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2.5 rounded-xl hover:bg-white/10 transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-white/70" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        )}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-[#0A637D]">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/10"
              >
                <Menu className="w-5 h-5 text-white" />
              </button>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-white" />
                <h1 className="text-lg font-bold text-white hidden sm:block">
                  Admin Dashboard
                </h1>
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium">
                <Shield className="w-4 h-4" />
                <span>Admin Mode</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Session Timeout Warning Modal */}
      <SessionTimeoutModal
        show={showWarning}
        timeRemaining={timeRemaining}
        onStayLoggedIn={stayLoggedIn}
        onLogout={logout}
      />
    </div>
  )
}