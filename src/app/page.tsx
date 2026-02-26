import Link from 'next/link'
import { FileText, Zap, TrendingUp, Shield, Check, ArrowRight, Menu, Sparkles, Star } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                InvoiceKirim
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                Fitur
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
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
            <button className="md:hidden p-2 rounded-xl bg-gray-100">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center md:text-left">
              <div className="badge badge-blue mb-6 inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Platform Invoice Indonesia</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Buat Invoice{' '}
                <span className="text-sky-600">Profesional</span>
                <br />
                dalam Hitungan Detik
              </h1>

              <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto md:mx-0 leading-relaxed">
                Kelola invoice bisnis Anda dengan mudah. Buat, kirim, dan lacak pembayaran - semuanya dari satu platform yang user-friendly.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-8">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 btn-primary font-semibold"
                >
                  <FileText className="w-5 h-5" />
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
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span>Gratis selamanya</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span>Tanpa kartu kredit</span>
                </div>
              </div>
            </div>

            {/* Right Content - Invoice Preview */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-200 animate-float">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-bold text-gray-900 text-lg">InvoiceKirim</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">INVOICE</div>
                    <div className="text-sm text-gray-600">INV-2024-001</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Total</div>
                    <div className="text-2xl font-bold text-gray-900">Rp 2.500.000</div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <div>
                      <div className="font-semibold text-gray-900">Web Design Services</div>
                      <div className="text-sm text-gray-600">Desain UI/UX website</div>
                    </div>
                    <div className="font-bold text-gray-900">Rp 2.500.000</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-600">Generated by InvoiceKirim</div>
                  <div className="px-4 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                    Lunas
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Kenapa InvoiceKirim?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Semua yang Anda butuhkan untuk mengelola invoice bisnis Anda
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card card-hover p-8">
              <div className="icon-box icon-box-blue mb-6">
                <Zap className="w-7 h-7 text-sky-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Buat Invoice Cepat
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Buat invoice profesional dalam hitungan detik dengan template yang siap pakai.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card card-hover p-8">
              <div className="icon-box icon-box-sky mb-6">
                <TrendingUp className="w-7 h-7 text-sky-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Lacak Pembayaran
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Pantau status invoice dan pembayaran dalam real-time. Dapatkan notifikasi saat invoice lunas.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card card-hover p-8">
              <div className="icon-box icon-box-navy mb-6">
                <Shield className="w-7 h-7 text-gray-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Aman & Terpercaya
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Data Anda aman dengan enkripsi. Backup otomatis dan akses dari mana saja.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Pilih Paket yang Tepat
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Mulai gratis, upgrade kapan saja bisnis Anda berkembang
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="pricing-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">Gratis</h3>
                <div className="badge badge-blue">Forever Free</div>
              </div>
              <p className="text-gray-600 mb-6">Untuk freelancer yang baru mulai</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">Rp 0</span>
                <span className="text-gray-600">/bulan</span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <div className="checkmark mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-600">10 invoice per bulan</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="checkmark mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-600">Template invoice profesional</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="checkmark mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-600">Download PDF</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="checkmark mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-600">Kirim via WhatsApp</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="checkmark mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-600">Email support</span>
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
            <div className="pricing-card-featured relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="px-4 py-1.5 bg-gray-900 text-white text-sm font-bold rounded-full inline-flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  POPULER
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2 mt-4">Pro</h3>
              <p className="text-gray-600 mb-6">Untuk bisnis yang berkembang</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">Rp 49K</span>
                <span className="text-gray-600">/bulan</span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <div className="checkmark mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-600">Invoice tanpa batas</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="checkmark mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-600">Template premium</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="checkmark mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-600">Custom branding (logo, warna)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="checkmark mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-600">Email otomatis ke klien</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="checkmark mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-600">Payment reminder otomatis</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="checkmark mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-600">Priority support</span>
                </li>
              </ul>

              <Link
                href="/login"
                className="block w-full px-6 py-3 btn-primary text-center font-semibold"
              >
                Mulai Pro - Gratis 7 Hari
              </Link>

              <p className="text-center text-gray-600 mt-4 text-sm">
                Tidak perlu kartu kredit • Batalkan kapan saja
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600">
              Butuh paket enterprise untuk tim?{' '}
              <a href="mailto:hello@invoicekirim.com" className="text-gray-900 font-semibold hover:underline">
                Hubungi kami
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="gradient-indigo rounded-3xl p-12 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Siap Mengelola Invoice?
            </h2>
            <p className="text-lg text-white mb-8 max-w-2xl mx-auto leading-relaxed">
              Bergabung dengan ratusan freelancer Indonesia yang sudah menggunakan InvoiceKirim.
              Cepat, mudah, dan profesional.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:shadow-xl transition-all"
            >
              <FileText className="w-6 h-6" />
              Mulai Gratis Sekarang
            </Link>
            <p className="mt-6 text-white text-sm opacity-90">
              Data tersimpan aman • Siap dalam 2 menit
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">InvoiceKirim</span>
              </Link>
              <p className="text-gray-400 max-w-sm leading-relaxed">
                Platform invoice profesional untuk freelancer dan bisnis Indonesia.
                Buat invoice profesional dalam hitungan detik.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-lg">Produk</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
                    Buat Invoice
                  </Link>
                </li>
                <li>
                  <a href="#features" className="text-gray-400 hover:text-white transition-colors">
                    Fitur
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">
                    Harga
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-lg">Perusahaan</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Tentang
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Kontak
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Privasi
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-700 text-center text-sm">
            <p className="text-gray-400">© 2024 InvoiceKirim. Dibuat dengan ❤️ untuk bisnis Indonesia.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
