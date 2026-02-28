import { FileX, Home, Search, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  const popularPages = [
    { href: '/dashboard/invoices', label: 'Invoices', emoji: '📄' },
    { href: '/dashboard/clients', label: 'Klien', emoji: '👥' },
    { href: '/dashboard/templates', label: 'Template', emoji: '📝' },
    { href: '/dashboard/settings', label: 'Pengaturan', emoji: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        {/* 404 Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Illustration Section */}
          <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
              <div className="absolute top-20 right-20 w-24 h-24 bg-white rounded-full"></div>
              <div className="absolute bottom-10 left-1/2 w-40 h-40 bg-white rounded-full -translate-x-1/2"></div>
            </div>
            <div className="relative text-center">
              {/* 404 Number */}
              <div className="text-9xl md:text-[12rem] font-bold text-white/30 select-none">
                404
              </div>
              <div className="relative -mt-16">
                <div className="w-28 h-28 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <FileX className="w-16 h-16 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8 md:p-12 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Halaman Tidak Ditemukan
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
              Maaf, halaman yang Anda cari tidak dapat ditemukan, telah dipindahkan, atau mungkin tidak pernah ada.
            </p>

            {/* Search Box */}
            <div className="max-w-md mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari halaman..."
                  className="w-full px-5 py-4 pl-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Popular Pages */}
            <div className="mb-8">
              <p className="text-sm font-semibold text-gray-700 mb-4">Halaman Populer:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {popularPages.map((page) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 text-gray-700 hover:from-blue-100 hover:to-purple-100 transition-all font-medium"
                  >
                    <span>{page.emoji}</span>
                    {page.label}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all font-semibold shadow-lg shadow-blue-200"
              >
                <Home className="w-5 h-5" />
                ke Dashboard
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all font-semibold"
              >
                ke Beranda
              </Link>
            </div>
          </div>
        </div>

        {/* Help Suggestion */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-md">
            <span className="text-sm text-gray-600">Butuh bantuan?</span>
            <a
              href="mailto:support@invoicekirim.com"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Hubungi Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
