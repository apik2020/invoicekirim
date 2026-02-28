'use client'

import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="id">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            {/* Critical Error Card */}
            <div className="bg-white rounded-3xl shadow-2xl shadow-red-200/50 overflow-hidden">
              {/* Danger Header */}
              <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 p-10 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
                </div>
                <div className="relative flex flex-col items-center text-center">
                  {/* Error Icon with Pulse */}
                  <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 animate-pulse">
                    <AlertTriangle className="w-12 h-12 text-white" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                    Error Sistem Kritis
                  </h1>
                  <p className="text-white/90 mt-2">Something went seriously wrong</p>
                </div>
              </div>

              {/* Error Content */}
              <div className="p-8">
                {/* Error Message */}
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8">
                  <p className="text-gray-800 text-center font-medium mb-2">
                    Terjadi kesalahan sistem yang serius
                  </p>
                  <p className="text-gray-600 text-center text-sm">
                    Aplikasi mengalami error yang tidak dapat dipulihkan. Tim teknis kami telah diberitahu secara otomatis dan sedang bekerja untuk memperbaikinya.
                  </p>
                </div>

                {/* Error Details (Development Only) */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mb-8 p-4 bg-red-50 rounded-xl border-2 border-red-300">
                    <p className="text-sm font-bold text-red-900 mb-3">🔴 Development Mode - Error Details:</p>
                    <div className="bg-red-100 rounded-lg p-4 mb-3 overflow-x-auto">
                      <p className="text-sm text-red-900 font-mono break-words whitespace-pre-wrap">
                        {error.message}
                      </p>
                    </div>
                    {error.stack && (
                      <details className="mt-3">
                        <summary className="text-xs font-semibold text-red-800 cursor-pointer hover:text-red-900">
                          View Stack Trace
                        </summary>
                        <pre className="mt-2 p-3 bg-red-900/10 rounded-lg text-xs text-red-900 font-mono overflow-x-auto">
                          {error.stack}
                        </pre>
                      </details>
                    )}
                    {error.digest && (
                      <p className="text-xs text-red-700 mt-3 font-mono bg-red-200 inline-block px-3 py-1 rounded">
                        Error ID: {error.digest}
                      </p>
                    )}
                  </div>
                )}

                {/* What Happened */}
                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                  <h3 className="font-semibold text-gray-900 mb-3">Yang mungkin terjadi:</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>Server sedang mengalami maintenance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>Koneksi database terganggu</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>Konfigurasi sistem bermasalah</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>Update sistem sedang berlangsung</span>
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => reset()}
                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 transition-all font-medium shadow-lg shadow-red-200"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Muat Ulang Aplikasi
                  </button>
                  <Link
                    href="/"
                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
                  >
                    <Home className="w-5 h-5" />
                    ke Beranda
                  </Link>
                </div>
              </div>
            </div>

            {/* Support Contact */}
            <div className="mt-8 text-center">
              <div className="inline-flex flex-col sm:flex-row items-center gap-3 px-6 py-4 bg-white rounded-xl shadow-lg">
                <p className="text-sm text-gray-700">Masih mengalami masalah?</p>
                <a
                  href="mailto:support@invoicekirim.com"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
                >
                  Hubungi Support Team
                </a>
              </div>
              {error.digest && (
                <p className="text-xs text-gray-500 mt-3">
                  Error ID: <code className="bg-gray-200 px-2 py-1 rounded">{error.digest}</code>
                </p>
              )}
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
