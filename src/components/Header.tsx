'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Menu, X } from 'lucide-react'
import { useState } from 'react'
import DarkModeToggle from './DarkModeToggle'

export default function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-orange-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 via-pink-500 to-lemon-500 flex items-center justify-center shadow-lg shadow-orange-200 group-hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden">
              <span className="text-lg font-black text-white tracking-tight">[iK]</span>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                InvoiceKirim
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/#features"
              className="text-gray-600 hover:text-orange-600 transition-all duration-300 font-medium relative group"
            >
              Fitur
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/#how-it-works"
              className="text-gray-600 hover:text-orange-600 transition-all duration-300 font-medium relative group"
            >
              Cara Pakai
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/#pricing"
              className="text-gray-600 hover:text-orange-600 transition-all duration-300 font-medium relative group"
            >
              Harga
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
          </div>

          {/* Desktop CTA Button & Dark Mode Toggle */}
          <div className="hidden md:flex items-center gap-4">
            <DarkModeToggle />
            <Link
              href="/login"
              className="px-7 py-3 text-sm font-bold tracking-wide rounded-xl transition-all duration-300 btn-primary text-white"
            >
              {pathname === '/login' ? 'Login' : 'Buat Invoice'}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-gray-600 hover:text-orange-600 transition-all duration-300"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white mx-4 mb-4 p-6 rounded-2xl shadow-lg border border-orange-100">
          <div className="flex flex-col gap-4">
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-600 hover:text-orange-600 transition-all duration-300 font-medium py-2"
            >
              Fitur
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-600 hover:text-orange-600 transition-all duration-300 font-medium py-2"
            >
              Cara Pakai
            </Link>
            <Link
              href="/#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-600 hover:text-orange-600 transition-all duration-300 font-medium py-2"
            >
              Harga
            </Link>
            <div className="flex items-center gap-4 py-2">
              <span className="text-gray-600 font-medium">Tema:</span>
              <DarkModeToggle />
            </div>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-primary text-white px-7 py-3 text-sm font-bold tracking-wide rounded-xl transition-all duration-300 text-center mt-2"
            >
              {pathname === '/login' ? 'Login' : 'Buat Invoice'}
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
