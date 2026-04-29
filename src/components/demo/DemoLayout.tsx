'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  FileText, Plus, Users, Package, Crown, Sparkles, Eye,
  Receipt, UserCircle, Settings, CreditCard, LogOut, ChevronLeft,
  ChevronRight, HelpCircle, Palette, Mail, Star, Shield, Bell,
  LayoutDashboard, ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const mainNav = [
  { name: 'Dashboard', href: '/demo', icon: LayoutDashboard },
  { name: 'Invoice', href: '/demo/invoices', icon: Receipt },
  { name: 'Klien', href: '/demo/clients', icon: UserCircle },
  { name: 'Item', href: '/demo/items', icon: Package },
  { name: 'Template', href: '/demo/templates', icon: FileText },
]
const settingsNav = [
  { name: 'Profil', href: '/demo/settings', icon: Settings },
  { name: 'Branding', href: '/demo/branding', icon: Palette },
  { name: 'Email', href: '/demo/email', icon: Mail },
  { name: 'Billing', href: '/demo/billing', icon: CreditCard },
  { name: 'Pricing', href: '/demo/pricing', icon: Star },
  { name: 'Keamanan', href: '/demo/security', icon: Shield },
]

export function DemoBanner() {
  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 text-center text-sm font-medium sticky top-0 z-[35]">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
        <Eye className="w-4 h-4" />
        <span>Ini adalah <strong>Mode Demo</strong> — Semua data adalah contoh. Bayangkan ini adalah bisnis Anda!</span>
        <Link
          href="/register"
          className="ml-2 px-4 py-1 bg-white text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-50 transition-colors"
        >
          Daftar Gratis
        </Link>
      </div>
    </div>
  )
}

export function DemoSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/demo') return pathname === '/demo'
    return pathname.startsWith(href)
  }

  return (
    <>
      <aside
        id="demo-sidebar"
        className={cn(
          'bg-brand-500 text-white transition-all duration-300 z-40 flex flex-col fixed inset-y-0 left-0',
          isCollapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        {/* Header */}
        <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <Link href="/demo" className="flex items-center gap-2.5">
            {!isCollapsed ? (
              <Image src="/images/notabener-logo.png" alt="NotaBener" width={168} height={32} className="h-8 w-auto" priority />
            ) : (
              <Image src="/images/notabener-icon-user.png" alt="NotaBener" width={28} height={28} className="w-7 h-7" priority />
            )}
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4 hide-scrollbar">
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3 text-[10px] font-semibold text-white/50 uppercase tracking-wider">Menu Utama</span>
            )}
            <div className="space-y-0.5 mt-1.5">
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    isActive(item.href)
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="text-sm">{item.name}</span>}
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3 text-[10px] font-semibold text-white/50 uppercase tracking-wider">Pengaturan</span>
            )}
            <div className="space-y-0.5 mt-1.5">
              {settingsNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    isActive(item.href)
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="text-sm">{item.name}</span>}
                </Link>
              ))}
            </div>
          </div>
          <div className="pt-3 border-t border-white/10">
            <Link
              href="/dashboard/bantuan"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200"
            >
              <HelpCircle className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm">Bantuan</span>}
            </Link>
          </div>
        </nav>

        <div className="px-3 py-3 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-primary-500/20 hover:text-white transition-all duration-200 cursor-pointer">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm">Logout</span>}
          </div>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-brand-500 rounded-full border border-white/20 items-center justify-center text-white hover:bg-brand-600 transition-colors shadow-lg"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* Floating register button */}
      <div className={cn('fixed bottom-4 z-50 transition-all duration-300', isCollapsed ? 'left-2' : 'left-4')}>
        <Link
          href="/register"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4" />
          {!isCollapsed && 'Daftar Gratis'}
        </Link>
      </div>
    </>
  )
}

export function DemoHeader({ title }: { title: string }) {
  return (
    <header id="demo-header" className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 flex-shrink-0">
      <div className="h-full px-4 pl-14 lg:pl-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg sm:text-xl font-bold text-text-primary">{title}</h1>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
            <Eye className="w-3 h-3" />
            Mode Demo
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary-500 rounded-full border-2 border-white" />
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-transparent hover:border-gray-200 hover:bg-surface-light transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
              <Crown className="w-4 h-4 text-brand-500" />
            </div>
            <span className="text-sm text-text-primary font-medium hidden md:block">Demo User</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export function DemoPageWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-light">
      <DemoBanner />
      <DemoSidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <DemoHeader title={title} />
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Floating back button */}
      <Link
        href="/"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 bg-white text-brand-500 font-bold rounded-xl shadow-xl border border-gray-200 hover:border-brand-300 hover:shadow-brand transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Kembali ke Beranda</span>
      </Link>
    </div>
  )
}
