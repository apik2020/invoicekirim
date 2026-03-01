'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Crown, Sparkles, Check } from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    plan: 'trial', // 'free' or 'trial'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok')
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

      {/* Register Form */}
      <div className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          {/* Logo/Icon */}
          <div className="text-center mb-10">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-6 animate-float shadow-xl shadow-orange-200">
              <span className="font-bold text-white text-3xl tracking-tight">[iK]</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              Buat Akun Baru
            </h1>
            <p className="text-gray-600">
              Mulai buat invoice profesional sekarang
            </p>
          </div>

          {/* Form Card */}
          <div className="card p-10">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

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

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-orange-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Plan Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Pilih Paket
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* FREE Plan */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, plan: 'free' })}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      formData.plan === 'free'
                        ? 'border-gray-400 bg-gray-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {formData.plan === 'free' && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gray-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">FREE</h3>
                    <p className="text-xs text-gray-500">10 invoice/bulan</p>
                    <p className="text-xs text-gray-500">Fitur dasar</p>
                  </button>

                  {/* Trial PRO Plan */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, plan: 'trial' })}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      formData.plan === 'trial'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 bg-white hover:border-orange-300'
                    }`}
                  >
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold">
                      POPULER
                    </div>
                    {formData.plan === 'trial' && (
                      <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center mb-3">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">Trial PRO</h3>
                    <p className="text-xs text-gray-500">7 hari gratis</p>
                    <p className="text-xs text-gray-500">Semua fitur premium</p>
                  </button>
                </div>
                {formData.plan === 'trial' && (
                  <div className="mt-3 p-3 rounded-lg bg-orange-50 border border-orange-200 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-orange-700">
                      Nikmati semua fitur PRO selama 7 hari tanpa kartu kredit. Setelah trial, pilih untuk upgrade atau gunakan paket FREE.
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 text-white font-bold text-lg rounded-xl btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Memproses...' : (
                  <>
                    Daftar Sekarang
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Sign In Link */}
            <p className="mt-8 text-center text-gray-600">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-orange-600 font-bold hover:text-orange-700">
                Masuk
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <p className="text-center mt-8">
            <Link href="/" className="text-gray-600 hover:text-orange-600 text-sm transition-colors">
              ← Kembali ke halaman utama
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
