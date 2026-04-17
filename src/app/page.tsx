'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles, Check, ArrowRight, Menu, X, Zap, Shield, TrendingUp,
  FileText, Send, CreditCard, Clock, Users, BarChart3, Bell,
  Briefcase, Wrench, Armchair, Gem, Pencil, Monitor, Sprout,
  Scissors, Package, Gift, Smartphone, HeartPulse, Cog, Laptop,
  UtensilsCrossed, Apple, Truck, Cloud, AlertTriangle, LayoutDashboard,
  Calculator, MessageCircle, XCircle, ChevronDown, Quote,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import LandingPricing from '@/components/LandingPricing'
import type { LucideIcon } from 'lucide-react'

const businessTypes: { icon: LucideIcon; label: string; color: string }[] = [
  { icon: Briefcase, label: 'Konsultan', color: 'text-blue-600 bg-blue-100' },
  { icon: Wrench, label: 'Perkakas', color: 'text-orange-600 bg-orange-100' },
  { icon: Armchair, label: 'Furnitur', color: 'text-amber-600 bg-amber-100' },
  { icon: Sparkles, label: 'Kosmetik', color: 'text-pink-600 bg-pink-100' },
  { icon: Gem, label: 'Perhiasan', color: 'text-purple-600 bg-purple-100' },
  { icon: Pencil, label: 'Alat Tulis (ATK)', color: 'text-teal-600 bg-teal-100' },
  { icon: Monitor, label: 'Servis & Toko Komputer', color: 'text-indigo-600 bg-indigo-100' },
  { icon: Sprout, label: 'Peternakan', color: 'text-green-600 bg-green-100' },
  { icon: Sprout, label: 'Pertanian', color: 'text-lime-600 bg-lime-100' },
  { icon: Scissors, label: 'Penjahit', color: 'text-rose-600 bg-rose-100' },
  { icon: Package, label: 'Barang Bekas', color: 'text-slate-600 bg-slate-100' },
  { icon: Gift, label: 'Kado dan Mainan', color: 'text-fuchsia-600 bg-fuchsia-100' },
  { icon: Smartphone, label: 'Elektronik', color: 'text-cyan-600 bg-cyan-100' },
  { icon: HeartPulse, label: 'Medis & Kesehatan', color: 'text-red-600 bg-red-100' },
  { icon: Cog, label: 'Suku Cadang / Bengkel', color: 'text-gray-600 bg-gray-200' },
  { icon: Laptop, label: 'Freelancer', color: 'text-brand-600 bg-brand-100' },
  { icon: UtensilsCrossed, label: 'Makanan dan Minuman', color: 'text-yellow-600 bg-yellow-100' },
  { icon: Apple, label: 'Snack / Camilan', color: 'text-emerald-600 bg-emerald-100' },
  { icon: Sprout, label: 'Sayuran dan Buah', color: 'text-green-600 bg-green-100' },
  { icon: Truck, label: 'Logistik', color: 'text-sky-600 bg-sky-100' },
]

