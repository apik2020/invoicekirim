import Link from 'next/link'
import { Sparkles, Check, ArrowRight, Menu, Star, Zap, Shield, TrendingUp } from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function Home() {
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
            <button className="md:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              <Menu className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </header>

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

            {/* Right Content - Invoice Preview */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-card-hover p-6 md:p-8 border border-gray-100 animate-float">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-primary">
                        <span className="font-bold text-white text-sm tracking-tight">[iK]</span>
                      </div>
                      <span className="font-bold text-brand-500 text-lg">InvoiceKirim</span>
                    </div>
                    <div className="text-2xl font-bold text-brand-500">INVOICE</div>
                    <div className="text-sm text-text-muted">INV-2024-001</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-text-muted">Total</div>
                    <div className="text-2xl font-bold text-brand-500">Rp 2.500.000</div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between py-3 border-b border-gray-50">
                    <div>
                      <div className="font-semibold text-text-primary">Web Design Services</div>
                      <div className="text-sm text-text-muted">Desain UI/UX website</div>
                    </div>
                    <div className="font-bold text-text-primary">Rp 2.500.000</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-text-muted">Generated by InvoiceKirim</div>
                  <div className="badge-paid">
                    Lunas
                  </div>
                </div>
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
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-500 mb-4">
              Pilih Paket yang Tepat
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Mulai gratis, upgrade kapan saja bisnis Anda berkembang
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="pricing-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-brand-500">Gratis</h3>
                <div className="badge-paid">Forever Free</div>
              </div>
              <p className="text-text-secondary mb-6">Untuk freelancer yang baru mulai</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-brand-500">Rp 0</span>
                <span className="text-text-muted">/bulan</span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <div className="checkmark mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-text-secondary">10 invoice per bulan</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="checkmark mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-text-secondary">Template invoice profesional</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="checkmark mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-text-secondary">Download PDF</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="checkmark mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-text-secondary">Kirim via WhatsApp</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="checkmark mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-text-secondary">Email support</span>
                </li>
              </ul>

              <Link
                href="/login"
                className="block w-full px-6 py-3 btn-secondary text-center font-semibold"
              >
                Mulai Gratis
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="pricing-card-featured">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                <div className="badge bg-primary-500 text-white shadow-primary">
                  <Star className="w-4 h-4" />
                  POPULER
                </div>
              </div>

              <h3 className="text-2xl font-bold text-brand-500 mb-2 mt-2">Pro</h3>
              <p className="text-text-secondary mb-6">Untuk bisnis yang berkembang</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-primary-500">Rp 49K</span>
                <span className="text-text-muted">/bulan</span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <div className="checkmark mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-text-secondary">Invoice tanpa batas</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="checkmark mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-text-secondary">Template premium</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="checkmark mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-text-secondary">Custom branding (logo, warna)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="checkmark mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-text-secondary">Email otomatis ke klien</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="checkmark mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-text-secondary">Payment reminder otomatis</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="checkmark mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-text-secondary">Priority support</span>
                </li>
              </ul>

              <Link
                href="/login"
                className="block w-full px-6 py-3 btn-primary text-center font-semibold"
              >
                Mulai Pro - Gratis 7 Hari
              </Link>

              <p className="text-center text-text-muted mt-4 text-sm">
                Tidak perlu kartu kredit • Batalkan kapan saja
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-text-secondary">
              Butuh paket enterprise untuk tim?{' '}
              <a href="mailto:hello@invoicekirim.com" className="text-primary-500 font-semibold hover:text-primary-600">
                Hubungi kami
              </a>
            </p>
          </div>
        </div>
      </section>

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
