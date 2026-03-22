'use client'

import { useState, useEffect } from 'react'
import { useAppSession } from '@/hooks/useAppSession'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import {
  User,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react'

export default function ProfilPage() {
  const { data: session, update } = useAppSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Profile State
  const [profile, setProfile] = useState({
    name: '',
  })

  // Fetch user profile
  useEffect(() => {
    if (session?.user) {
      fetchProfile()
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      const data = await res.json()

      if (res.ok) {
        setProfile({
          name: data.name || '',
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Profil berhasil disimpan!' })
        await update()
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal menyimpan profil' })
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
      <DashboardLayout title="Profil">
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
    <DashboardLayout title="Profil">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-500 mb-2">Profil</h1>
        <p className="text-text-secondary">
          Kelola informasi akun pribadi Anda
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

      {/* Profile Form */}
      <div className="card p-8 max-w-2xl">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-brand-500 mb-2">
            Informasi Akun
          </h2>
          <p className="text-text-secondary">
            Nama Anda akan ditampilkan di dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nama */}
          <div>
            <label className="input-label">Nama Anda</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-text-muted" />
              </div>
              <input
                type="text"
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                className="input pl-12"
                placeholder="John Doe"
              />
            </div>
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="input-label">Email</label>
            <div className="relative">
              <input
                type="email"
                value={session.user?.email || ''}
                className="input bg-secondary-50 cursor-not-allowed"
                disabled
              />
            </div>
            <p className="text-xs text-text-muted mt-1">
              Email tidak dapat diubah
            </p>
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
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Simpan Profil</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 rounded-xl bg-brand-50 border border-brand-200 max-w-2xl">
        <p className="text-sm text-brand-800">
          <strong>Tips:</strong> Untuk mengatur tampilan invoice dan pengaturan email, kunjungi halaman{' '}
          <a href="/dashboard/settings/branding" className="underline font-medium hover:text-brand-600">
            Pengaturan Invoice
          </a>.
        </p>
      </div>
    </DashboardLayout>
  )
}
