'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Mail, Server, Lock, TestTube, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { AlertBox } from '@/components/Toast'

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
  const router = useRouter()
  const [settings, setSettings] = useState<SmtpSettings>({
    smtpHost: '',
    smtpPort: '587',
    smtpSecure: false,
    smtpUser: '',
    smtpPass: '',
    smtpFromName: 'InvoiceKirim',
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
          smtpFromName: data.smtpFromName || 'InvoiceKirim',
          smtpFromEmail: data.smtpFromEmail || '',
        })
      }
    } catch (err) {
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
    } catch (err) {
      setTestResult({ success: false, message: 'Terjadi kesalahan saat menguji koneksi' })
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Pengaturan Email SMTP</h1>
          <p className="text-text-secondary mt-1">
            Konfigurasi server SMTP untuk mengirim email sistem (reset password, notifikasi admin)
          </p>
        </div>
        <button
          onClick={() => router.push('/admin')}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
      </div>

      {error && (
        <AlertBox type="error" title="Error">
          {error}
        </AlertBox>
      )}

      {testResult && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {testResult.success ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          {testResult.message}
        </div>
      )}

      {/* SMTP Settings Form */}
      <div className="bg-surface-card rounded-2xl border border-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SMTP Host */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              <Server className="w-4 h-4 inline mr-2" />
              SMTP Host
            </label>
            <input
              type="text"
              value={settings.smtpHost}
              onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
              placeholder="smtp.gmail.com"
              className="input-field"
            />
            <p className="text-xs text-text-tertiary mt-1">
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
            <p className="text-xs text-text-tertiary mt-1">
              Umum: 587 (TLS) atau 465 (SSL)
            </p>
          </div>

          {/* SMTP Username */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
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
              <Lock className="w-4 h-4 inline mr-2" />
              SMTP Password
            </label>
            <input
              type="password"
              value={settings.smtpPass}
              onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
              placeholder="••••••••"
              className="input-field"
            />
            <p className="text-xs text-text-tertiary mt-1">
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
              placeholder="InvoiceKirim"
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
            <p className="text-xs text-text-tertiary mt-1 ml-7">
              Centang jika menggunakan port 465 (SSL) atau biarkan kosong untuk port 587 (STARTTLS)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border">
          <button
            onClick={handleTestConnection}
            disabled={isTesting || !settings.smtpHost || !settings.smtpUser}
            className="btn-secondary flex items-center gap-2"
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
            onClick={handleSave}
            disabled={isSaving || !settings.smtpHost || !settings.smtpUser || !settings.smtpFromEmail}
            className="btn-primary flex items-center gap-2"
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
      <div className="bg-surface-card rounded-2xl border border-border p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Panduan Konfigurasi SMTP
        </h3>
        <div className="space-y-4 text-sm text-text-secondary">
          <div>
            <h4 className="font-medium text-text-primary">Gmail</h4>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Host: smtp.gmail.com</li>
              <li>Port: 587</li>
              <li>Gunakan App Password, bukan password biasa</li>
              <li>Buat App Password di: https://myaccount.google.com/apppasswords</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-text-primary">Outlook/Office 365</h4>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Host: smtp.office365.com</li>
              <li>Port: 587</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-text-primary">Zoho Mail</h4>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Host: smtp.zoho.com</li>
              <li>Port: 587</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
