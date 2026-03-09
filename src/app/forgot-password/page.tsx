'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { AlertBox } from '@/components/Toast'

const errorMessages: Record<string, string> = {
  required: 'Email harus diisi',
  invalid: 'Format email tidak valid',
  default: 'Terjadi kesalahan',
}

const validateEmail = (email: string): boolean => {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateEmail(email)) {
      setError(errorMessages.invalid)
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal mengirim email reset')
      }

      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : errorMessages.default)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      {/* Header */}
      <header className="auth-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center justify-between">
            <Logo size="md" />
            <Link
              href="/login"
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 btn-secondary"
            >
              Kembali
            </Link>
          </nav>
        </div>
      </header>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center py-8 sm:py-12 md:py-16 px-4">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Logo/Icon */}
          <div className="text-center mb-8 sm:mb-10">
            <div className="auth-icon">
              <span className="font-bold text-white text-2xl sm:text-3xl tracking-tight">[iK]</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-brand-500 mb-2 sm:mb-3">
              Lupa Password
            </h1>
            <p className="text-text-secondary text-sm sm:text-base">
              {isSuccess
                ? 'Cek email Anda untuk melanjutkan reset password'
                : 'Masukkan email terdaftar untuk menerima link reset password'}
            </p>
          </div>

          {/* Form Card */}
          <div className="auth-card">
            {error && (
              <div className="mb-6 animate-scale-in">
                <AlertBox type="error" title="Gagal">
                  {error}
                </AlertBox>
              </div>
            )}

            {isSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-brand-500 mb-4">
                  Email Terkirim!
                </h2>
                <p className="text-text-secondary mb-6">
                  Jika email terdaftar di sistem kami, kami telah mengirimkan link reset password ke email tersebut. Silakan cek folder spam jika tidak menemukan email di inbox.
                </p>
                <Link
                  href="/login"
                  className="btn-primary px-6 py-3 inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Kembali Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                {/* Email */}
                <div>
                  <label className="input-label">Email</label>
                  <div className="relative">
                    <div className="auth-input-icon">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="auth-input"
                      placeholder="nama@email.com"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="auth-submit-btn"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Memproses...</span>
                    </div>
                  ) : (
                    <>
                      <span>Kirim Link Reset</span>
                      <ArrowLeft className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Back to Login */}
            <p className="mt-6 sm:mt-8 text-center text-text-secondary text-sm sm:text-base">
              <Link href="/login" className="auth-link">
                Kembali login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
