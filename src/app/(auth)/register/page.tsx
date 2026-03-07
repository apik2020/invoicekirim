'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { AlertBox } from '@/components/Toast'

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true)
    signIn('google', {
      callbackUrl: '/dashboard'
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok')
      return
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registrasi gagal')
      }

      router.push('/login?registered=true')
    } catch (err: any) {
      setError(err.message)
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
              href="/"
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 btn-secondary"
            >
              Kembali
            </Link>
          </nav>
        </div>
      </header>

      {/* Register Form */}
      <div className="flex-1 flex items-center justify-center py-8 sm:py-12 md:py-16 px-4">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Logo/Icon */}
          <div className="text-center mb-8 sm:mb-10">
            <div className="auth-icon">
              <span className="font-bold text-white text-2xl sm:text-3xl tracking-tight">[iK]</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-brand-500 mb-2 sm:mb-3 tracking-tight">
              Buat Akun Baru
            </h1>
            <p className="text-text-secondary text-sm sm:text-base">
              Mulai buat invoice profesional sekarang
            </p>
          </div>

          {/* Form Card */}
          <div className="auth-card">
            {error && (
              <div className="mb-6 animate-scale-in">
                <AlertBox type="error" title="Registrasi Gagal">
                  {error}
                </AlertBox>
              </div>
            )}

            {/* Google Sign Up Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="auth-social-btn"
            >
              {isGoogleLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memproses...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Daftar dengan Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="auth-divider">
              <div className="auth-divider-line"></div>
              <span className="auth-divider-text">atau</span>
              <div className="auth-divider-line"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Name */}
              <div>
                <label className="input-label">Nama Lengkap</label>
                <div className="relative">
                  <div className="auth-input-icon">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="auth-input"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="input-label">Email</label>
                <div className="relative">
                  <div className="auth-input-icon">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="auth-input"
                    placeholder="nama@email.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <div className="auth-input-icon">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="auth-input pr-12"
                    placeholder="Min. 6 karakter"
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
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="auth-input pr-12"
                    placeholder="Ulangi password"
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

              {/* Terms */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  required
                />
                <span className="text-sm text-text-secondary">
                  Dengan mendaftar, Anda menyetujui{' '}
                  <a href="#" className="auth-link">Syarat & Ketentuan</a>
                  {' '}dan{' '}
                  <a href="#" className="auth-link">Kebijakan Privasi</a>
                </span>
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
                    <span>Daftar Sekarang</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Sign In Link */}
            <p className="mt-6 sm:mt-8 text-center text-text-secondary text-sm sm:text-base">
              Sudah punya akun?{' '}
              <Link href="/login" className="auth-link">
                Masuk
              </Link>
            </p>
          </div>

          {/* Back to Home - Mobile */}
          <p className="text-center mt-6 sm:hidden">
            <Link href="/" className="text-text-secondary hover:text-brand-500 text-sm transition-colors">
              ← Kembali ke halaman utama
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
