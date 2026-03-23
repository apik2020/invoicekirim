'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppSession } from '@/hooks/useAppSession'
import { DashboardLayout } from '@/components/DashboardLayout'
import {
  Palette,
  Check,
  Loader2,
  Eye,
  EyeOff,
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  Server,
  Lock,
  AlertCircle,
  Upload,
  X,
} from 'lucide-react'

type TabType = 'company' | 'appearance' | 'email'

export default function BrandingSettingsPage() {
  const { data: session, update } = useAppSession()
  const [activeTab, setActiveTab] = useState<TabType>('company')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; details?: string[] } | null>(null)

  // Branding State
  const [branding, setBranding] = useState({
    logoUrl: '',
    primaryColor: '#F97316',
    showLogo: true,
  })

  // Company Info State
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
  })

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

  // Logo Upload State
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (session?.user) {
      fetchData()
    }
  }, [session])

  const fetchData = async () => {
    try {
      // Fetch branding
      const brandingRes = await fetch('/api/branding')
      const brandingData = await brandingRes.json()
      if (brandingRes.ok && brandingData.branding) {
        setBranding({
          logoUrl: brandingData.branding.logoUrl || '',
          primaryColor: brandingData.branding.primaryColor || '#F97316',
          showLogo: brandingData.branding.showLogo ?? true,
        })
      }

      // Fetch profile
      const profileRes = await fetch('/api/user/profile')
      const profileData = await profileRes.json()
      if (profileRes.ok) {
        setCompanyInfo({
          name: profileData.name || '',
          companyName: profileData.companyName || '',
          companyEmail: profileData.companyEmail || '',
          companyPhone: profileData.companyPhone || '',
          companyAddress: profileData.companyAddress || '',
        })
        setEmailSettings({
          smtpHost: profileData.smtpHost || '',
          smtpPort: profileData.smtpPort || '587',
          smtpSecure: profileData.smtpSecure ?? false,
          smtpUser: profileData.smtpUser || '',
          smtpPass: '',
        })
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitCompanyInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
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
        await update()
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal menyimpan informasi' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Tipe file tidak didukung. Gunakan PNG, JPG, atau WebP.' })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ukuran file terlalu besar. Maksimal 2MB.' })
      return
    }

    setUploadingLogo(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok && data.url) {
        setBranding(prev => ({ ...prev, logoUrl: data.url }))
        setMessage({ type: 'success', text: 'Logo berhasil diupload!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal mengupload logo' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat mengupload logo' })
    } finally {
      setUploadingLogo(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveLogo = () => {
    setBranding(prev => ({ ...prev, logoUrl: '' }))
    setMessage(null)
  }

  const handleSubmitBranding = async (e: React.FormEvent) => {
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
        setMessage({ type: 'success', text: 'Pengaturan tampilan berhasil disimpan!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal menyimpan pengaturan tampilan' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
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
      setSaving(false)
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

  if (!session) {
    return (
      <DashboardLayout title="Pengaturan Invoice">
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
    <DashboardLayout title="Pengaturan Invoice">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-500 mb-2">
          Pengaturan Invoice
        </h1>
        <p className="text-text-secondary">
          Kelola tampilan dan pengiriman invoice untuk klien Anda
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
            setActiveTab('appearance')
            setMessage(null)
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'appearance'
              ? 'btn-primary'
              : 'btn-secondary'
          }`}
        >
          <Palette className="w-5 h-5" />
          <span>Tampilan</span>
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
          <span>Email</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Tab 1: Info Perusahaan */}
          {activeTab === 'company' && (
            <div className="card p-8">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-brand-500 mb-2">
                  Informasi Perusahaan
                </h2>
                <p className="text-text-secondary">
                  Informasi ini akan ditampilkan pada invoice Anda
                </p>
              </div>

              <form onSubmit={handleSubmitCompanyInfo} className="space-y-6">
                {/* Nama Anda */}
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
                        <span>Simpan Informasi</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: Tampilan */}
          {activeTab === 'appearance' && (
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

                <form onSubmit={handleSubmitBranding} className="space-y-6">
                  {/* Logo Upload */}
                  <div>
                    <label className="input-label">Logo Perusahaan</label>

                    {/* Current Logo Preview */}
                    {branding.logoUrl ? (
                      <div className="mt-3 mb-4 relative inline-block">
                        <img
                          src={branding.logoUrl}
                          alt="Logo"
                          className="w-32 h-32 object-contain rounded-xl border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          title="Hapus logo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-3 mb-4">
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-colors"
                        >
                          <Upload className="w-8 h-8 text-gray-400" />
                          <span className="text-xs text-gray-500 mt-1">Upload Logo</span>
                        </div>
                      </div>
                    )}

                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />

                    {/* Upload Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingLogo ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Mengupload...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>{branding.logoUrl ? 'Ganti Logo' : 'Upload Logo'}</span>
                        </>
                      )}
                    </button>

                    <p className="text-xs text-text-muted mt-2">
                      Format: PNG, JPG, WebP. Maksimal 2MB. Disarankan format PNG dengan background transparan.
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
                          {companyInfo.companyName
                            ? companyInfo.companyName.substring(0, 2).toUpperCase()
                            : 'IK'}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-charcoal">
                          {companyInfo.companyName || 'Nama Perusahaan'}
                        </h3>
                        <p className="text-sm text-text-secondary">
                          {companyInfo.companyEmail || 'invoice@perusahaan.com'}
                        </p>
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
          )}

          {/* Tab 3: Email */}
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
                    Untuk Gmail, buat App Password di Google Account - Security - 2-Step Verification - App passwords.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex flex-col md:flex-row gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 btn-primary px-8 py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
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
        </>
      )}
    </DashboardLayout>
  )
}
