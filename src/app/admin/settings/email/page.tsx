'use client'

import { useState, useEffect } from 'react'
import {
  Save, Mail, Server, CheckCircle, XCircle, Settings,
  Eye, EyeOff, Lock, Shield, Send, Loader2, HelpCircle,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { cn } from '@/lib/utils'

type Provider = 'gmail' | 'outlook' | 'yahoo' | 'zoho' | 'custom'
type ProviderStatus = 'connected' | 'failed' | 'untested'

interface SmtpSettings {
  smtpHost: string
  smtpPort: string
  smtpSecure: boolean
  smtpUser: string
  smtpPass: string
  smtpFromName: string
  smtpFromEmail: string
  hasSmtpPass: boolean
}

export default function AdminEmailSettingsPage() {
  const [settings, setSettings] = useState<SmtpSettings>({
    smtpHost: '', smtpPort: '587', smtpSecure: false, smtpUser: '', smtpPass: '',
    smtpFromName: 'NotaBener', smtpFromEmail: '', hasSmtpPass: false,
  })
  const [provider, setProvider] = useState<Provider>('custom')
  const [status, setStatus] = useState<ProviderStatus>('untested')
  const [lastTestedAt, setLastTestedAt] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; details?: string[] } | null>(null)

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/smtp-settings')
      if (res.ok) {
        const data = await res.json()
        setSettings({
          smtpHost: data.smtpHost || '', smtpPort: data.smtpPort || '587',
          smtpSecure: data.smtpSecure || false, smtpUser: '', smtpPass: '',
          smtpFromName: data.smtpFromName || 'NotaBener',
          smtpFromEmail: data.smtpFromEmail || '', hasSmtpPass: data.hasSmtpPass || false,
        })
        setProvider(data.provider || 'custom')
        setStatus(data.status || 'untested')
        setLastTestedAt(data.lastTestedAt)
      }
    } catch {
      setMessage({ type: 'error', text: 'Gagal memuat pengaturan SMTP' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleProviderChange = (p: Provider) => {
    setProvider(p)
    const presets: Record<string, { host: string; port: string; secure: boolean }> = {
      gmail: { host: 'smtp.gmail.com', port: '587', secure: false },
      outlook: { host: 'smtp-mail.outlook.com', port: '587', secure: false },
      yahoo: { host: 'smtp.mail.yahoo.com', port: '465', secure: true },
      zoho: { host: 'smtp.zoho.com', port: '587', secure: false },
    }
    if (presets[p]) {
      setSettings(prev => ({ ...prev, ...presets[p] }))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/smtp-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, provider }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan')
      setSettings(prev => ({ ...prev, hasSmtpPass: true, smtpPass: '' }))
      setMessage({ type: 'success', text: 'Pengaturan SMTP berhasil disimpan!' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Terjadi kesalahan' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestEmail = async () => {
    setIsTesting(true)
    setMessage(null)
    try {
      // Save first
      const saveRes = await fetch('/api/admin/smtp-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, provider }),
      })
      if (!saveRes.ok) {
        const d = await saveRes.json()
        throw new Error(d.error || 'Gagal menyimpan')
      }
      setSettings(prev => ({ ...prev, hasSmtpPass: true, smtpPass: '' }))

      // Send test
      const res = await fetch('/api/admin/smtp-settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (data.success) {
        setStatus('connected')
        setLastTestedAt(new Date().toISOString())
        setMessage({ type: 'success', text: `Email test berhasil dikirim ke ${settings.smtpUser}` })
      } else {
        setStatus('failed')
        setMessage({ type: 'error', text: data.error || 'Gagal', details: data.details })
      }
    } catch (err) {
      setStatus('failed')
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Terjadi kesalahan' })
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  const statusConfig: Record<ProviderStatus, { label: string; color: string; icon: any }> = {
    connected: { label: 'Terhubung', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    failed: { label: 'Gagal', color: 'bg-red-100 text-red-700', icon: XCircle },
    untested: { label: 'Belum Ditest', color: 'bg-gray-100 text-gray-600', icon: HelpCircle },
  }
  const StatusIcon = statusConfig[status].icon

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
            <Settings className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Pengaturan Email Sistem</h1>
            <p className="text-text-secondary">Konfigurasi SMTP untuk mengirim email sistem (reset password, notifikasi, dll)</p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={cn('card p-4', message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
            <div className={cn('flex items-start gap-3', message.type === 'success' ? 'text-green-700' : 'text-red-700')}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5 mt-0.5" /> : <XCircle className="w-5 h-5 mt-0.5" />}
              <div>
                <span className="font-medium">{message.text}</span>
                {message.details && (
                  <ul className="mt-1 text-sm space-y-1 list-disc list-inside">
                    {message.details.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Provider Selection */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Provider Email</h2>
              <p className="text-sm text-text-secondary">Pilih provider untuk auto-fill konfigurasi</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {[
              { key: 'gmail', label: 'Gmail', icon: 'G' },
              { key: 'outlook', label: 'Outlook', icon: 'O' },
              { key: 'yahoo', label: 'Yahoo', icon: 'Y' },
              { key: 'zoho', label: 'Zoho', icon: 'Z' },
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Host */}
            {provider === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">SMTP Host</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Server className="w-4 h-4 text-text-muted" />
                  </div>
                  <input
                    type="text"
                    value={settings.smtpHost}
                    onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                    placeholder="smtp.example.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            )}

            {/* Port */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Port</label>
              <input
                type="text"
                value={settings.smtpPort}
                onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                placeholder="587"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500"
                readOnly={provider !== 'custom'}
              />
            </div>

            {/* Secure */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Keamanan</label>
              <select
                value={settings.smtpSecure.toString()}
                onChange={(e) => setSettings({ ...settings, smtpSecure: e.target.value === 'true' })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500"
                disabled={provider !== 'custom'}
              >
                <option value="false">TLS (STARTTLS)</option>
                <option value="true">SSL</option>
              </select>
            </div>

            {/* User */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Email Pengirim (Username)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-text-muted" />
                </div>
                <input
                  type="email"
                  value={settings.smtpUser}
                  onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                  placeholder="your-email@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Password / App Password
                {settings.hasSmtpPass && !settings.smtpPass && (
                  <span className="ml-2 text-xs text-green-600 font-normal">(sudah tersimpan)</span>
                )}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-text-muted" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={settings.smtpPass}
                  onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                  placeholder={settings.hasSmtpPass ? 'Kosongkan jika tidak ingin mengubah' : 'Masukkan password'}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-brand-500"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Shield className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                <p className="text-xs text-text-muted">Password akan dienkripsi dan tidak dapat dilihat kembali</p>
              </div>
            </div>

            {/* From Name */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Nama Pengirim</label>
              <input
                type="text"
                value={settings.smtpFromName}
                onChange={(e) => setSettings({ ...settings, smtpFromName: e.target.value })}
                placeholder="NotaBener"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* From Email */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Email Pengirim (Reply-To)</label>
              <input
                type="email"
                value={settings.smtpFromEmail}
                onChange={(e) => setSettings({ ...settings, smtpFromEmail: e.target.value })}
                placeholder="noreply@yourdomain.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Provider help */}
          {provider === 'gmail' && (
            <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Panduan Gmail:</strong> Aktifkan 2-Factor Authentication, lalu buat App Password di Google Account → Security → 2-Step Verification → App passwords.
              </p>
            </div>
          )}
        </div>

        {/* Status & Test */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Send className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Status & Test Koneksi</h2>
              <p className="text-sm text-text-secondary">Kirim test email untuk memverifikasi konfigurasi</p>
            </div>
          </div>

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

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleTestEmail}
              disabled={isTesting || !settings.smtpUser || (!settings.smtpPass && !settings.hasSmtpPass)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan & Mengirim...</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Simpan & Kirim Test Email</span>
                </>
              )}
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving || !settings.smtpUser || !settings.smtpFromEmail}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Pengaturan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
