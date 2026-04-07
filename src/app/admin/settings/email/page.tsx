'use client'

import { useState, useEffect } from 'react'
import { Save, Mail, Server, TestTube, CheckCircle, XCircle, Settings } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { cn } from '@/lib/utils'

interface SmtpSettings {
  smtpHost: string
  smtpPort: string
  smtpSecure: boolean
  smtpUser: string
  smtpPass: string
  smtpFromName: string
  smtpFromEmail: string
}

export default function AdminEmailSettingsPage() {
  const [settings, setSettings] = useState<SmtpSettings>({
    smtpHost: '',
    smtpPort: '587',
    smtpSecure: false,
    smtpUser: '',
    smtpPass: '',
    smtpFromName: 'NotaBener',
    smtpFromEmail: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/smtp-settings')
      if (res.ok) {
        const data = await res.json()
        setSettings({
          smtpHost: data.smtpHost || '',
          smtpPort: data.smtpPort || '587',
          smtpSecure: data.smtpSecure || false,
          smtpUser: data.smtpUser || '',
          smtpPass: '', // Don't show password
          smtpFromName: data.smtpFromName || 'NotaBener',
          smtpFromEmail: data.smtpFromEmail || '',
        })
      }
    } catch {
      setError('Gagal memuat pengaturan SMTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    setTestResult(null)

    try {
      const res = await fetch('/api/admin/smtp-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan pengaturan')
      }

      setTestResult({ success: true, message: 'Pengaturan SMTP berhasil disimpan!' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const res = await fetch('/api/admin/smtp-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, testOnly: true }),
      })

      const data = await res.json()
      if (data.success) {
        setTestResult({ success: true, message: data.message })
      } else {
        setTestResult({ success: false, message: data.error || 'Koneksi gagal' })
      }
    } catch {
      setTestResult({ success: false, message: 'Terjadi kesalahan saat menguji koneksi' })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSendTestEmail = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const res = await fetch('/api/admin/smtp-settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const data = await res.json()
      if (data.success) {
        setTestResult({ success: true, message: `Email test berhasil dikirim ke ${settings.smtpUser}` })
      } else {
        setTestResult({ success: false, message: data.error || 'Gagal mengirim email test' })
      }
    } catch {
      setTestResult({ success: false, message: 'Terjadi kesalahan saat mengirim email test' })
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
            <Settings className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Pengaturan Email SMTP</h1>
            <p className="text-text-secondary">Konfigurasi server SMTP untuk mengirim email sistem</p>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="card p-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-3 text-red-700">
              <XCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {testResult && (
          <div className={cn(
            'card p-4',
            testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          )}>
            <div className={cn(
              'flex items-center gap-3',
              testResult.success ? 'text-green-700' : 'text-red-700'
            )}>
              {testResult.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span>{testResult.message}</span>
            </div>
          </div>
        )}

        {/* SMTP Settings Card */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Server className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Konfigurasi Server</h2>
              <p className="text-sm text-text-secondary">Masukkan detail server SMTP Anda</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SMTP Host */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                SMTP Host
              </label>
              <input
                type="text"
                value={settings.smtpHost}
                onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
                className="input-field"
              />
              <p className="text-xs text-text-muted mt-1">
                Contoh: smtp.gmail.com, smtp.office365.com
              </p>
            </div>

            {/* SMTP Port */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                SMTP Port
              </label>
              <input
                type="text"
                value={settings.smtpPort}
                onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                placeholder="587"
                className="input-field"
              />
              <p className="text-xs text-text-muted mt-1">
                Umum: 587 (TLS) atau 465 (SSL)
              </p>
            </div>

            {/* SMTP Username */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                SMTP Username
              </label>
              <input
                type="text"
                value={settings.smtpUser}
                onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                placeholder="your-email@gmail.com"
                className="input-field"
              />
            </div>

            {/* SMTP Password */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                SMTP Password
              </label>
              <input
                type="password"
                value={settings.smtpPass}
                onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                placeholder="••••••••"
                className="input-field"
              />
              <p className="text-xs text-text-muted mt-1">
                Untuk Gmail, gunakan App Password
              </p>
            </div>

            {/* From Name */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Nama Pengirim
              </label>
              <input
                type="text"
                value={settings.smtpFromName}
                onChange={(e) => setSettings({ ...settings, smtpFromName: e.target.value })}
                placeholder="NotaBener"
                className="input-field"
              />
            </div>

            {/* From Email */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Email Pengirim
              </label>
              <input
                type="email"
                value={settings.smtpFromEmail}
                onChange={(e) => setSettings({ ...settings, smtpFromEmail: e.target.value })}
                placeholder="noreply@yourdomain.com"
                className="input-field"
              />
            </div>

            {/* Use SSL/TLS */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.smtpSecure}
                  onChange={(e) => setSettings({ ...settings, smtpSecure: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-text-primary">
                  Gunakan koneksi aman (SSL/TLS)
                </span>
              </label>
              <p className="text-xs text-text-muted mt-1 ml-7">
                Centang jika menggunakan port 465 (SSL) atau biarkan kosong untuk port 587 (STARTTLS)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !settings.smtpHost || !settings.smtpUser}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-brand-200 text-brand-600 hover:bg-brand-50 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  <span>Menguji...</span>
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4" />
                  <span>Test Koneksi</span>
                </>
              )}
            </button>

            <button
              onClick={handleSendTestEmail}
              disabled={isTesting || !settings.smtpHost || !settings.smtpUser || !settings.smtpPass}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-green-200 text-green-600 hover:bg-green-50 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Kirim Test Email</span>
                </>
              )}
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving || !settings.smtpHost || !settings.smtpUser || !settings.smtpFromEmail}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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

        {/* Help Section */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Panduan Konfigurasi</h2>
              <p className="text-sm text-text-secondary">Panduan untuk penyedia email populer</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Gmail */}
            <div className="p-4 rounded-xl bg-gray-50">
              <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center text-xs font-bold text-red-600">G</span>
                Gmail
              </h4>
              <ul className="text-sm text-text-secondary space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-brand-500 mt-0.5">•</span>
                  <span>Host: <code className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">smtp.gmail.com</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-500 mt-0.5">•</span>
                  <span>Port: 587</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-500 mt-0.5">•</span>
                  <span>Gunakan App Password</span>
                </li>
              </ul>
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-xs text-brand-600 hover:text-brand-700"
              >
                Buat App Password →
              </a>
            </div>

            {/* Outlook */}
            <div className="p-4 rounded-xl bg-gray-50">
              <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">O</span>
                Outlook / Office 365
              </h4>
              <ul className="text-sm text-text-secondary space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-brand-500 mt-0.5">•</span>
                  <span>Host: <code className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">smtp.office365.com</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-500 mt-0.5">•</span>
                  <span>Port: 587</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-500 mt-0.5">•</span>
                  <span>Gunakan password akun</span>
                </li>
              </ul>
            </div>

            {/* Zoho */}
            <div className="p-4 rounded-xl bg-gray-50">
              <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center text-xs font-bold text-green-600">Z</span>
                Zoho Mail
              </h4>
              <ul className="text-sm text-text-secondary space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-brand-500 mt-0.5">•</span>
                  <span>Host: <code className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">smtp.zoho.com</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-500 mt-0.5">•</span>
                  <span>Port: 587</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-500 mt-0.5">•</span>
                  <span>Gunakan password akun</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
