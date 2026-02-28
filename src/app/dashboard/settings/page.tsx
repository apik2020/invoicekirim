'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardHeader from '@/components/DashboardHeader'
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
  ArrowLeft,
  Settings,
  Server,
} from 'lucide-react'

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'company' | 'password' | 'email'>('company')
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

  // Fetch user profile
  useEffect(() => {
    // Only fetch when session is authenticated
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
          smtpPass: '', // Don't populate password for security
        })
      } else {
        console.error('Failed to fetch profile:', data.error)
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
        // Update session
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
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gray-900 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-fresh-bg">
      <DashboardHeader title="Pengaturan" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back to Dashboard Button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-orange-600 font-medium mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Dashboard</span>
        </button>
        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl flex flex-col gap-2 ${
              message.type === 'success'
                ? 'bg-lime-50 border border-lime-200 text-lime-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-3">
              {message.type === 'success' ? (
                <Check className="w-5 h-5 flex-shrink-0" />
              ) : (
                <Lock className="w-5 h-5 flex-shrink-0" />
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
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => {
              setActiveTab('company')
              setMessage(null)
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'company'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span>Info Perusahaan</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('password')
              setMessage(null)
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'password'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Lock className="w-5 h-5" />
            <span>Ganti Password</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('email')
              setMessage(null)
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'email'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Informasi Perusahaan
              </h2>
              <p className="text-gray-600">
                Informasi ini akan otomatis digunakan saat membuat invoice baru
              </p>
            </div>

            <form onSubmit={handleSubmitCompanyInfo} className="space-y-6">
              {/* Nama */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Nama Anda
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={companyInfo.name}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, name: e.target.value })
                    }
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Nama Perusahaan */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Nama Perusahaan
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Building2 className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={companyInfo.companyName}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, companyName: e.target.value })
                    }
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="PT Contoh Indonesia"
                  />
                </div>
              </div>

              {/* Email Perusahaan */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Email Perusahaan
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={companyInfo.companyEmail}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, companyEmail: e.target.value })
                    }
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="billing@contoh.com"
                  />
                </div>
              </div>

              {/* Telepon Perusahaan */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Telepon Perusahaan
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={companyInfo.companyPhone}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, companyPhone: e.target.value })
                    }
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="+62 812 3456 7890"
                  />
                </div>
              </div>

              {/* Alamat Perusahaan */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Alamat Perusahaan
                </label>
                <div className="relative">
                  <div className="absolute top-4 left-4 pointer-events-none">
                    <MapPin className="w-5 h-5 text-gray-400" />
                  </div>
                  <textarea
                    value={companyInfo.companyAddress}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, companyAddress: e.target.value })
                    }
                    rows={4}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors resize-none"
                    placeholder="Jl. Contoh No. 123, Jakarta Selatan, Indonesia"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 text-white font-bold rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/30"
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

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Ganti Password
              </h2>
              <p className="text-gray-600">
                Pastikan password baru kuat dan aman
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-6">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Password Saat Ini
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="Masukkan password saat ini"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                    }
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Password Baru
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="Masukkan password baru (minimal 6 karakter)"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                    }
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="Ulangi password baru"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                    }
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 text-white font-bold rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/30"
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
        )}

        {/* Email Settings Tab */}
        {activeTab === 'email' && (
          <div className="card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Pengaturan Email
              </h2>
              <p className="text-gray-600">
                Konfigurasi SMTP untuk mengirim invoice ke klien
              </p>
            </div>

            <form onSubmit={handleSubmitEmailSettings} className="space-y-6">
              {/* SMTP Host */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  SMTP Host
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Server className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Contoh: smtp.gmail.com untuk Gmail, smtp-mail.outlook.com untuk Outlook
                </p>
              </div>

              {/* SMTP Port & Secure */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    SMTP Port
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Settings className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={emailSettings.smtpPort}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                      placeholder="587"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Port 587 untuk TLS, 465 untuk SSL
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Koneksi Aman
                  </label>
                  <div className="relative">
                    <select
                      value={emailSettings.smtpSecure.toString()}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpSecure: e.target.value === 'true' })}
                      className="w-full px-4 py-3.5 rounded-xl border border-orange-200 text-gray-900 focus:border-orange-500 focus:outline-none transition-colors appearance-none bg-white"
                    >
                      <option value="false">TLS (STARTTLS)</option>
                      <option value="true">SSL</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    TLS untuk port 587, SSL untuk port 465
                  </p>
                </div>
              </div>

              {/* SMTP User (Email) */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Email Pengirim
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={emailSettings.smtpUser}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="your-email@gmail.com"
                  />
                </div>
              </div>

              {/* SMTP Password */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Password / App Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showEmailPassword ? 'text' : 'password'}
                    value={emailSettings.smtpPass}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPass: e.target.value })}
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="Masukkan password atau app password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailPassword(!showEmailPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {showEmailPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Untuk Gmail, gunakan App Password dari Google Account Settings
                </p>
              </div>

              {/* Info Box */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tips:</strong> Gunakan App Password untuk keamanan lebih baik.
                  Untuk Gmail, buat App Password di Google Account → Security → 2-Step Verification → App passwords.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col md:flex-row gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-8 py-4 text-white font-bold rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/30"
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
                  className="flex-1 px-8 py-4 text-gray-600 font-bold rounded-xl border-2 border-orange-200 hover:bg-gray flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      </div>
    </div>
  )
}
