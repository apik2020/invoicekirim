import { FileX, Home, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function DashboardNotFound() {
  const dashboardPages = [
    { href: '/dashboard/invoices', label: 'Invoices', desc: 'Kelola invoice Anda', emoji: '📄' },
    { href: '/dashboard/clients', label: 'Klien', desc: 'Daftar klien Anda', emoji: '👥' },
    { href: '/dashboard/templates', label: 'Template', desc: 'Template invoice', emoji: '📝' },
    { href: '/dashboard/items', label: 'Item', desc: 'Item & produk', emoji: '📦' },
    { href: '/dashboard/billing', label: 'Billing', desc: 'Langganan & pembayaran', emoji: '💳' },
  ]

  return (
    <div className="min-h-screen bg-fresh-bg flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-orange-400 via-pink-500 to-purple-500 p-10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full"></div>
            </div>
            <div className="relative text-center">
              <div className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
                <FileX className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">404</h1>
              <p className="text-white/90 mt-2">Halaman Dashboard Tidak Ditemukan</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <p className="text-gray-600 text-center mb-8 max-w-lg mx-auto">
              Halaman dashboard yang Anda cari tidak dapat ditemukan atau mungkin telah dipindahkan.
            </p>

            {/* Quick Links Grid */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">
                Halaman Dashboard yang Mungkin Anda Cari:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {dashboardPages.map((page) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    className="group p-4 rounded-xl border-2 border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{page.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                          {page.label}
                        </p>
                        <p className="text-xs text-gray-500">{page.desc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 transition-all font-semibold shadow-lg shadow-orange-200"
              >
                <Home className="w-5 h-5" />
                ke Dashboard Utama
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all font-semibold"
              >
                ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
