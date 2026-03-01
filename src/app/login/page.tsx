'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function LoginPage() {
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
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email atau password salah')
      } else {
        // Redirect based on role
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-fresh-bg flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center justify-between">
            <Logo size="lg" />

            <Link
              href="/"
              className="flex items-center gap-2 px-5 py-2.5 text-gray-600 font-medium rounded-xl btn-secondary"
            >
              Kembali
            </Link>
          </nav>
        </div>
      </header>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          {/* Logo/Icon */}
          <div className="text-center mb-10">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-6 animate-float shadow-xl shadow-orange-200">
              <span className="font-bold text-white text-3xl tracking-tight">[iK]</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              Selamat Datang
            </h1>
            <p className="text-gray-600">
              Masuk untuk mulai buat invoice profesional
            </p>
          </div>

          {/* Form Card */}
          <div className="card p-10">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="nama@email.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-orange-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded-xl border-2 border-orange-200 accent-orange-500"
                  />
                  <span className="text-sm text-gray-600">Ingat saya</span>
                </label>
                <a href="#" className="text-sm text-gray-900 hover:text-orange-600 font-medium">
                  Lupa password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 text-white font-bold text-lg rounded-xl btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  'Memproses...'
                ) : (
                  <>
                    Masuk
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <p className="mt-8 text-center text-gray-600">
              Belum punya akun?{' '}
              <Link href="/register" className="text-orange-600 font-bold hover:text-orange-700">
                Daftar sekarang
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <p className="text-center mt-8">
            <Link href="/" className="text-gray-600 hover:text-orange-600 text-sm transition-colors">
              ← Kembali ke halaman utama
            </Link>
          </p>

          {/* Admin Login Link */}
          <p className="text-center">
            <Link href="/admin/login" className="text-gray-500 hover:text-pink-600 text-sm transition-colors">
              🔐 Login Admin
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
