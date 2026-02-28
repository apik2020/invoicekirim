'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FileText, Save, Plus, Trash2, Loader2, Users, ChevronDown, Package } from 'lucide-react'
import { generateInvoiceNumber } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import DashboardHeader from '@/components/DashboardHeader'

// Helper functions untuk currency input
const formatCurrencyInput = (value: string): string => {
  // Hapus karakter non-digit
  const numbers = value.replace(/\D/g, '')
  if (!numbers) return ''

  // Format ke currency Indonesia
  return 'Rp ' + parseInt(numbers).toLocaleString('id-ID')
}

const parseCurrencyInput = (value: string): number => {
  // Hapus semua karakter non-digit
  const numbers = value.replace(/\D/g, '')
  return numbers ? parseInt(numbers) : 0
}

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  price: number
  priceFormatted?: string
}

function NewInvoicePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionResult = useSession()
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [catalogItems, setCatalogItems] = useState<any[]>([])
  const [showItemCatalog, setShowItemCatalog] = useState(false)

  const templateId = searchParams.get('template')

  const [formData, setFormData] = useState({
    invoiceNumber: generateInvoiceNumber(),
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    notes: '',
    taxRate: 11,
  })

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, price: 0, priceFormatted: '' }
  ])

  // Handle mount and authentication
  useEffect(() => {
    setMounted(true)

    if (sessionResult.status === 'unauthenticated') {
      router.push('/login')
      return
    }

    // Load user profile for company info
    if (sessionResult.status === 'authenticated' && !formData.companyName) {
      loadUserProfile()
    }

    // Load clients
    if (sessionResult.status === 'authenticated') {
      loadClients()
    }

    // Load catalog items
    if (sessionResult.status === 'authenticated') {
      loadCatalogItems()
    }

    // Load template if templateId is provided
    if (templateId && sessionResult.status === 'authenticated') {
      loadTemplate(templateId)
    }
  }, [sessionResult, router, templateId])

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

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId)
    const selectedClient = clients.find(c => c.id === clientId)

    if (selectedClient) {
      setFormData({
        ...formData,
        clientName: selectedClient.name,
        clientEmail: selectedClient.email,
        clientPhone: selectedClient.phone || '',
        clientAddress: selectedClient.address || '',
      })
    } else {
      // Clear client info if "Manually" is selected or cleared
      setFormData({
        ...formData,
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        clientAddress: '',
      })
    }
  }

  const loadUserProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const profile = await res.json()
        setFormData(prev => ({
          ...prev,
          companyName: profile.companyName || prev.companyName,
          companyEmail: profile.companyEmail || prev.companyEmail,
          companyPhone: profile.companyPhone || prev.companyPhone,
          companyAddress: profile.companyAddress || prev.companyAddress,
        }))
      }
    } catch (error) {
      console.error('Failed to load user profile:', error)
    }
  }

  const loadTemplate = async (id: string) => {
    setLoadingTemplate(true)
    try {
      const res = await fetch(`/api/templates/${id}`)
      if (!res.ok) {
        throw new Error('Gagal memuat template')
      }

      const template = await res.json()

      // Load template data into form
      setFormData(prev => ({
        ...prev,
        taxRate: template.taxRate || 11,
        notes: template.notes || '',
      }))

      // Load template items
      if (template.items && template.items.length > 0) {
        setItems(template.items.map((item: any) => ({
          id: Date.now().toString() + Math.random(),
          description: item.description,
          quantity: item.quantity,
          price: item.price,
        })))
      }
    } catch (error) {
      console.error('Error loading template:', error)
      alert('Gagal memuat template')
    } finally {
      setLoadingTemplate(false)
    }
  }

  // Show loading state
  if (!mounted || sessionResult.status === 'loading' || loadingTemplate) {
    return (
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gray-900 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {loadingTemplate ? 'Memuat template...' : 'Memuat...'}
          </p>
        </div>
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
    if (!formData.companyName || !formData.clientName || !formData.clientEmail) {
      alert('Mohon lengkapi field yang wajib diisi')
      return
    }

    if (items.some((item) => !item.description || item.price < 0)) {
      alert('Mohon lengkapi semua item dengan benar')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal membuat invoice')
      }

      const data = await res.json()
      router.push(`/dashboard/invoices/${data.id}`)
    } catch (error: any) {
      alert(error.message)
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
  const taxAmount = subtotal * (formData.taxRate / 100)
  const total = subtotal + taxAmount

  return (
    <div className="min-h-screen bg-fresh-bg">
      {/* Header */}
      <DashboardHeader
        title="Buat Invoice Baru"
        showBackButton={true}
        backHref="/dashboard/invoices"
      />

      {/* Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          {/* Invoice Info */}
          <div className="card p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Informasi Invoice</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Nomor Invoice *
                </label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="INV-001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Tanggal *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Jatuh Tempo
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Tarif Pajak (%)
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

          {/* Dari (Company Info) */}
          <div className="card p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Dari (Info Perusahaan)</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Nama Perusahaan *
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-500 cursor-not-allowed"
                  placeholder="Nama perusahaan Anda"
                  required
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.companyEmail}
                  onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-500 cursor-not-allowed"
                  placeholder="email@perusahaan.com"
                  required
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Telepon
                </label>
                <input
                  type="tel"
                  value={formData.companyPhone}
                  onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-500 cursor-not-allowed"
                  placeholder="+62 812-3456-7890"
                  readOnly
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Alamat
                </label>
                <input
                  type="text"
                  value={formData.companyAddress}
                  onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-500 cursor-not-allowed"
                  placeholder="Alamat lengkap"
                  readOnly
                />
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-orange-50 border border-orange-200">
              <p className="text-sm text-orange-700">
                ℹ️ Info perusahaan diambil dari pengaturan profil. Untuk mengubah, silakan ke{' '}
                <a href="/dashboard/settings" className="font-bold underline hover:text-orange-800">
                  Pengaturan
                </a>
              </p>
            </div>
          </div>

          {/* Kepada (Client Info) */}
          <div className="card p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Kepada (Info Klien)</h2>

            {/* Client Selector */}
            {clients.length > 0 && (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Pilih dari Klien Tersimpan
                </label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 rounded-xl border border-orange-200 text-gray-900 focus:border-orange-500 focus:outline-none appearance-none cursor-pointer transition-colors"
                  >
                    <option value="">-- Pilih Klien (Opsional) --</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.company && `(${client.company})`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  💡 Pilih klien untuk auto-fill data klien, atau isi manual di bawah
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Nama Klien *
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="Nama klien"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Email Klien *
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="client@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Telepon
                </label>
                <input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="+62 812-3456-7890"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Alamat
                </label>
                <input
                  type="text"
                  value={formData.clientAddress}
                  onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="Alamat klien"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="card p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Item Invoice</h2>
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

            {/* Items List */}
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="p-6 rounded-xl bg-gray border border-orange-200 space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-gray-900">Item #{index + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-teal-light rounded-xl hover:bg-gray transition-colors"
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
                        className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
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
                        className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
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
                        className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                        placeholder="Rp 0"
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <span className="font-bold text-gray-900 text-right">
                        {formatCurrency(item.quantity * item.price)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="card p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Catatan</h2>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
              rows={3}
              placeholder="Catatan tambahan untuk invoice..."
            />
          </div>

          {/* Totals & Submit */}
          <div className="card p-8">
            <div className="space-y-3 mb-8">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Pajak ({formData.taxRate}%)</span>
                <span className="font-semibold">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between py-4 border-t-2 border-orange-300 text-gray-900 text-2xl font-bold">
                <span>Total</span>
                <span className="text-gray-900">{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 text-white font-bold rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {saving ? 'Menyimpan...' : 'Simpan Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
      </div>
    }>
      <NewInvoicePageContent />
    </Suspense>
  )
}
