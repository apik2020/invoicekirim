'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import DarkModeToggle from './DarkModeToggle'
import { Logo } from './Logo'

export default function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-orange-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Logo size="lg" />

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
