'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { FileText, LogOut, User } from 'lucide-react'
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
  const { data: session } = useSession()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="bg-white border-b border-slate sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Link href={backHref} className="flex items-center gap-2">
                <span className="text-slate">←</span>
                <span className="text-slate font-medium">Kembali</span>
              </Link>
            )}
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-charcoal flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-dark tracking-tight">
                {title}
              </span>
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <DarkModeToggle />

            {/* Additional Actions */}
            {actions}

            {/* User Menu */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gray flex items-center justify-center">
                  <User className="w-4 h-4 text-slate" />
                </div>
                <span className="text-sm text-dark font-medium hidden sm:block">
                  {session?.user?.name || 'User'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-teal-light font-medium rounded-xl hover:bg-gray transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
