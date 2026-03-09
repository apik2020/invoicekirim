'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Loader2, ArrowLeft, Key } from 'lucide-react'
import { Logo } from '@/components/Logo'

interface TwoFactorChallengeProps {
  email: string
  callbackUrl?: string
}

export function TwoFactorChallenge({ email, callbackUrl }: TwoFactorChallengeProps) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [useBackup, setUseBackup] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || code.length < 6) {
      setError('Masukkan kode 6 digit')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code,
          isBackupCode: useBackup,
          callbackUrl,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Kode tidak valid')
      }

      // Redirect to callback URL or dashboard
      router.push(callbackUrl || '/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kode tidak valid')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    // Go back to login
    router.push('/login')
  }

  return (
    <div className="auth-container">
      {/* Header */}
      <header className="auth-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center justify-between">
            <Logo size="md" />
          </nav>
        </div>
      </header>

      {/* Challenge Form */}
      <div className="flex-1 flex items-center justify-center py-8 sm:py-12 md:py-16 px-4">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Icon */}
          <div className="text-center mb-8 sm:mb-10">
            <div className="auth-icon bg-gradient-to-br from-brand-500 to-brand-600 shadow-brand-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-brand-500 mb-2 sm:mb-3 tracking-tight">
              Two-Factor Authentication
            </h1>
            <p className="text-text-secondary text-sm sm:text-base">
              Masukkan kode dari aplikasi authenticator Anda
            </p>
          </div>

          {/* Form Card */}
          <div className="auth-card">
            {error && (
              <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-xl">
                <p className="text-sm text-primary-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <div>
                <label className="input-label">
                  {useBackup ? 'Kode Backup' : 'Kode Authenticator'}
                </label>
                <div className="relative">
                  <div className="auth-input-icon">
                    <Key className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, useBackup ? 8 : 6))}
                    placeholder={useBackup ? 'XXXXXXXX' : '000000'}
                    className="auth-input text-center tracking-widest text-lg font-mono"
                    autoFocus
                    autoComplete="one-time-code"
                  />
                </div>
                <p className="mt-2 text-xs text-text-muted text-center">
                  {useBackup
                    ? 'Masukkan salah satu kode backup Anda'
                    : 'Masukkan kode 6 digit dari aplikasi authenticator'}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="auth-submit-btn"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memverifikasi...</span>
                  </div>
                ) : (
                  <span>Verifikasi</span>
                )}
              </button>
            </form>

            {/* Toggle backup code */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setUseBackup(!useBackup)
                  setCode('')
                  setError('')
                }}
                className="text-sm text-brand-500 hover:text-brand-600 font-medium"
              >
                {useBackup
                  ? 'Gunakan kode authenticator'
                  : 'Tidak bisa akses authenticator? Gunakan kode backup'}
              </button>
            </div>

            {/* Back to login */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleBack}
                className="w-full flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-brand-500 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke login
              </button>
            </div>
          </div>

          {/* Help text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              Tidak bisa mengakses kode?{' '}
              <a href="mailto:support@invoicekirim.com" className="text-brand-500 hover:text-brand-600 font-medium">
                Hubungi support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
