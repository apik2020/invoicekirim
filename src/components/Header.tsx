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
    <header className="bg-snow/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate/5">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center neu-button group-hover:-translate-y-0.5 transition-all duration-300">
              <FileText className="w-6 h-6 text-arctic-blue" />
            </div>
            <div className="flex items-center">
              <span className="font-display text-2xl font-bold text-slate tracking-tight">InvoiceKirim</span>
              <span className="cursor-blink text-2xl font-bold text-arctic-blue ml-0.5">_</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/#features"
              className="font-body text-slate/70 hover:text-arctic-blue transition-all duration-300 font-medium relative group"
            >
              Fitur
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-arctic-blue group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/#how-it-works"
              className="font-body text-slate/70 hover:text-arctic-blue transition-all duration-300 font-medium relative group"
            >
              Cara Pakai
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-arctic-blue group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/#pricing"
              className="font-body text-slate/70 hover:text-arctic-blue transition-all duration-300 font-medium relative group"
            >
              Harga
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-arctic-blue group-hover:w-full transition-all duration-300"></span>
            </Link>
          </div>

          {/* Desktop CTA Button & Dark Mode Toggle */}
          <div className="hidden md:flex items-center gap-4">
            <DarkModeToggle />
            <Link
              href="/login"
              className={`px-7 py-3 text-sm font-bold tracking-wide rounded-2xl transition-all duration-300 focus-ring ${
                pathname === '/login'
                  ? 'neu-button-primary text-white'
                  : 'neu-button text-slate hover:text-arctic-blue'
              }`}
            >
              {pathname === '/login' ? 'Login' : 'Buat Invoice'}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-12 h-12 rounded-2xl neu-button flex items-center justify-center text-slate hover:text-arctic-blue transition-all duration-300"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden neu-card-md mx-4 mb-4 p-6 mobile-menu open">
          <div className="flex flex-col gap-4">
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="font-body text-slate/70 hover:text-arctic-blue transition-all duration-300 font-medium py-2"
            >
              Fitur
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="font-body text-slate/70 hover:text-arctic-blue transition-all duration-300 font-medium py-2"
            >
              Cara Pakai
            </Link>
            <Link
              href="/#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="font-body text-slate/70 hover:text-arctic-blue transition-all duration-300 font-medium py-2"
            >
              Harga
            </Link>
            <div className="flex items-center gap-4 py-2">
              <span className="font-body text-slate/70 font-medium">Tema:</span>
              <DarkModeToggle />
            </div>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="neu-button-primary text-white px-7 py-3 text-sm font-bold tracking-wide rounded-2xl transition-all duration-300 text-center mt-2"
            >
              {pathname === '/login' ? 'Login' : 'Buat Invoice'}
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
