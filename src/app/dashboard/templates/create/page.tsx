'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FileText, Save, Plus, Trash2, Loader2, Package, Upload, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { DashboardLayout } from '@/components/DashboardLayout'
import { MessageBox } from '@/components/ui/MessageBox'
import { useMessageBox } from '@/hooks/useMessageBox'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'

interface TemplateItem {
  id: string
  description: string
  quantity: number
  price: number
  priceFormatted?: string
}

interface TemplateSettings {
  showClientInfo: boolean
  showDiscount: boolean
  showAdditionalDiscount: boolean
  showTax: boolean
  showSignature: boolean
}

export default function NewTemplatePage() {
  const router = useRouter()
  const sessionResult = useSession()
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [catalogItems, setCatalogItems] = useState<any[]>([])
  const [showItemCatalog, setShowItemCatalog] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [uploadingSignature, setUploadingSignature] = useState(false)
  const messageBox = useMessageBox()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    notes: '',
    taxRate: 11,
    defaultClientId: '',
    termsAndConditions: '',
    signatoryName: '',
    signatoryTitle: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    additionalDiscountType: 'percentage' as 'percentage' | 'fixed',
    additionalDiscountValue: 0,
  })

  const [settings, setSettings] = useState<TemplateSettings>({
    showClientInfo: true,
    showDiscount: false,
    showAdditionalDiscount: false,
    showTax: true,
    showSignature: false,
  })

  const [signatureUrl, setSignatureUrl] = useState<string>('')

  const [items, setItems] = useState<TemplateItem[]>([
    { id: '1', description: '', quantity: 1, price: 0, priceFormatted: '' }
  ])

  // Helper functions untuk currency input
  const formatCurrencyInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '')
    if (!numbers) return ''
    return 'Rp ' + parseInt(numbers).toLocaleString('id-ID')
  }

  const parseCurrencyInput = (value: string): number => {
    const numbers = value.replace(/\D/g, '')
    return numbers ? parseInt(numbers) : 0
  }

  // Handle mount and authentication
  useEffect(() => {
    setMounted(true)

    if (sessionResult.status === 'unauthenticated') {
      router.push('/login')
      return
    }

    // Load catalog items and clients
    if (sessionResult.status === 'authenticated') {
      loadCatalogItems()
      loadClients()
    }
  }, [sessionResult, router])

  const loadCatalogItems = async () => {
    try {
      const res = await fetch('/api/items')
      if (res.ok) {
        const data = await res.json()
        setCatalogItems(data)
      }
    } catch (error) {
      console.error('Failed to load catalog items:', error)
    }
  }

  const loadClients = async () => {
    try {
      const res = await fetch('/api/clients')
      if (res.ok) {
        const data = await res.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Failed to load clients:', error)
    }
  }

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingSignature(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Gagal mengupload tanda tangan')
      }

      const data = await res.json()
      setSignatureUrl(data.url)
    } catch (error: any) {
      messageBox.showWarning({
        title: 'Gagal Upload',
        message: error.message,
        confirmText: 'Mengerti',
        onConfirm: () => messageBox.close(),
      })
    } finally {
      setUploadingSignature(false)
    }
  }

  const handleAddFromCatalog = (catalogItem: any) => {
    // Cek apakah ada item yang kosong (description belum diisi)
    const emptyItemIndex = items.findIndex(item => !item.description || item.description.trim() === '')

    if (emptyItemIndex !== -1) {
      // Isi item yang kosong
      const updatedItems = [...items]
      updatedItems[emptyItemIndex] = {
        ...updatedItems[emptyItemIndex],
        description: catalogItem.name,
        quantity: 1,
        price: catalogItem.price,
        priceFormatted: formatCurrencyInput(catalogItem.price.toString()),
      }
      setItems(updatedItems)
    } else {
      // Tambah item baru jika semua item sudah terisi
      const newItem = {
        id: Date.now().toString(),
        description: catalogItem.name,
        quantity: 1,
        price: catalogItem.price,
        priceFormatted: formatCurrencyInput(catalogItem.price.toString()),
      }
      setItems([...items, newItem])
    }
    setShowItemCatalog(false)
  }

  // Show loading state
  if (!mounted || sessionResult.status === 'loading') {
    return (
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
      </div>
    )
  }

  // Redirect if unauthenticated
  if (sessionResult.status === 'unauthenticated') {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name) {
      messageBox.showWarning({
        title: 'Nama Template Diperlukan',
        message: 'Mohon isi nama template untuk melanjutkan.',
        confirmText: 'Mengerti',
        onConfirm: () => messageBox.close(),
      })
      return
    }

    if (items.some((item) => !item.description || item.price < 0)) {
      messageBox.showWarning({
        title: 'Item Belum Lengkap',
        message: 'Mohon lengkapi semua item dengan deskripsi dan harga yang valid.',
        confirmText: 'Mengerti',
        onConfirm: () => messageBox.close(),
      })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items,
          settings,
          signatureUrl: signatureUrl || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal membuat template')
      }

      messageBox.showTemplateSaved(formData.name, false)

      setTimeout(() => {
        router.push('/dashboard/templates')
      }, 1500)
    } catch (error: any) {
      messageBox.showWarning({
        title: 'Gagal Membuat Template',
        message: error.message,
        confirmText: 'Mengerti',
        onConfirm: () => messageBox.close(),
      })
    } finally {
      setSaving(false)
    }
  }

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), description: '', quantity: 1, price: 0, priceFormatted: '' }
    ])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (id: string, field: string, value: any, formattedValue?: string) => {
    setItems(items.map((item) => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'price' && formattedValue) {
          updated.priceFormatted = formattedValue
        }
        return updated
      }
      return item
    }))
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  const discountAmount = settings.showDiscount && formData.discountValue > 0
    ? (formData.discountType === 'percentage'
      ? subtotal * (formData.discountValue / 100)
      : Math.min(formData.discountValue, subtotal))
    : 0
  const afterFirstDiscount = subtotal - discountAmount
  const additionalDiscountAmount = settings.showAdditionalDiscount && formData.additionalDiscountValue > 0
    ? (formData.additionalDiscountType === 'percentage'
      ? afterFirstDiscount * (formData.additionalDiscountValue / 100)
      : Math.min(formData.additionalDiscountValue, afterFirstDiscount))
    : 0
  const taxableAmount = afterFirstDiscount - additionalDiscountAmount
  const taxAmount = settings.showTax ? taxableAmount * (formData.taxRate / 100) : 0
  const total = taxableAmount + taxAmount

  return (
    <DashboardLayout
      title="Buat Template Baru"
      showBackButton
      backHref="/dashboard/templates"
    >
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          {/* Template Info */}
          <div className="card p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Informasi Template</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Nama Template *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="Contoh: Jasa Web Design"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                  rows={2}
                  placeholder="Deskripsi singkat tentang template ini..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Tarif Pajak Default (%)
                </label>
                <input
                  type="number"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="card p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Pengaturan Tampilan</h2>
            <p className="text-sm text-gray-500 mb-6">Atur komponen mana yang akan ditampilkan di invoice</p>

            <div className="space-y-4">
              <ToggleSwitch
                checked={settings.showClientInfo}
                onChange={(checked) => setSettings({ ...settings, showClientInfo: checked })}
                label="Tampilkan Info Klien"
                description="Tampilkan nama, email, telepon, dan alamat klien"
              />
              <ToggleSwitch
                checked={settings.showDiscount}
                onChange={(checked) => setSettings({ ...settings, showDiscount: checked })}
                label="Tampilkan Diskon"
                description="Tampilkan baris diskon di invoice"
              />
              <ToggleSwitch
                checked={settings.showAdditionalDiscount}
                onChange={(checked) => setSettings({ ...settings, showAdditionalDiscount: checked })}
                label="Tampilkan Diskon Tambahan"
                description="Tampilkan baris diskon tambahan (misal: promo khusus)"
              />
              <ToggleSwitch
                checked={settings.showTax}
                onChange={(checked) => setSettings({ ...settings, showTax: checked })}
                label="Tampilkan Pajak"
                description="Tampilkan baris pajak di invoice"
              />
              <ToggleSwitch
                checked={settings.showSignature}
                onChange={(checked) => setSettings({ ...settings, showSignature: checked })}
                label="Tampilkan Tanda Tangan"
                description="Tampilkan area tanda tangan digital di invoice"
              />
            </div>
          </div>

          {/* Discount Settings */}
          {settings.showDiscount && (
            <div className="card p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Pengaturan Diskon</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Tipe Diskon
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 focus:border-orange-500 focus:outline-none transition-colors"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Nilai Diskon {formData.discountType === 'percentage' ? '(%)' : '(Rp)'}
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 focus:border-orange-500 focus:outline-none transition-colors"
                    min="0"
                    step={formData.discountType === 'percentage' ? '0.01' : '1'}
                    placeholder={formData.discountType === 'percentage' ? '10' : '100000'}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Additional Discount Settings */}
          {settings.showAdditionalDiscount && (
            <div className="card p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Pengaturan Diskon Tambahan</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Tipe Diskon Tambahan
                  </label>
                  <select
                    value={formData.additionalDiscountType}
                    onChange={(e) => setFormData({ ...formData, additionalDiscountType: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 focus:border-orange-500 focus:outline-none transition-colors"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Nilai Diskon Tambahan {formData.additionalDiscountType === 'percentage' ? '(%)' : '(Rp)'}
                  </label>
                  <input
                    type="number"
                    value={formData.additionalDiscountValue}
                    onChange={(e) => setFormData({ ...formData, additionalDiscountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 focus:border-orange-500 focus:outline-none transition-colors"
                    min="0"
                    step={formData.additionalDiscountType === 'percentage' ? '0.01' : '1'}
                    placeholder={formData.additionalDiscountType === 'percentage' ? '5' : '50000'}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Default Client */}
          {settings.showClientInfo && (
            <div className="card p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Klien Default (Opsional)</h2>
              <p className="text-sm text-gray-500 mb-4">Pilih klien yang akan otomatis terisi saat menggunakan template ini</p>

              <select
                value={formData.defaultClientId}
                onChange={(e) => setFormData({ ...formData, defaultClientId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 focus:border-orange-500 focus:outline-none transition-colors"
              >
                <option value="">-- Pilih Klien (Opsional) --</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.company && `(${client.company})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Signature Settings */}
          {settings.showSignature && (
            <div className="card p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Tanda Tangan Digital</h2>

              <div className="space-y-4">
                {/* Signature Upload */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Upload Tanda Tangan
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    Upload gambar tanda tangan (PNG, JPG, WebP, maks 2MB)
                  </p>

                  {signatureUrl ? (
                    <div className="flex items-start gap-4">
                      <div className="relative w-48 h-24 border border-orange-200 rounded-xl overflow-hidden bg-gray-50">
                        <img
                          src={signatureUrl}
                          alt="Tanda tangan"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setSignatureUrl('')}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-orange-300 rounded-xl cursor-pointer hover:bg-orange-50 transition-colors">
                      {uploadingSignature ? (
                        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-orange-500 mb-2" />
                          <span className="text-sm text-gray-600">Klik untuk upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleSignatureUpload}
                        className="hidden"
                        disabled={uploadingSignature}
                      />
                    </label>
                  )}
                </div>

                {/* Signatory Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Nama Penandatangan
                    </label>
                    <input
                      type="text"
                      value={formData.signatoryName}
                      onChange={(e) => setFormData({ ...formData, signatoryName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      value={formData.signatoryTitle}
                      onChange={(e) => setFormData({ ...formData, signatoryTitle: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                      placeholder="Direktur"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="card p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Item Template</h2>
              <div className="flex gap-2">
                {catalogItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowItemCatalog(!showItemCatalog)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 font-bold text-sm rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors"
                  >
                    <Package size={16} />
                    Pilih dari Katalog
                  </button>
                )}
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 px-4 py-2 text-white font-bold text-sm rounded-xl btn-primary"
                >
                  <Plus size={16} />
                  Tambah Item
                </button>
              </div>
            </div>

            {/* Item Catalog Selector */}
            {showItemCatalog && (
              <div className="mb-6 p-6 bg-orange-50 border border-orange-300 rounded-xl">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Pilih dari Katalog</h3>
                {catalogItems.length === 0 ? (
                  <p className="text-gray-600">Belum ada item di katalog.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {catalogItems.map((catalogItem) => (
                      <button
                        key={catalogItem.id}
                        type="button"
                        onClick={() => handleAddFromCatalog(catalogItem)}
                        className="p-4 bg-white rounded-xl border border-orange-200 hover:border-orange-500 hover:shadow-md transition-all text-left"
                      >
                        <p className="font-bold text-gray-900 mb-1">{catalogItem.name}</p>
                        {catalogItem.description && (
                          <p className="text-sm text-gray-500 mb-2 line-clamp-2">{catalogItem.description}</p>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-orange-600 font-bold">{formatCurrency(catalogItem.price)}</span>
                          <span className="text-sm text-gray-500">/{catalogItem.unit}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="p-6 rounded-xl bg-gray border border-orange-200 space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-gray-900">Item #{index + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-500 rounded-xl hover:bg-gray transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Deskripsi *
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 focus:border-orange-500 focus:outline-none transition-colors"
                        placeholder="Jasa/Barang"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Jumlah *
                      </label>
                      <input
                        type="number"
                        value={item.quantity || 1}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 focus:border-orange-500 focus:outline-none transition-colors"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Harga *
                      </label>
                      <input
                        type="text"
                        value={item.priceFormatted || ''}
                        onChange={(e) => {
                          const formatted = formatCurrencyInput(e.target.value)
                          updateItem(item.id, 'price', parseCurrencyInput(formatted), formatted)
                        }}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none transition-colors"
                        placeholder="Rp 0"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="card p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Catatan Default</h2>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
              rows={3}
              placeholder="Catatan default yang akan muncul di invoice..."
            />
          </div>

          {/* Terms and Conditions */}
          <div className="card p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Syarat & Ketentuan</h2>
            <textarea
              value={formData.termsAndConditions}
              onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
              rows={4}
              placeholder="Syarat dan ketentuan yang akan muncul di invoice, misalnya: Pembayaran harus dilakukan dalam 7 hari..."
            />
          </div>

          {/* Totals & Submit */}
          <div className="card p-8">
            <div className="space-y-3 mb-8">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              {settings.showDiscount && discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Diskon {formData.discountType === 'percentage' ? `(${formData.discountValue}%)` : ''}</span>
                  <span className="font-semibold">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {settings.showAdditionalDiscount && additionalDiscountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Diskon Tambahan {formData.additionalDiscountType === 'percentage' ? `(${formData.additionalDiscountValue}%)` : ''}</span>
                  <span className="font-semibold">-{formatCurrency(additionalDiscountAmount)}</span>
                </div>
              )}
              {settings.showTax && (
                <div className="flex justify-between text-gray-600">
                  <span>Pajak ({formData.taxRate}%)</span>
                  <span className="font-semibold">{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between py-4 border-t-2 border-orange-300 text-2xl font-extrabold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 text-white font-bold rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {saving ? 'Menyimpan...' : 'Simpan Template'}
            </button>
          </div>
        </form>

      {/* MessageBox for notifications */}
      <MessageBox
        open={messageBox.state.open}
        onClose={messageBox.close}
        title={messageBox.state.title}
        message={messageBox.state.message}
        variant={messageBox.state.variant}
        confirmText={messageBox.state.confirmText}
        cancelText={messageBox.state.cancelText}
        onConfirm={messageBox.state.onConfirm}
        onCancel={messageBox.state.onCancel}
        loading={messageBox.state.loading}
      />
    </DashboardLayout>
  )
}
