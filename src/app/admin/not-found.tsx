import { ShieldX, LayoutDashboard, Users, Mail, FileText, Home, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function AdminNotFound() {
  const adminPages = [
    {
      href: '/admin',
      label: 'Dashboard',
      desc: 'Overview statistik',
      icon: LayoutDashboard,
      color: 'from-blue-500 to-blue-600',
    },
    {
      href: '/admin/users',
      label: 'User Management',
      desc: 'Kelola pengguna',
      icon: Users,
      color: 'from-green-500 to-green-600',
    },
    {
      href: '/admin/email-templates',
      label: 'Email Templates',
      desc: 'Template email',
      icon: Mail,
      color: 'from-purple-500 to-purple-600',
    },
    {
      href: '/admin/activity-logs',
      label: 'Activity Logs',
      desc: 'Log aktivitas',
      icon: FileText,
      color: 'from-orange-500 to-orange-600',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-red-500 via-pink-600 to-purple-600 p-10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
            </div>
            <div className="relative text-center">
              <div className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
                <ShieldX className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Admin 404</h1>
              <p className="text-white/90 mt-2">Halaman Admin Tidak Ditemukan</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
              <p className="text-red-800 text-sm text-center">
                ⚠️ Anda mencoba mengakses halaman admin yang tidak ada. Pastikan URL benar.
              </p>
            </div>

            {/* Admin Pages Grid */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">
                Halaman Admin yang Tersedia:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {adminPages.map((page) => {
                  const Icon = page.icon
                  return (
                    <Link
                      key={page.href}
                      href={page.href}
                      className="group p-5 rounded-xl border-2 border-gray-100 hover:border-red-200 hover:shadow-lg hover:shadow-red-100 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${page.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                            {page.label}
                          </p>
                          <p className="text-xs text-gray-500">{page.desc}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 transition-all font-semibold shadow-lg shadow-red-200"
              >
                <LayoutDashboard className="w-5 h-5" />
                ke Admin Dashboard
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all font-semibold"
              >
                <Home className="w-5 h-5" />
                ke User Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
