'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { LogOut, User, Settings, ChevronDown, CreditCard } from 'lucide-react'
import DarkModeToggle from './DarkModeToggle'
import { Logo } from './Logo'

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
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    setShowUserMenu(false)
    await signOut({ callbackUrl: '/login' })
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
    <header className="bg-white/80 backdrop-blur-md border-b border-orange-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Link href={backHref} className="flex items-center gap-2">
                <span className="text-gray-600">←</span>
                <span className="text-gray-600 font-medium">Kembali</span>
              </Link>
            )}
            <Logo showText={false} />
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <DarkModeToggle />

            {/* Additional Actions */}
            {actions}

            {/* User Menu Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
              >
                <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-sm text-gray-900 font-medium hidden sm:block">
                  {session?.user?.name || 'User'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform hidden sm:block ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-orange-200 shadow-lg py-2">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="font-medium">Settings</span>
                  </Link>
                  <Link
                    href="/dashboard/billing"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="font-medium">Billing</span>
                  </Link>
                  <hr className="my-2 border-gray-200" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
