'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { TwoFactorSetup } from '@/components/settings/TwoFactorSetup'
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Check,
  AlertCircle,
  Shield,
  KeyRound,
} from 'lucide-react'

export default function SecurityPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!session) {
      router.push('/login')
    }
  }, [session, router])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Password baru tidak cocok' })
      setLoading(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password minimal 6 karakter' })
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Password berhasil diubah!' })
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal mengubah password' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while checking session
  if (!session) {
    return (
      <DashboardLayout title="Keamanan">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Memuat...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Keamanan">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-500 mb-2">Keamanan</h1>
        <p className="text-text-secondary">
          Kelola keamanan akun dan password Anda
        </p>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-success-50 border border-success-200 text-success-800'
              : 'bg-primary-50 border border-primary-200 text-primary-800'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Security Overview */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-brand-500" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Status Akun</p>
              <p className="font-bold text-success-600">Aman</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-brand-500" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Login Method</p>
              <p className="font-bold text-text-primary">Email & Password</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
              <Lock className="w-6 h-6 text-brand-500" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Password</p>
              <p className="font-bold text-text-primary">••••••••</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="card p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-6 h-6 text-brand-500" />
            <h2 className="text-xl font-bold text-brand-500">Ganti Password</h2>
          </div>
          <p className="text-text-secondary">
            Pastikan password baru kuat dan aman. Gunakan kombinasi huruf, angka, dan simbol.
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-6 max-w-lg">
          {/* Current Password */}
          <div>
            <label className="input-label">Password Saat Ini</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-text-muted" />
              </div>
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                className="input pl-12 pr-12"
                placeholder="Masukkan password saat ini"
                required
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                }
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-brand-500 transition-colors"
              >
                {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="input-label">Password Baru</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-text-muted" />
              </div>
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                className="input pl-12 pr-12"
                placeholder="Masukkan password baru (minimal 6 karakter)"
                required
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                }
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-brand-500 transition-colors"
              >
                {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="input-label">Konfirmasi Password Baru</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-text-muted" />
              </div>
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                className="input pl-12 pr-12"
                placeholder="Ulangi password baru"
                required
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                }
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-brand-500 transition-colors"
              >
                {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Password Tips */}
          <div className="p-4 rounded-xl bg-secondary-50 border border-secondary-200">
            <p className="text-sm text-secondary-800 font-medium mb-2">Tips Password Aman:</p>
            <ul className="text-sm text-secondary-700 space-y-1 list-disc list-inside">
              <li>Minimal 6 karakter</li>
              <li>Kombinasi huruf besar dan kecil</li>
              <li>Sertakan angka dan simbol</li>
              <li>Hindari informasi pribadi yang mudah ditebak</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-8 py-4 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Ubah Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="mt-8">
        <TwoFactorSetup
          isEnabled={twoFactorEnabled}
          onStatusChange={setTwoFactorEnabled}
        />
      </div>
    </DashboardLayout>
  )
}
