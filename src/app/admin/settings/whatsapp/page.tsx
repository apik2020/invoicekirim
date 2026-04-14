'use client'

import { useState, useEffect } from 'react'
import {
  MessageCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Settings,
  Server,
  Key,
  RefreshCw,
  AlertCircle,
  Phone,
  HelpCircle,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'

type ConnectionStatus = 'connected' | 'disconnected' | 'checking' | 'not_configured'

export default function AdminWhatsAppSettingsPage() {
  const [baseUrl, setBaseUrl] = useState('')
  const [maskedApiKey, setMaskedApiKey] = useState('')
  const [sessionId, setSessionId] = useState('notabener')
  const [hasApiKey, setHasApiKey] = useState(false)
  const [configured, setConfigured] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('not_configured')
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/whatsapp-settings')
      if (res.ok) {
        const data = await res.json()
        setBaseUrl(data.baseUrl || '')
        setMaskedApiKey(data.apiKey || '')
        setSessionId(data.sessionId || 'notabener')
        setHasApiKey(data.hasApiKey || false)
        setConfigured(data.configured || false)

        if (data.configured) {
          checkHealth()
        }
      }
    } catch (error) {
      console.error('Failed to fetch WhatsApp settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkHealth = async () => {
    setConnectionStatus('checking')
    try {
      const res = await fetch('/api/whatsapp/health')
      const data = await res.json()

      if (data.connected) {
        setConnectionStatus('connected')
        setConnectedPhone(data.phone || null)
        setMessage({ type: 'success', text: 'WhatsApp terhubung dan siap digunakan!' })
      } else {
        setConnectionStatus('disconnected')
        setConnectedPhone(null)
        setMessage({ type: 'error', text: data.error || 'OpenWA tidak dapat dihubungi' })
      }
    } catch {
      setConnectionStatus('disconnected')
      setMessage({ type: 'error', text: 'Gagal mengecek koneksi OpenWA' })
    }
  }

  const statusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
            <CheckCircle size={14} />
            Terhubung {connectedPhone && `(${connectedPhone})`}
          </span>
        )
      case 'disconnected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-200">
            <XCircle size={14} />
            Tidak Terhubung
          </span>
        )
      case 'checking':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
            <Loader2 size={14} className="animate-spin" />
            Mengecek...
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gray-50 text-gray-600 border border-gray-200">
            <AlertCircle size={14} />
            Belum Dikonfigurasi
          </span>
        )
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #25D366, #128C7E)' }}>
            <MessageCircle size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-500">Pengaturan WhatsApp</h1>
            <p className="text-text-secondary text-sm">Konfigurasi OpenWA untuk pengiriman pesan otomatis via WhatsApp</p>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span className="font-medium">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-current opacity-50 hover:opacity-100">
            &times;
          </button>
        </div>
      )}

      {/* Connection Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Phone size={20} className="text-gray-500" />
            Status Koneksi
          </h2>
          <div className="flex items-center gap-3">
            {statusBadge()}
            {configured && (
              <button
                onClick={checkHealth}
                disabled={connectionStatus === 'checking'}
                className="p-2 text-gray-400 hover:text-brand-500 transition-colors rounded-lg hover:bg-gray-50"
                title="Refresh status"
              >
                <RefreshCw size={16} className={connectionStatus === 'checking' ? 'animate-spin' : ''} />
              </button>
            )}
          </div>
        </div>

        {!configured && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
            <strong>Panduan Setup:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Deploy OpenWA instance (via Docker atau Dokploy)</li>
              <li>Set environment variables di Dokploy: <code className="bg-yellow-100 px-1 rounded">OPENWA_BASE_URL</code>, <code className="bg-yellow-100 px-1 rounded">OPENWA_API_KEY</code>, <code className="bg-yellow-100 px-1 rounded">OPENWA_SESSION_ID</code></li>
              <li>Scan QR code di OpenWA dashboard untuk menghubungkan nomor WhatsApp</li>
              <li>Redeploy app, lalu klik &quot;Test Koneksi&quot; di halaman ini</li>
            </ol>
          </div>
        )}
      </div>

      {/* Current Configuration */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Settings size={20} className="text-gray-500" />
            Konfigurasi Saat Ini
          </h2>
          {configured && (
            <button
              onClick={checkHealth}
              disabled={connectionStatus === 'checking'}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(145deg, #25D366, #128C7E)' }}
            >
              {connectionStatus === 'checking' ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  Test Koneksi
                </>
              )}
            </button>
          )}
        </div>

        <div className="space-y-4 max-w-lg">
          {/* Base URL */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Server size={16} className="text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">OpenWA Base URL</p>
              <p className="text-sm text-gray-900 font-mono">{baseUrl || <span className="text-gray-400 italic">Belum diset</span>}</p>
            </div>
          </div>

          {/* API Key */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Key size={16} className="text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">API Key</p>
              <p className="text-sm text-gray-900 font-mono">
                {hasApiKey ? maskedApiKey : <span className="text-gray-400 italic">Belum diset</span>}
              </p>
            </div>
          </div>

          {/* Session ID */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MessageCircle size={16} className="text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Session ID</p>
              <p className="text-sm text-gray-900 font-mono">{sessionId || <span className="text-gray-400 italic">notabener</span>}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Konfigurasi dibaca dari environment variables. Untuk mengubah, update <code className="bg-gray-100 px-1 rounded">OPENWA_BASE_URL</code>, <code className="bg-gray-100 px-1 rounded">OPENWA_API_KEY</code>, dan <code className="bg-gray-100 px-1 rounded">OPENWA_SESSION_ID</code> di Dokploy, lalu redeploy.
          </p>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2 mb-2">
          <HelpCircle size={16} />
          Cara Kerja
        </h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>WhatsApp integration menggunakan <strong>OpenWA</strong> sebagai bridge antara NotaBener dan WhatsApp</li>
          <li>User mengklik &quot;Kirim via WhatsApp&quot; pada invoice detail</li>
          <li>NotaBener mengirim pesan otomatis ke nomor client melalui OpenWA</li>
          <li>Jika OpenWA tidak terkonfigurasi atau gagal, otomatis fallback ke wa.me (manual)</li>
          <li>Activity log otomatis mencatat setiap pesan WhatsApp yang berhasil terkirim</li>
        </ul>
      </div>
    </AdminLayout>
  )
}