const faqItems = [
  {
    question: 'Apa bedanya NotaBener dengan software akuntansi penuh (seperti Jurnal, Mekari, atau Accurate)?',
    answer: 'Bedanya sangat besar. Software akuntansi penuh dirancang untuk akuntan profesional dengan fitur rumit seperti Jurnal Umum, Buku Besar, Neraca, dan Laporan Laba Rugi yang kompleks. NotaBener adalah aplikasi Micro-SaaS yang fokus 100% pada Invoicing dan Penagihan (Nota Penagihan). Kami menghapus semua kerumitan akuntansi untuk memberikan Anda kecepatan dan kemudahan dalam mengirim tagihan ke klien, memantau kas masuk, dan memastikan Anda dibayar tepat waktu. Jika Anda tidak butuh laporan akuntansi rumit, NotaBener adalah solusi tepat.',
  },
  {
    question: 'Apakah saya memerlukan keahlian akuntansi untuk menggunakan NotaBener?',
    answer: 'Sama sekali tidak. NotaBener didesain sangat simpel dan intuitif, bahkan untuk orang yang paling awam dengan keuangan sekalipun. Antarmukanya bersih dan menggunakan bahasa sehari-hari bisnis (seperti "Bikin Invoice," "Kirim Tagihan"), bukan jargon akuntansi. Jika Anda bisa menggunakan WhatsApp atau Email, Anda pasti bisa menggunakan NotaBener.',
  },
  {
    question: 'Bisakah saya menggunakan logo dan nama bisnis saya sendiri pada invoice?',
    answer: 'Tentu saja. Ini adalah salah satu fitur utama kami untuk membantu Anda terlihat profesional di mata klien. Anda dapat mengunggah logo bisnis, mengatur warna template invoice agar sesuai dengan brand Anda, dan menambahkan nama serta kontak bisnis Anda dengan mudah. Klien Anda akan menerima invoice yang cantik dan bonafide.',
  },
  {
    question: 'Bagaimana cara mengirim invoice ke klien saya?',
    answer: 'NotaBener memberikan fleksibilitas penuh. Setelah invoice dibuat, Anda bisa mengirimnya langsung dari aplikasi melalui WhatsApp (dengan tautan invoice yang bisa diklik) atau melalui Email profesional. Anda juga bisa mengunduh invoice dalam format PDF untuk dicetak atau dikirim manual.',
  },
  {
    question: 'Apakah NotaBener menyediakan fitur pengingat tagihan?',
    answer: 'Ya. Fitur ini sangat membantu Anda mengelola tagihan dengan Fitur Kirim Reminder. Anda dapat mengirimkan email pengingat (reminder) kepada klien Anda sebelum jatuh tempo, pada hari jatuh tempo, atau setelah jatuh tempo. Anda tidak akan lagi lupa menagih!',
  },
  {
    question: 'Apakah ada plan Gratis (Forever Free)?',
    answer: 'Ya, kami memiliki Plan Gratis yang bisa Anda gunakan selamanya. Plan ini sangat cocok untuk freelancer atau UMKM pemula yang baru ingin mencoba. Anda dapat membuat dan mengirimkan sejumlah invoice (nota penagihan) terbatas per bulan tanpa biaya sama sekali. Tidak butuh kartu kredit untuk mendaftar.',
  },
  {
    question: 'Apa saja fitur yang ada di Plan Pro (Berlangganan)?',
    answer: 'Plan Pro dirancang untuk bisnis yang lebih mapan dengan kebutuhan volume yang lebih tinggi. Fitur tambahannya meliputi: Pembuatan Invoice Tak Terbatas (Unlimited Invoices), Laporan Kas Masuk Sederhana, Integrasi Pembayaran Digital (opsional), Halaman Pembayaran Klien yang Bermerek, dan Pengingat Tagihan Otomatis yang Lebih Lanjut.',
  },
  {
    question: 'Bagaimana dengan keamanan data keuangan saya?',
    answer: 'Keamanan data Anda adalah prioritas utama kami. NotaBener menggunakan enkripsi SSL (Secure Sockets Layer) standar industri (seperti yang digunakan perbankan online) untuk melindungi semua data yang Anda kirim dan terima di platform kami. Data keuangan Anda disimpan secara aman di server tepercaya dengan pencadangan (backup) rutin. Kami tidak akan pernah membagikan atau menjual data Anda kepada pihak ketiga.',
  },
  {
    question: 'Bisakah saya mengekspor data invoice saya ke format lain?',
    answer: 'Ya. Anda dapat mengekspor daftar invoice Anda ke format Excel (CSV) untuk keperluan pencatatan eksternal atau pelaporan pajak sederhana. Anda juga bisa mengunduh setiap invoice individu dalam format PDF.',
  },
]

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Deep Teal */}
      <header className="sticky top-0 z-50 bg-[#0A637D] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo textClassName="!text-white" />

            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-white/80 hover:text-white transition-colors font-medium">
                Fitur
              </Link>
              <Link href="#pricing" className="text-white/80 hover:text-white transition-colors font-medium">
                Harga
              </Link>
              <Link href="#faq" className="text-white/80 hover:text-white transition-colors font-medium">
                FAQ
              </Link>
              <Link href="/login" className="px-6 py-2.5 btn-primary">
                Mulai Gratis
              </Link>
            </nav>

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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 animate-slide-in-right">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <Logo size="sm" />
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5 text-text-primary" />
                </button>
              </div>

              <nav className="space-y-2">
                <Link href="#features" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-primary hover:bg-brand-50 hover:text-brand-600 transition-colors font-medium">
                  <Zap className="w-5 h-5" /> Fitur
                </Link>
                <Link href="#pricing" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-primary hover:bg-brand-50 hover:text-brand-600 transition-colors font-medium">
                  <CreditCard className="w-5 h-5" /> Harga
                </Link>
                <Link href="#faq" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-primary hover:bg-brand-50 hover:text-brand-600 transition-colors font-medium">
                  <MessageCircle className="w-5 h-5" /> FAQ
                </Link>
              </nav>

              <div className="mt-8 space-y-3">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center px-6 py-3 border-2 border-brand-500 text-brand-500 font-bold rounded-xl hover:bg-brand-50 transition-colors">
                  Masuk
                </Link>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center px-6 py-3 bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30">
                  Mulai Gratis
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* A. Hero Section */}
      <section className="py-20 md:py-28 hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center md:text-left">
              <div className="badge badge-brand mb-6 inline-flex items-center gap-2 animate-pulse-soft">
                <Sparkles className="w-4 h-4" />
                <span>Gratis untuk mulai, powerful untuk berkembang</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-500 mb-6 leading-tight">
                Bikin Nota Tagihan{' '}
                <span className="text-primary-500">
                  Profesional
                </span>{' '}
                dalam{' '}
                <span className="text-primary-500 font-extrabold">
                  60 Detik
                </span>
                .
              </h1>

              <p className="text-lg text-text-secondary mb-8 max-w-xl mx-auto md:mx-0 leading-relaxed">
                Gak pakai ribet Excel, Word atau Canva. NotaBener membantu Freelancer &amp; UMKM kirim tagihan instan. Kelola tagihan dengan NotaBener, platform yang intuitif dan mudah digunakan.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-8">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 btn-primary font-semibold text-lg"
                >
                  Mulai Kirim Nota (Gratis!)
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 btn-secondary font-semibold"
                >
                  Kenapa NotaBener
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2 text-text-secondary text-sm">
                  <div className="w-5 h-5 rounded-full bg-success-400 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span>Tanpa Ribet</span>
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
              <div className="bg-white rounded-3xl shadow-card-hover p-6 md:p-8 border border-gray-100 animate-float">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-brand">
                      <span className="font-bold text-white text-sm tracking-tight">NotaBener</span>
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

              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-brand flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Data Aman & Terenkripsi
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Types Marquee Section */}
      <section className="py-16 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-brand-500">
            Dibuat untuk Semua Jenis Bisnis yang Sedang Berkembang
          </h2>
        </div>

        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          {mounted ? (
            <div className="flex animate-marquee w-max">
              {businessTypes.map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="marquee-card mx-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-text-primary">{item.label}</span>
                  </div>
                )
              })}
              {businessTypes.map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={`dup-${i}`} className="marquee-card mx-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-text-primary">{item.label}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex overflow-hidden">
              {businessTypes.map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="marquee-card mx-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-text-primary">{item.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* B. Problem & Solution Section */}
      <section className="py-20 bg-surface-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-500 mb-4">
              Capek Urus Invoice Manual?
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Kami paham rasa sakitnya. Itulah kenapa NotaBener dibuat.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* The Pain */}
            <div className="bg-white rounded-3xl p-8 shadow-card border border-red-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-red-600">Tanpa NotaBener</h3>
              </div>
              <ul className="space-y-5">
                {[
                  'Invoice berantakan di Excel/Word',
                  'Lupa menagih, kas jadi macet',
                  'Tampilan invoice tidak profesional',
                  'Pusing hitung total dan PPN manual',
                ].map((pain, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <XCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <span className="text-text-secondary leading-relaxed">{pain}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* The Cure */}
            <div className="bg-white rounded-3xl p-8 shadow-card border border-green-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-700">Dengan NotaBener</h3>
              </div>
              <ul className="space-y-5">
                {[
                  { title: 'Satu Dashboard', desc: 'Pantau semua tagihan di satu tempat' },
                  { title: 'Otomatis & Akurat', desc: 'Hitung total, diskon, dan pajak instan' },
                  { title: 'Template Profesional', desc: 'Pilih desain invoice siap pakai' },
                ].map((cure, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <span className="font-semibold text-text-primary">{cure.title}</span>
                      <p className="text-text-secondary text-sm">{cure.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* C. Features & Benefits Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-500 mb-4">
              Fitur yang Bikin Tagihan Jadi Gampang
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Setiap fitur dirancang untuk mempermudah hidup Anda
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'Bikin Nota Cepat',
                desc: 'Buat invoice profesional dalam hitungan detik dengan template yang siap pakai.',
                benefit: 'Hemat Waktu',
                iconColor: 'text-primary-500',
                iconBg: 'bg-primary-50',
              },
              {
                icon: Send,
                title: 'Kirim Lewat WhatsApp & Email',
                desc: 'Invoice langsung sampai ke tangan klien melalui WhatsApp atau email profesional.',
                benefit: 'Penagihan Lebih Cepat',
                iconColor: 'text-green-600',
                iconBg: 'bg-green-50',
              },
              {
                icon: BarChart3,
                title: 'Laporan Tagihan Sederhana',
                desc: 'Lihat status tagihan — lunas, pending, atau jatuh tempo — dalam satu tampilan.',
                benefit: 'Tagihan Lebih Terkontrol',
                iconColor: 'text-blue-600',
                iconBg: 'bg-blue-50',
              },
              {
                icon: Bell,
                title: 'Pengingat Tagihan',
                desc: 'Kirim reminder otomatis ke klien sebelum dan setelah jatuh tempo.',
                benefit: 'Tagihan Lancar Tanpa Lupa',
                iconColor: 'text-amber-600',
                iconBg: 'bg-amber-50',
              },
              {
                icon: FileText,
                title: 'Nota Profesional',
                desc: 'Desain invoice yang menarik dan bisa dikustomisasi dengan logo bisnis Anda.',
                benefit: 'Tampil Profesional di Mata Klien',
                iconColor: 'text-purple-600',
                iconBg: 'bg-purple-50',
              },
              {
                icon: Cloud,
                title: 'Berbasis Cloud',
                desc: 'Akses data invoice dari mana saja dan kapan saja — cukup dengan browser.',
                benefit: 'Kerja dari Mana Saja',
                iconColor: 'text-brand-600',
                iconBg: 'bg-brand-50',
              },
            ].map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="card card-hover p-8">
                  <div className={`icon-box ${feature.iconBg} mb-6`}>
                    <Icon className={`w-7 h-7 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-brand-500 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-text-secondary leading-relaxed mb-4">
                    {feature.desc}
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-600">
                    <Zap className="w-3 h-3" />
                    {feature.benefit}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* D. Social Proof Section */}
      <section className="py-20 bg-surface-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-primary-500 font-semibold mb-2 uppercase tracking-wide text-sm">Testimoni</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-500 mb-4">
              100+ UMKM Telah Bergabung
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Mereka sudah merasakan kemudahan mengelola tagihan dengan NotaBener
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Andi Pratama',
                role: 'Owner, CV Maju Bersama',
                quote: 'Sebelumnya pusing banget urus invoice pakai Excel. Sekarang dengan NotaBener, semua tagihan terkontrol dan klien langsung terima invoice profesional via WhatsApp.',
                initials: 'AP',
                color: 'bg-blue-500',
              },
              {
                name: 'Siti Nurhaliza',
                role: 'Freelance Graphic Designer',
                quote: 'NotaBener banget buat freelancer kayak saya. Gak perlu buat invoice dari nol, tinggal isi dan kirim. Penagihan jadi lebih cepat dan profesional!',
                initials: 'SN',
                color: 'bg-primary-500',
              },
              {
                name: 'Budi Santoso',
                role: 'Owner, Toko Elektronik Jaya',
                quote: 'Fitur pengingat tagihan sangat membantu. Saya gak pernah lagi lupa menagih klien. Kas jadi lancar dan bisnis bisa berkembang.',
                initials: 'BS',
                color: 'bg-brand-500',
              },
            ].map((testimonial, i) => (
              <div key={i} className="card p-8">
                <Quote className="w-10 h-10 text-primary-200 mb-4" />
                <p className="text-text-secondary leading-relaxed mb-6">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full ${testimonial.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{testimonial.name}</p>
                    <p className="text-sm text-text-muted">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* E. Pricing Section */}
      <LandingPricing />

      {/* F. FAQ Section */}
      {mounted && (
        <section id="faq" className="py-20 bg-surface-light">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-500 mb-4">
                Pertanyaan yang Sering Diajukan
              </h2>
              <p className="text-lg text-text-secondary">
                Temukan jawaban dari pertanyaan umum tentang NotaBener
              </p>
            </div>

            <div className="space-y-4">
              {faqItems.map((faq, i) => (
                <div key={i} className="card overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-6 text-left"
                  >
                    <span className="font-semibold text-brand-500 pr-4">{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-primary-500 flex-shrink-0 transition-transform duration-200 ${
                        openFaq === i ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-6 pt-0">
                      <p className="text-text-secondary leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <p className="text-text-secondary">
                Masih punya pertanyaan lain?{' '}
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 font-semibold hover:text-primary-600 transition-colors"
                >
                  Hubungi tim support kami melalui WhatsApp
                </a>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* G. CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="cta-gradient rounded-3xl p-12 md:p-16 text-center shadow-brand-lg">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Yuk, Mulai Mengelola Invoice yang Bener!
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Ribet pakai Excel, Word atau Canva? NotaBener bikin urusan invoice jadi gampang. Daftar gratis, upgrade kapan saja bisnis Anda berkembang.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-[#EF3F0A] text-white rounded-xl font-bold text-lg hover:bg-[#d43608] shadow-lg transition-all"
            >
              Coba Gratis Sekarang
            </Link>
            <p className="mt-6 text-white text-sm opacity-90">
              Data tersimpan aman &bull; Siap dalam 2 menit
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
                Platform invoice profesional untuk UMKM dan bisnis Indonesia.
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
                <li>
                  <a href="#faq" className="text-white/80 hover:text-white transition-colors">
                    FAQ
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
                  <a href="/terms" className="text-white/80 hover:text-white transition-colors">
                    Syarat &amp; Ketentuan
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="text-white/80 hover:text-white transition-colors">
                    Kebijakan Privasi
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/20 text-center text-sm">
            <p className="text-white/80">&copy; 2024 NotaBener. Dibuat dengan Benar untuk UMKM dan Bisnis Indonesia.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
