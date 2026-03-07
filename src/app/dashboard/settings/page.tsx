'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Check,
  User,
  Server,
  AlertCircle,
} from 'lucide-react'

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'company' | 'email'>('company')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; details?: string[] } | null>(null)

  // Email Settings State
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: '587',
    smtpSecure: false,
    smtpUser: '',
    smtpPass: '',
  })
  const [showEmailPassword, setShowEmailPassword] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)

  // Company Info State
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
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
        setCompanyInfo({
          name: data.name || '',
          companyName: data.companyName || '',
          companyEmail: data.companyEmail || '',
          companyPhone: data.companyPhone || '',
          companyAddress: data.companyAddress || '',
        })
        setEmailSettings({
          smtpHost: data.smtpHost || '',
          smtpPort: data.smtpPort || '587',
          smtpSecure: data.smtpSecure ?? false,
          smtpUser: data.smtpUser || '',
          smtpPass: '',
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
  }

  const handleSubmitCompanyInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyInfo),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Informasi perusahaan berhasil disimpan!' })
        await update({ name: companyInfo.name })
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal menyimpan informasi' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/user/email-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailSettings),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Pengaturan email berhasil disimpan!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal menyimpan pengaturan email' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setTestingEmail(true)
    setMessage(null)

    try {
      const res = await fetch('/api/user/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailSettings),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Email test berhasil dikirim ke ' + emailSettings.smtpUser })
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Gagal mengirim email test',
          details: data.details || []
        })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
    } finally {
      setTestingEmail(false)
    }
  }

  // Show loading state while checking session
  if (!session) {
    return (
      <DashboardLayout title="Pengaturan">
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
    <DashboardLayout title="Pengaturan">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-500 mb-2">Pengaturan</h1>
        <p className="text-text-secondary">
          Kelola informasi perusahaan dan pengaturan akun Anda
        </p>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-xl flex flex-col gap-2 ${
            message.type === 'success'
              ? 'bg-success-50 border border-success-200 text-success-800'
              : 'bg-primary-50 border border-primary-200 text-primary-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <Check className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
          {message.details && message.details.length > 0 && (
            <ul className="ml-8 list-disc text-sm">
              {message.details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => {
            setActiveTab('company')
            setMessage(null)
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'company'
              ? 'btn-primary'
              : 'btn-secondary'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span>Info Perusahaan</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('email')
            setMessage(null)
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'email'
              ? 'btn-primary'
              : 'btn-secondary'
          }`}
        >
          <Mail className="w-5 h-5" />
          <span>Pengaturan Email</span>
        </button>
      </div>

      {/* Company Info Tab */}
      {activeTab === 'company' && (
        <div className="card p-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-brand-500 mb-2">
              Informasi Perusahaan
            </h2>
            <p className="text-text-secondary">
              Informasi ini akan otomatis digunakan saat membuat invoice baru
            </p>
          </div>

          <form onSubmit={handleSubmitCompanyInfo} className="space-y-6">
            {/* Nama */}
            <div>
              <label className="input-label">Nama Anda</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-text-muted" />
                </div>
                <input
                  type="text"
                  value={companyInfo.name}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, name: e.target.value })
                  }
                  className="input pl-12"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Nama Perusahaan */}
            <div>
              <label className="input-label">Nama Perusahaan</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Building2 className="w-5 h-5 text-text-muted" />
                </div>
                <input
                  type="text"
                  value={companyInfo.companyName}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, companyName: e.target.value })
                  }
                  className="input pl-12"
                  placeholder="PT Contoh Indonesia"
                />
              </div>
            </div>

            {/* Email Perusahaan */}
            <div>
              <label className="input-label">Email Perusahaan</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-text-muted" />
                </div>
                <input
                  type="email"
                  value={companyInfo.companyEmail}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, companyEmail: e.target.value })
                  }
                  className="input pl-12"
                  placeholder="billing@contoh.com"
                />
              </div>
            </div>

            {/* Telepon Perusahaan */}
            <div>
              <label className="input-label">Telepon Perusahaan</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="w-5 h-5 text-text-muted" />
                </div>
                <input
                  type="tel"
                  value={companyInfo.companyPhone}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, companyPhone: e.target.value })
                  }
                  className="input pl-12"
                  placeholder="+62 812 3456 7890"
                />
              </div>
            </div>

            {/* Alamat Perusahaan */}
            <div>
              <label className="input-label">Alamat Perusahaan</label>
              <div className="relative">
                <div className="absolute top-4 left-4 pointer-events-none">
                  <MapPin className="w-5 h-5 text-text-muted" />
                </div>
                <textarea
                  value={companyInfo.companyAddress}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, companyAddress: e.target.value })
                  }
                  rows={4}
                  className="textarea pl-12"
                  placeholder="Jl. Contoh No. 123, Jakarta Selatan, Indonesia"
                />
              </div>
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
                    <span>Simpan Informasi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Email Settings Tab */}
      {activeTab === 'email' && (
        <div className="card p-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-brand-500 mb-2">
              Pengaturan Email
            </h2>
            <p className="text-text-secondary">
              Konfigurasi SMTP untuk mengirim invoice ke klien
            </p>
          </div>

          <form onSubmit={handleSubmitEmailSettings} className="space-y-6">
            {/* SMTP Host */}
            <div>
              <label className="input-label">SMTP Host</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Server className="w-5 h-5 text-text-muted" />
                </div>
                <input
                  type="text"
                  value={emailSettings.smtpHost}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                  className="input pl-12"
                  placeholder="smtp.gmail.com"
                />
              </div>
              <p className="text-xs text-text-muted mt-1">
                Contoh: smtp.gmail.com untuk Gmail, smtp-mail.outlook.com untuk Outlook
              </p>
            </div>

            {/* SMTP Port & Secure */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">SMTP Port</label>
                <input
                  type="text"
                  value={emailSettings.smtpPort}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                  className="input"
                  placeholder="587"
                />
                <p className="text-xs text-text-muted mt-1">
                  Port 587 untuk TLS, 465 untuk SSL
                </p>
              </div>

              <div>
                <label className="input-label">Koneksi Aman</label>
                <select
                  value={emailSettings.smtpSecure.toString()}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpSecure: e.target.value === 'true' })}
                  className="select"
                >
                  <option value="false">TLS (STARTTLS)</option>
                  <option value="true">SSL</option>
                </select>
                <p className="text-xs text-text-muted mt-1">
                  TLS untuk port 587, SSL untuk port 465
                </p>
              </div>
            </div>

            {/* SMTP User (Email) */}
            <div>
              <label className="input-label">Email Pengirim</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-text-muted" />
                </div>
                <input
                  type="email"
                  value={emailSettings.smtpUser}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                  className="input pl-12"
                  placeholder="your-email@gmail.com"
                />
              </div>
            </div>

            {/* SMTP Password */}
            <div>
              <label className="input-label">Password / App Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-text-muted" />
                </div>
                <input
                  type={showEmailPassword ? 'text' : 'password'}
                  value={emailSettings.smtpPass}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpPass: e.target.value })}
                  className="input pl-12 pr-12"
                  placeholder="Masukkan password atau app password"
                />
                <button
                  type="button"
                  onClick={() => setShowEmailPassword(!showEmailPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-brand-500 transition-colors"
                >
                  {showEmailPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-text-muted mt-1">
                Untuk Gmail, gunakan App Password dari Google Account Settings
              </p>
            </div>

            {/* Info Box */}
            <div className="p-4 rounded-xl bg-secondary-50 border border-secondary-200">
              <p className="text-sm text-secondary-800">
                <strong>Tips:</strong> Gunakan App Password untuk keamanan lebih baik.
                Untuk Gmail, buat App Password di Google Account → Security → 2-Step Verification → App passwords.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col md:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary px-8 py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Simpan Pengaturan</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingEmail || !emailSettings.smtpHost || !emailSettings.smtpUser || !emailSettings.smtpPass}
                className="flex-1 btn-secondary px-8 py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testingEmail ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Menguji...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    <span>Kirim Test Email</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  )
}
