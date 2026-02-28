'use client'

import { useEffect, useState } from 'react'
import { AlertOctagon, RefreshCw, LayoutDashboard, Mail, Bug } from 'lucide-react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    console.error('Admin error:', error)
  }, [error])

  const handleReset = () => {
    setIsRetrying(true)
    setTimeout(() => {
      reset()
      setIsRetrying(false)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Admin Error Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-red-200/50 overflow-hidden">
          {/* Decorative Header */}
          <div className="bg-gradient-to-r from-red-600 via-pink-600 to-orange-500 p-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 translate-y-1/2"></div>
            </div>
            <div className="relative flex flex-col items-center text-center">
              {/* Error Icon with Animation */}
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 animate-pulse">
                <AlertOctagon className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                Admin Panel Error
              </h1>
              <p className="text-white/90 mt-2">Terjadi kesalahan pada sistem admin</p>
            </div>
          </div>

          {/* Error Content */}
          <div className="p-8">
            {/* Security Notice */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">⚠️</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Security Notice</p>
                  <p className="text-xs text-amber-800 mt-1">
                    Error ini telah dicatat untuk keamanan. Aktivitas admin yang mencurigakan akan ditinjau.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && error.message && (
              <div className="mb-8 p-4 bg-red-50 rounded-xl border-2 border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <Bug className="w-5 h-5 text-red-600" />
                  <p className="text-sm font-semibold text-red-800">Error Details (Development)</p>
                </div>
                <div className="bg-red-100 rounded-lg p-3 overflow-x-auto">
                  <p className="text-sm text-red-900 font-mono break-words whitespace-pre-wrap">
                    {error.message}
                  </p>
                </div>
                {error.digest && (
                  <p className="text-xs text-red-600 mt-3 font-mono">
                    Error ID: <span className="bg-red-200 px-2 py-1 rounded">{error.digest}</span>
                  </p>
                )}
              </div>
            )}

            {/* Suggested Actions */}
            <div className="bg-slate-50 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-slate-900 mb-3">Langkah yang disarankan:</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">1.</span>
                  <span>Refresh halaman dan coba lagi</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">2.</span>
                  <span>Clear cache dan cookies browser</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">3.</span>
                  <span>Logout dan login kembali sebagai admin</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">4.</span>
                  <span>Hubungi technical support jika berlanjut</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button
                onClick={handleReset}
                disabled={isRetrying}
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 transition-all font-medium shadow-lg shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-5 h-5 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Memuat...' : 'Coba Lagi'}
              </button>
              <Link
                href="/admin"
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
              >
                <LayoutDashboard className="w-5 h-5" />
                ke Admin Dashboard
              </Link>
            </div>

            {/* Support Link */}
            <div className="text-center">
              <a
                href="mailto:support@invoicekirim.com"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors font-medium"
              >
                <Mail className="w-4 h-4" />
                Hubungi Technical Support
              </a>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Error Reference: {error.digest || 'N/A'} • Logged at {new Date().toISOString()}
          </p>
        </div>
      </div>
    </div>
  )
}
