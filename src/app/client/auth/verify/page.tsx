'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function ClientVerifyPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token')

      if (!token) {
        setStatus('error')
        setError('Token tidak ditemukan')
        return
      }

      try {
        const res = await fetch(`/api/client/auth/verify?token=${token}`)

        if (res.ok) {
          setStatus('success')
          setTimeout(() => {
            router.push('/client/dashboard')
          }, 1500)
        } else {
          const data = await res.json()
          setStatus('error')
          setError(data.error || 'Token tidak valid')
        }
      } catch (err) {
        setStatus('error')
        setError('Terjadi kesalahan saat verifikasi')
      }
    }

    verifyToken()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-surface-light flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-brand-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Memverifikasi...
            </h2>
            <p className="text-gray-600">
              Mohon tunggu sebentar
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Login Berhasil!
            </h2>
            <p className="text-gray-600">
              Mengalihkan ke dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Verifikasi Gagal
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'Link tidak valid atau sudah kadaluarsa'}
            </p>
            <button
              onClick={() => router.push('/client/auth/login')}
              className="px-6 py-3 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors"
            >
              Coba Lagi
            </button>
          </>
        )}
      </div>
    </div>
  )
}
