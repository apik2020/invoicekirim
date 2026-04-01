'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Check, ArrowRight, Menu, X, Zap, Shield, TrendingUp, FileText, Send, CreditCard, Clock, Users, BarChart3, Bell } from 'lucide-react'
import { Logo } from '@/components/Logo'
import LandingPricing from '@/components/LandingPricing'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Deep Teal */}
      <header className="sticky top-0 z-50 bg-brand-500 shadow-brand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Logo textClassName="!text-white" />

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-white/80 hover:text-white transition-colors font-medium">
                Fitur
              </Link>
              <Link href="#pricing" className="text-white/80 hover:text-white transition-colors font-medium">
                Harga
              </Link>
              <Link
                href="/login"
                className="px-6 py-2.5 btn-primary"
              >
                Mulai Gratis
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 animate-slide-in-right">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <Logo size="sm" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-text-primary" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-2">
                <Link
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-primary hover:bg-brand-50 hover:text-brand-600 transition-colors font-medium"
                >
                  <Zap className="w-5 h-5" />
                  Fitur
                </Link>
                <Link
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-primary hover:bg-brand-50 hover:text-brand-600 transition-colors font-medium"
                >
                  <CreditCard className="w-5 h-5" />
                  Harga
                </Link>
              </nav>

              {/* CTA Buttons */}
              <div className="mt-8 space-y-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-6 py-3 border-2 border-brand-500 text-brand-500 font-bold rounded-xl hover:bg-brand-50 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-6 py-3 bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30"
                >
                  Mulai Gratis
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-text-secondary text-sm">
                    <div className="w-5 h-5 rounded-full bg-success-400 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span>Gratis</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary text-sm">
                    <div className="w-5 h-5 rounded-full bg-success-400 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span>Tanpa CC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Hero Section */}
      <section className="py-20 md:py-28 hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center md:text-left">
              <div className="badge badge-brand mb-6 inline-flex items-center gap-2 animate-pulse-soft">
                <Sparkles className="w-4 h-4" />
                <span>Platform Invoice Indonesia</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-500 mb-6 leading-tight">
                Buat Invoice{' '}
                <span className="text-primary-500">
                  MUDAH
                </span>
                <br />
                dalam Hitungan Detik
              </h1>

              <p className="text-lg text-text-secondary mb-8 max-w-xl mx-auto md:mx-0 leading-relaxed">
                Kelola invoice bisnis Anda dengan mudah. Buat, kirim, dan lacak pembayaran - semuanya dari satu platform yang profesional dan user-friendly.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-8">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 btn-primary font-semibold"
                >
                  <span className="font-bold text-white">[iK]</span>
                  Mulai Gratis
                </Link>
                <Link
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 btn-secondary font-semibold"
                >
                  Lihat Harga
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2 text-text-secondary text-sm">
                  <div className="w-5 h-5 rounded-full bg-success-400 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span>Gratis selamanya</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary text-sm">
                  <div className="w-5 h-5 rounded-full bg-success-400 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span>Tanpa kartu kredit</span>
                </div>
              </div>
            </div>

            {/* Right Content - Dashboard Preview */}
            <div className="relative">
              {/* Main Dashboard Card */}
              <div className="bg-white rounded-3xl shadow-card-hover p-6 md:p-8 border border-gray-100 animate-float">
                {/* Dashboard Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-brand">
                      <span className="font-bold text-white text-sm tracking-tight">[iK]</span>
                    </div>
                    <div>
                      <span className="font-bold text-brand-500 text-lg">Dashboard</span>
                      <p className="text-xs text-text-muted">Selamat datang kembali!</p>
                    </div>
                  </div>
                  <div className="relative">
                    <Bell className="w-5 h-5 text-text-muted" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-brand-50 to-brand-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs text-text-muted">Invoice</span>
                    </div>
                    <div className="text-2xl font-bold text-brand-500">24</div>
                    <div className="text-xs text-success-600 flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      +12% bulan ini
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-success-500 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs text-text-muted">Revenue</span>
                    </div>
                    <div className="text-2xl font-bold text-success-600">Rp 12.5 jt</div>
                    <div className="text-xs text-success-600 flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      +23% bulan ini
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs text-text-muted">Klien</span>
                    </div>
                    <div className="text-2xl font-bold text-primary-600">18</div>
                    <div className="text-xs text-text-muted mt-1">3 klien baru</div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs text-text-muted">Pending</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-600">5</div>
                    <div className="text-xs text-amber-600 mt-1">Rp 3.2 jt</div>
                  </div>
                </div>

                {/* Recent Invoice */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-text-primary">Invoice Terbaru</span>
                    <span className="text-xs text-primary-500">Lihat semua</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-white rounded-xl p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
                          <Check className="w-5 h-5 text-success-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">INV-2024-024</p>
                          <p className="text-xs text-text-muted">PT Maju Jaya</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-success-600">Rp 2.500.000</p>
                        <span className="badge-paid text-xs">Lunas</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white rounded-xl p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">INV-2024-023</p>
                          <p className="text-xs text-text-muted">CV Berkah Abadi</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-amber-600">Rp 1.800.000</p>
                        <span className="badge-overdue text-xs">Pending</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Action Cards */}
              <div className="absolute -top-4 -right-4 md:top-4 md:-right-8 bg-white rounded-2xl shadow-card p-4 animate-float" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center">
                    <Send className="w-5 h-5 text-success-600" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Invoice Terkirim!</p>
                    <p className="text-sm font-bold text-text-primary">Ke WhatsApp</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 md:bottom-8 md:-left-8 bg-white rounded-2xl shadow-card p-4 animate-float" style={{ animationDelay: '0.6s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Target Tercapai!</p>
                    <p className="text-sm font-bold text-success-600">+125%</p>
                  </div>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-brand flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Data Aman & Terenkripsi
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-surface-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-500 mb-4">
              Kenapa InvoiceKirim?
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Semua yang Anda butuhkan untuk mengelola invoice bisnis Anda
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card card-hover p-8">
              <div className="icon-box icon-box-primary mb-6">
                <Zap className="w-7 h-7 text-primary-500" />
              </div>
              <h3 className="text-xl font-bold text-brand-500 mb-3">
                Buat Invoice Cepat
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Buat invoice profesional dalam hitungan detik dengan template yang siap pakai.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card card-hover p-8">
              <div className="icon-box icon-box-secondary mb-6">
                <TrendingUp className="w-7 h-7 text-secondary-600" />
              </div>
              <h3 className="text-xl font-bold text-brand-500 mb-3">
                Lacak Pembayaran
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Pantau status invoice dan pembayaran dalam real-time. Dapatkan notifikasi saat invoice lunas.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card card-hover p-8">
              <div className="icon-box icon-box-success mb-6">
                <Shield className="w-7 h-7 text-success-600" />
              </div>
              <h3 className="text-xl font-bold text-brand-500 mb-3">
                Aman & Terpercaya
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Data Anda aman dengan enkripsi. Backup otomatis dan akses dari mana saja.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <LandingPricing />

      {/* CTA Section */}
      <section className="py-20 bg-surface-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="cta-gradient rounded-3xl p-12 md:p-16 text-center shadow-brand-lg">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Siap Mengelola Invoice?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Bergabung dengan ratusan freelancer Indonesia yang sudah menggunakan InvoiceKirim.
              Cepat, mudah, dan profesional.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-primary-500 text-white rounded-xl font-bold text-lg hover:bg-primary-600 shadow-primary-lg hover:shadow-primary transition-all"
            >
              <span className="font-bold text-white">[iK]</span>
              Mulai Gratis Sekarang
            </Link>
            <p className="mt-6 text-white text-sm opacity-90">
              Data tersimpan aman • Siap dalam 2 menit
            </p>
          </div>
        </div>
      </section>

      {/* Footer - Deep Teal */}
      <footer className="bg-brand-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="mb-4">
                <Logo size="sm" textClassName="!text-white" />
              </div>
              <p className="text-white/80 max-w-sm leading-relaxed">
                Platform invoice profesional untuk freelancer dan bisnis Indonesia.
                Buat invoice profesional dalam hitungan detik.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-lg text-white">Produk</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/login" className="text-white/80 hover:text-white transition-colors">
                    Buat Invoice
                  </Link>
                </li>
                <li>
                  <a href="#features" className="text-white/80 hover:text-white transition-colors">
                    Fitur
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-white/80 hover:text-white transition-colors">
                    Harga
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-lg text-white">Perusahaan</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-white/80 hover:text-white transition-colors">
                    Tentang
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-white transition-colors">
                    Kontak
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-white transition-colors">
                    Privasi
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/20 text-center text-sm">
            <p className="text-white/80">© 2024 InvoiceKirim. Dibuat dengan ❤️ untuk bisnis Indonesia.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
