'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppSession } from '@/hooks/useAppSession'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, User, Settings, ChevronDown, CreditCard, ChevronLeft } from 'lucide-react'
import DarkModeToggle from './DarkModeToggle'

interface DashboardHeaderProps {
  title?: string
  showBackButton?: boolean
  backHref?: string
  actions?: React.ReactNode
}

export default function DashboardHeader({
  title = 'Dashboard',
  showBackButton = false,
  backHref = '/dashboard',
  actions,
}: DashboardHeaderProps) {
  const { data: session } = useAppSession()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    setShowUserMenu(false)
    // Clear session cookie by calling logout API
    await fetch('/api/logout', { method: 'POST' })
    router.push('/login')
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 flex-shrink-0">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Link
              href={backHref}
              className="flex items-center gap-1.5 text-text-secondary hover:text-brand-500 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium text-sm hidden sm:inline">Kembali</span>
            </Link>
          )}
          {!showBackButton && (
            <h1 className="text-lg sm:text-xl font-bold text-text-primary">{title}</h1>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark Mode Toggle */}
          <DarkModeToggle />

          {/* Additional Actions */}
          {actions}

          {/* User Menu Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl hover:bg-surface-light transition-colors border border-transparent hover:border-gray-200"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                <User className="w-4 h-4 text-brand-500" />
              </div>
              <span className="text-sm text-text-primary font-medium hidden md:block">
                {session?.user?.name || 'User'}
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform hidden md:block ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-gray-200 shadow-lg py-2 animate-scale-in">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-text-secondary hover:bg-surface-light transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">Pengaturan</span>
                </Link>
                <Link
                  href="/dashboard/billing"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-text-secondary hover:bg-surface-light transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm font-medium">Billing</span>
                </Link>
                <hr className="my-2 border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
