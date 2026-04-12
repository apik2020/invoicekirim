'use client'

import { useState, useEffect } from 'react'
import { useAppSession } from '@/hooks/useAppSession'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { DashboardLayout } from '@/components/DashboardLayout'
import Link from 'next/link'
import {
  Mail,
  Check,
  Loader2,
  Eye,
  EyeOff,
  Server,
  Lock,
  Crown,
  AlertCircle,
  Shield,
  Zap,
  Settings,
  Send,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react'

type ProviderMode = 'default' | 'custom'
type Provider = 'gmail' | 'outlook' | 'yahoo' | 'custom'
type ProviderStatus = 'connected' | 'failed' | 'untested'

interface SmtpSettings {
  host: string
  port: string
  secure: boolean
  user: string
  hasPassword: boolean
}

export default function EmailSettingsPage() {
  const { status: sessionStatus } = useAppSession()
  const router = typeof window !== 'undefined' ? require('next/navigation').useRouter() : null

  // Check custom SMTP access (branded email = Pro feature)
  const { hasAccess: hasCustomSmtpAccess, isLoading: checkingAccess } = useFeatureAccess('CUSTOM_SMTP')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; details?: string[] } | null>(null)

  // Provider settings
  const [mode, setMode] = useState<ProviderMode>('default')
  const [provider, setProvider] = useState<Provider>('gmail')
  const [fallbackEnabled, setFallbackEnabled] = useState(true)
  const [status, setStatus] = useState<ProviderStatus>('untested')
  const [lastTestedAt, setLastTestedAt] = useState<string | null>(null)
  const [testTarget, setTestTarget] = useState('')

  // SMTP fields
  const [smtp, setSmtp] = useState<SmtpSettings>({
    host: '',
    port: '587',
    secure: false,
    user: '',
    hasPassword: false,
  })
  const [smtpPass, setSmtpPass] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (sessionStatus === 'unauthenticated') {
      router?.push('/login')
    } else if (sessionStatus === 'authenticated') {
      fetchSettings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/email/settings')
      if (res.status === 401) {
        router?.push('/login')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setMode(data.mode || 'default')
        setProvider(data.provider || 'gmail')
        setFallbackEnabled(data.fallbackEnabled ?? true)
        setStatus(data.status || 'untested')
        setLastTestedAt(data.lastTestedAt)
        setTestTarget(data.testTarget || data.smtp?.user || '')
        if (data.smtp) {
          setSmtp(data.smtp)
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider)
    const presets: Record<string, { host: string; port: string; secure: boolean }> = {
      gmail: { host: 'smtp.gmail.com', port: '587', secure: false },
      outlook: { host: 'smtp-mail.outlook.com', port: '587', secure: false },
      yahoo: { host: 'smtp.mail.yahoo.com', port: '465', secure: true },
    }
    if (presets[newProvider]) {
      setSmtp(prev => ({ ...prev, ...presets[newProvider] }))
    }
  }

  const handleModeChange = (newMode: ProviderMode) => {
    if (newMode === 'custom' && !hasCustomSmtpAccess) {
      // Don't switch — will show upgrade prompt
      return
    }
    setMode(newMode)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/email/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          provider,
          fallbackEnabled,
          testTarget,
          smtp: mode === 'custom' ? {
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            user: smtp.user,
            pass: smtpPass || undefined,
          } : undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Pengaturan email berhasil disimpan!' })
        setSmtpPass('')
        fetchSettings()
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal menyimpan pengaturan' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat menyimpan' })
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    setTesting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailTarget: testTarget || smtp.user }),
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('connected')
        setLastTestedAt(new Date().toISOString())
        setMessage({ type: 'success', text: data.message || 'Test email berhasil!' })
      } else {
        setStatus('failed')
        setMessage({
          type: 'error',
          text: data.error || 'Gagal mengirim test email',
          details: data.details,
        })
      }
    } catch (error) {
      setStatus('failed')
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat mengirim test email' })
    } finally {
      setTesting(false)
    }
  }

  if (!mounted || loading || sessionStatus === 'loading' || checkingAccess) {
    return (
      <DashboardLayout title="Pengaturan Email">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-brand-500 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (sessionStatus === 'unauthenticated') return null

  const statusConfig: Record<ProviderStatus, { label: string; color: string; icon: any }> = {
    connected: { label: 'Terhubung', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    failed: { label: 'Gagal', color: 'bg-red-100 text-red-700', icon: XCircle },
    untested: { label: 'Belum Ditest', color: 'bg-gray-100 text-gray-600', icon: HelpCircle },
  }
  const StatusIcon = statusConfig[status].icon

  return (
    <DashboardLayout title="Pengaturan Email">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-brand-500 mb-2">Pengaturan Email</h1>
          <p className="text-text-secondary">Pilih cara mengirim email invoice ke klien Anda</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-xl border ${message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-start gap-3">
              {message.type === 'success'
                ? <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                : <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              }
              <div>
                <p className="font-medium">{message.text}</p>
                {message.details && (
                  <ul className="mt-2 text-sm space-y-1 list-disc list-inside">
                    {message.details.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Mode Selection */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Metode Pengiriman</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* System Email */}
              <button
                type="button"
                onClick={() => setMode('default')}
                className={`p-5 rounded-xl border-2 text-left transition-all ${
                  mode === 'default'
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    mode === 'default' ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Zap size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">Email Sistem</p>
                    <p className="text-xs text-text-muted">Rekomendasi</p>
                  </div>
                </div>
                <p className="text-sm text-text-secondary">
                  Kirim melalui server NotaBener. Lebih stabil, tidak perlu konfigurasi.
                </p>
              </button>

              {/* Custom SMTP */}
              <button
                type="button"
                onClick={() => handleModeChange('custom')}
                className={`p-5 rounded-xl border-2 text-left transition-all relative ${
                  mode === 'custom'
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {!hasCustomSmtpAccess && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                      <Crown size={12} />
                      Pro
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    mode === 'custom' ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Server size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">SMTP Sendiri</p>
                    <p className="text-xs text-text-muted">Lanjutan</p>
                  </div>
                </div>
                <p className="text-sm text-text-secondary">
                  Gunakan server email Anda sendiri (Gmail, Outlook, dll).
                </p>
              </button>
            </div>
          </div>

          {/* System Email Info */}
          {mode === 'default' && (
            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary mb-1">Menggunakan Email Sistem</h3>
                  <p className="text-sm text-text-secondary mb-3">
                    Email akan dikirim menggunakan server NotaBener yang sudah terkonfigurasi dengan baik.
                    Tidak perlu setting apa pun — langsung kirim invoice ke klien.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <Check size={16} />
                      <span>Tidak perlu konfigurasi SMTP</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <Check size={16} />
                      <span>Lebih stabil dan cepat</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <Check size={16} />
                      <span>Tidak perlu App Password</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom SMTP — locked for FREE users */}
          {mode === 'custom' && !hasCustomSmtpAccess && (
            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-brand-500 mb-2">SMTP Sendiri — Fitur Pro</h3>
              <p className="text-text-secondary mb-6 max-w-md mx-auto">
                Gunakan server email Anda sendiri (Gmail, Outlook, dll.) untuk mengirim invoice.
                Upgrade ke Pro untuk membuka fitur ini.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/checkout"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg"
                >
                  <Crown className="w-5 h-5" />
                  Upgrade ke Pro
                </Link>
                <button
                  type="button"
                  onClick={() => setMode('default')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Gunakan Email Sistem
                </button>
              </div>
            </div>
          )}

          {/* Custom SMTP Form — only for Pro users */}
          {mode === 'custom' && hasCustomSmtpAccess && (
            <>
              {/* Provider Selection */}
              <div className="card p-6">
                <h2 className="text-lg font-bold text-text-primary mb-4">Provider Email</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {[
                    { key: 'gmail', label: 'Gmail', icon: 'G' },
                    { key: 'outlook', label: 'Outlook', icon: 'O' },
                    { key: 'yahoo', label: 'Yahoo', icon: 'Y' },
                    { key: 'custom', label: 'Custom', icon: <Settings size={16} /> },
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => handleProviderChange(p.key as Provider)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        provider === p.key
                          ? 'border-brand-500 bg-brand-50 text-brand-600'
                          : 'border-gray-200 hover:border-gray-300 text-text-secondary'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-sm font-bold ${
                        provider === p.key ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {p.icon}
                      </div>
                      <span className="text-sm font-medium">{p.label}</span>
                    </button>
                  ))}
                </div>

                {/* SMTP Fields */}
                <div className="space-y-4">
                  {provider === 'custom' && (
                    <div>
                      <label className="input-label">SMTP Host</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Server className="w-5 h-5 text-text-muted" />
                        </div>
                        <input
                          type="text"
                          value={smtp.host}
                          onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                          className="input pl-12"
                          placeholder="smtp.example.com"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Port</label>
                      <input
                        type="text"
                        value={smtp.port}
                        onChange={(e) => setSmtp({ ...smtp, port: e.target.value })}
                        className="input"
                        placeholder="587"
                        readOnly={provider !== 'custom'}
                      />
                    </div>
                    <div>
                      <label className="input-label">Keamanan</label>
                      <select
                        value={smtp.secure.toString()}
                        onChange={(e) => setSmtp({ ...smtp, secure: e.target.value === 'true' })}
                        className="select"
                        disabled={provider !== 'custom'}
                      >
                        <option value="false">TLS (STARTTLS)</option>
                        <option value="true">SSL</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="input-label">Email Pengirim</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="w-5 h-5 text-text-muted" />
                      </div>
                      <input
                        type="email"
                        value={smtp.user}
                        onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
                        className="input pl-12"
                        placeholder="email@domain.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="input-label">
                      Password / App Password
                      {smtp.hasPassword && !smtpPass && (
                        <span className="ml-2 text-xs text-green-600 font-normal">(sudah tersimpan)</span>
                      )}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="w-5 h-5 text-text-muted" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        className="input pl-12 pr-12"
                        placeholder={smtp.hasPassword ? 'Kosongkan jika tidak ingin mengubah' : 'Masukkan password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-brand-500"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Shield className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                      <p className="text-xs text-text-muted">
                        Password akan dienkripsi dan tidak dapat dilihat kembali
                      </p>
                    </div>
                  </div>

                  {provider === 'gmail' && (
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>Panduan Gmail:</strong> Aktifkan 2-Factor Authentication, lalu buat App Password di
                        Google Account &rarr; Security &rarr; 2-Step Verification &rarr; App passwords.
                      </p>
                    </div>
                  )}
                  {provider === 'outlook' && (
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>Panduan Outlook:</strong> Gunakan password biasa atau App Password jika ada.
                        Pastikan IMAP/SMTP diaktifkan di pengaturan Outlook.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Connection Status & Test */}
              <div className="card p-6">
                <h2 className="text-lg font-bold text-text-primary mb-4">Status & Test Koneksi</h2>

                <div className="flex items-center gap-3 mb-4">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig[status].color}`}>
                    <StatusIcon size={16} />
                    {statusConfig[status].label}
                  </span>
                  {lastTestedAt && (
                    <span className="text-xs text-text-muted">
                      Terakhir ditest: {new Date(lastTestedAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Send className="w-5 h-5 text-text-muted" />
                    </div>
                    <input
                      type="email"
                      value={testTarget}
                      onChange={(e) => setTestTarget(e.target.value)}
                      className="input pl-12"
                      placeholder={smtp.user || 'email@tujuan.com'}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={testing || !smtp.user || (!smtp.hasPassword && !smtpPass)}
                    className="btn-secondary px-6 py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {testing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Menguji...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Kirim Test Email</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Masukkan alamat email tujuan untuk test, atau kosongkan untuk mengirim ke email pengirim
                </p>
              </div>

              {/* Fallback System */}
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-text-primary">Fallback ke Email Sistem</h3>
                    <p className="text-sm text-text-secondary mt-1">
                      Jika SMTP Anda gagal, email otomatis dikirim melalui server NotaBener
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fallbackEnabled}
                      onChange={(e) => setFallbackEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || (mode === 'custom' && !hasCustomSmtpAccess)}
              className="btn-primary px-8 py-4 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Simpan Pengaturan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
