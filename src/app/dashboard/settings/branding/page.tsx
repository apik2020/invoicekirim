'use client'

import { useState, useEffect } from 'react'
import { useAppSession } from '@/hooks/useAppSession'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Palette, Check, Loader2, Image, Eye, EyeOff } from 'lucide-react'

export default function BrandingSettingsPage() {
  const { data: session } = useAppSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [branding, setBranding] = useState({
    logoUrl: '',
    primaryColor: '#F97316',
    showLogo: true,
  })

  useEffect(() => {
    if (session?.user) {
      fetchBranding()
    }
  }, [session])

  const fetchBranding = async () => {
    try {
      const res = await fetch('/api/branding')
      const data = await res.json()

      if (res.ok && data.branding) {
        setBranding({
          logoUrl: data.branding.logoUrl || '',
          primaryColor: data.branding.primaryColor || '#F97316',
          showLogo: data.branding.showLogo ?? true,
        })
      }
    } catch (error) {
      console.error('Failed to fetch branding:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoUrl: branding.logoUrl || null,
          primaryColor: branding.primaryColor,
          showLogo: branding.showLogo,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Pengaturan branding berhasil disimpan!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal menyimpan pengaturan branding' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
    } finally {
      setSaving(false)
    }
  }

  if (!session) {
    return (
      <DashboardLayout title="Branding">
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
    <DashboardLayout title="Branding">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-500 mb-2">
          Pengaturan Branding
        </h1>
        <p className="text-text-secondary">
          Sesuaikan tampilan invoice untuk klien Anda
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
            <Palette className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="card p-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-brand-500 mb-2">
              Kustomisasi Tampilan
            </h2>
            <p className="text-text-secondary">
              Logo dan warna akan ditampilkan pada halaman invoice klien
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo URL */}
            <div>
              <label className="input-label">URL Logo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Image className="w-5 h-5 text-text-muted" />
                </div>
                <input
                  type="url"
                  value={branding.logoUrl}
                  onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                  className="input pl-12"
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <p className="text-xs text-text-muted mt-1">
                Masukkan URL logo Anda (format PNG, JPG, atau SVG)
              </p>
            </div>

            {/* Show Logo Toggle */}
            <div>
              <label className="input-label">Tampilkan Logo</label>
              <button
                type="button"
                onClick={() => setBranding({ ...branding, showLogo: !branding.showLogo })}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                  branding.showLogo
                    ? 'border-brand-500 bg-brand-50 text-brand-600'
                    : 'border-secondary-200 bg-secondary-50 text-text-secondary'
                }`}
              >
                {branding.showLogo ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
                <span className="font-medium">
                  {branding.showLogo ? 'Logo ditampilkan' : 'Logo disembunyikan'}
                </span>
              </button>
            </div>

            {/* Primary Color */}
            <div>
              <label className="input-label">Warna Utama</label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="w-16 h-12 rounded-xl border-2 border-secondary-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="input flex-1 font-mono"
                  placeholder="#F97316"
                />
              </div>
              <p className="text-xs text-text-muted mt-1">
                Warna untuk tombol, border, dan aksen pada invoice
              </p>
            </div>

            {/* Color Presets */}
            <div>
              <label className="input-label">Preset Warna</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { color: '#F97316', name: 'Orange' },
                  { color: '#3B82F6', name: 'Blue' },
                  { color: '#10B981', name: 'Green' },
                  { color: '#8B5CF6', name: 'Purple' },
                  { color: '#EC4899', name: 'Pink' },
                  { color: '#EF4444', name: 'Red' },
                  { color: '#6366F1', name: 'Indigo' },
                  { color: '#14B8A6', name: 'Teal' },
                ].map((preset) => (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() => setBranding({ ...branding, primaryColor: preset.color })}
                    className={`w-10 h-10 rounded-xl border-2 transition-all ${
                      branding.primaryColor === preset.color
                        ? 'border-charcoal scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: preset.color }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
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

        {/* Preview Section */}
        <div className="card p-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-brand-500 mb-2">
              Preview Invoice
            </h2>
            <p className="text-text-secondary">
              Tampilan invoice untuk klien
            </p>
          </div>

          {/* Invoice Preview */}
          <div className="bg-white border-2 border-secondary-200 rounded-2xl overflow-hidden">
            {/* Header */}
            <div
              className="p-6 border-b-2"
              style={{ borderColor: branding.primaryColor + '40' }}
            >
              <div className="flex items-center gap-4">
                {branding.showLogo && branding.logoUrl ? (
                  <img
                    src={branding.logoUrl}
                    alt="Logo"
                    className="w-12 h-12 object-contain rounded-xl"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: branding.primaryColor }}
                  >
                    IK
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-charcoal">Nama Perusahaan</h3>
                  <p className="text-sm text-text-secondary">invoice@perusahaan.com</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Invoice Title */}
              <div>
                <h2 className="text-2xl font-bold text-charcoal">INVOICE</h2>
                <p className="text-text-secondary font-mono">INV-000001</p>
              </div>

              {/* Client Info */}
              <div className="bg-secondary-50 rounded-xl p-4">
                <p className="text-xs text-text-muted uppercase mb-2">Kepada:</p>
                <p className="font-bold text-charcoal">Nama Klien</p>
                <p className="text-sm text-text-secondary">klien@email.com</p>
              </div>

              {/* Items */}
              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${branding.primaryColor}40` }}>
                      <th className="text-left py-2 font-bold">Item</th>
                      <th className="text-center py-2 font-bold">Qty</th>
                      <th className="text-right py-2 font-bold">Harga</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: `1px solid ${branding.primaryColor}20` }}>
                      <td className="py-2">Jasa Konsultasi</td>
                      <td className="py-2 text-center">1</td>
                      <td className="py-2 text-right">Rp 1.000.000</td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${branding.primaryColor}20` }}>
                      <td className="py-2">Pengembangan Web</td>
                      <td className="py-2 text-center">1</td>
                      <td className="py-2 text-right">Rp 5.000.000</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div className="flex justify-end">
                <div className="w-48">
                  <div className="flex justify-between py-2 text-sm">
                    <span>Subtotal</span>
                    <span>Rp 6.000.000</span>
                  </div>
                  <div className="flex justify-between py-2 border-t-2 pt-4 text-lg font-bold"
                    style={{ borderColor: branding.primaryColor + '40', color: branding.primaryColor }}
                  >
                    <span>Total</span>
                    <span>Rp 6.000.000</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                className="w-full py-3 rounded-xl text-white font-medium"
                style={{ backgroundColor: branding.primaryColor }}
              >
                Bayar Sekarang
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
