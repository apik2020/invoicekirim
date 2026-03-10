'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { AlertBox } from '@/components/Toast'

const errorMessages: Record<string, string> = {
  required: 'Password harus diisi',
  invalid: 'Password tidak valid',
  weak: 'Password tidak memenuhi persyaratan keamanan',
  mismatch: 'Konfirmasi password tidak cocok',
  expired: 'Link reset sudah kadaluarsa. Silakan minta link baru.',
  default: 'Terjadi kesalahan',
}

const validatePassword = (password: string): boolean => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  )
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [tokenError, setTokenError] = useState('')

  // Check if token is valid on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenError('Token reset tidak valid')
        return
      }
      try {
        const res = await fetch(`/api/auth/verify-reset-token?token=${token}`)
        const data = await res.json()
        if (!data.valid) {
          setTokenError(data.error || 'Link reset tidak valid')
        }
      } catch (err) {
        setTokenError('Gagal memverifikasi token')
      }
    }
    verifyToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setTokenError('')

    // Validate inputs
    if (!formData.password) {
      setError(errorMessages.required)
      return
    }
    if (!validatePassword(formData.password)) {
      setError(errorMessages.weak)
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError(errorMessages.mismatch)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (data.error === 'expired') {
          setTokenError(errorMessages.expired)
        } else {
          throw new Error(data.error || 'Gagal mengubah password')
        }
        return
      }

      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : errorMessages.default)
    } finally {
      setIsLoading(false)
    }
  }

  const requirements = [
    { key: 'length', label: 'Minimal 8 karakter', pass: formData.password.length >= 8 },
    { key: 'uppercase', label: 'Huruf besar (A-Z)', pass: /[A-Z]/.test(formData.password) },
    { key: 'lowercase', label: 'Huruf kecil (a-z)', pass: /[a-z]/.test(formData.password) },
    { key: 'number', label: 'Angka (0-9)', pass: /[0-9]/.test(formData.password) },
  ]

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
              Reset Password
            </h1>
            <p className="text-text-secondary text-sm sm:text-base">
              Buat password baru untuk akun Anda
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

            {tokenError && (
              <div className="mb-6 animate-scale-in">
                <AlertBox type="error" title="Error">
                  {tokenError}
                </AlertBox>
              </div>
            )}

            {isSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-brand-500 mb-4">
                  Password Berhasil Diubah!
                </h2>
                <p className="text-text-secondary mb-6">
                  Password Anda telah berhasil diubah. Silakan login dengan password baru.
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
              <>
                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                  {/* Password Requirements */}
                  <div className="mb-4 p-4 bg-surface-light rounded-xl">
                    <p className="text-sm font-medium text-text-secondary mb-3">
                      Password Requirements
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {requirements.map((req) => (
                        <div
                          key={req.key}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                            req.pass ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {req.pass ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <div className="w-4 h-4 rounded border border-gray-300" />
                          )}
                          <span className="text-xs">{req.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="input-label">Password Baru</label>
                    <div className="relative">
                      <div className="auth-input-icon">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="auth-input pr-12"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="auth-toggle-password"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="input-label">Konfirmasi Password</label>
                    <div className="relative">
                      <div className="auth-input-icon">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({ ...formData, confirmPassword: e.target.value })
                        }
                        className="auth-input pr-12"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="auth-toggle-password"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
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
                        <span>Simpan Password</span>
                        <CheckCircle className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Back to Login */}
                <p className="mt-6 sm:mt-8 text-center text-text-secondary text-sm sm:text-base">
                  <Link href="/login" className="auth-link">
                    Kembali login
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
