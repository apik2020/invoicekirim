'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import { AdminLogo } from '@/components/Logo'
import { AlertBox } from '@/components/Toast'

export default function AdminLoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Email atau password salah')
      } else {
        router.push('/admin')
        router.refresh()
      }
    } catch {
      setError('Terjadi kesalahan saat login')
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
            <AdminLogo size="lg" linkToHome={false} />

            <Link
              href="/"
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 btn-secondary"
            >
              Kembali
            </Link>
          </nav>
        </div>
      </header>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center py-8 sm:py-12 md:py-16 px-4">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Logo/Icon */}
          <div className="text-center mb-8 sm:mb-10">
            <div className="auth-icon bg-gradient-to-br from-brand-500 to-brand-600 shadow-brand-lg p-0 overflow-hidden">
              <Image
                src="/images/notabener-icon.png"
                alt="NotaBener"
                width={80}
                height={80}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-brand-500 mb-2 sm:mb-3 tracking-tight">
              Admin Login
            </h1>
            <p className="text-text-secondary text-sm sm:text-base">
              Login untuk mengakses dashboard admin NotaBener
            </p>
          </div>

          {/* Login Card */}
          <div className="auth-card">
            {error && (
              <div className="mb-6 animate-scale-in">
                <AlertBox type="error" title="Login Gagal">
                  {error}
                </AlertBox>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="input-label">Email Admin</label>
                <div className="relative">
                  <div className="auth-input-icon">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    placeholder="admin@notabener.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="auth-input"
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
                    placeholder="•••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="auth-input pr-12"
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
                    <span>Login as Admin</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Notice */}
            <div className="mt-6 p-4 rounded-xl bg-brand-50 border border-brand-200">
              <p className="text-sm text-brand-700">
                <strong>Info:</strong> Gunakan akun admin khusus. Jangan gunakan akun user biasa.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-text-secondary text-sm sm:text-base">
              Login sebagai user biasa?{' '}
              <Link href="/login" className="auth-link">
                Klik di sini
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
