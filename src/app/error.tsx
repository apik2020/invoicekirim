'use client'

import { useEffect, useState } from 'react'
import { AlertOctagon, RefreshCw, Home, ArrowLeft, Bug, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  const handleReset = () => {
    setIsRetrying(true)
    setTimeout(() => {
      reset()
      setIsRetrying(false)
    }, 500)
  }

  const getErrorType = () => {
    const message = error.message.toLowerCase()
    if (message.includes('network') || message.includes('fetch')) return 'connection'
    if (message.includes('permission') || message.includes('unauthorized')) return 'permission'
    if (message.includes('not found')) return 'notfound'
    return 'general'
  }

  const errorType = getErrorType()

  const errorMessages = {
    connection: {
      title: 'Koneksi Bermasalah',
      message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.',
      icon: '🔌',
    },
    permission: {
      title: 'Akses Ditolak',
      message: 'Anda tidak memiliki izin untuk mengakses halaman ini.',
      icon: '🔒',
    },
    notfound: {
      title: 'Tidak Ditemukan',
      message: 'Sumber daya yang Anda cari tidak dapat ditemukan.',
      icon: '🔍',
    },
    general: {
      title: 'Oops! Terjadi Kesalahan',
      message: 'Terjadi kesalahan yang tidak terduga. Tim kami telah diberitahu dan sedang memperbaikinya.',
      icon: '⚠️',
    },
  }

  const currentError = errorMessages[errorType]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Error Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-orange-200/50 overflow-hidden">
          {/* Decorative Header */}
          <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 p-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
            </div>
            <div className="relative flex flex-col items-center text-center">
              {/* Error Icon Animation */}
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 animate-pulse">
                <span className="text-5xl">{currentError.icon}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                {currentError.title}
              </h1>
            </div>
          </div>

          {/* Error Content */}
          <div className="p-8">
            {/* Error Message */}
            <p className="text-gray-600 text-center text-lg mb-8">
              {currentError.message}
            </p>

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

            {/* What You Can Do */}
            <div className="bg-blue-50 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-blue-900 mb-3">Yang dapat Anda lakukan:</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Refresh halaman dan coba lagi</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Periksa koneksi internet Anda</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Clear cache browser Anda</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Hubungi support jika masalah berlanjut</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button
                onClick={handleReset}
                disabled={isRetrying}
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 transition-all font-medium shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-5 h-5 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Memuat Ulang...' : 'Coba Lagi'}
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
              >
                <Home className="w-5 h-5" />
                ke Dashboard
              </button>
            </div>

            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Halaman Sebelumnya
            </button>
          </div>
        </div>

        {/* Support Contact */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-3">Masih mengalami masalah?</p>
          <a
            href="mailto:support@invoicekirim.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow text-gray-700 font-medium"
          >
            <Mail className="w-5 h-5 text-orange-500" />
            Hubungi Support Team
          </a>
          <p className="text-xs text-gray-500 mt-3">
            Sertakan Error ID ini untuk bantuan lebih cepat:{' '}
            {error.digest && (
              <code className="bg-gray-200 px-2 py-1 rounded">{error.digest}</code>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
