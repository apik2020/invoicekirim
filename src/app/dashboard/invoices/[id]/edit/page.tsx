'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FileText, Save, Plus, Trash2, Loader2, Package, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import DashboardHeader from '@/components/DashboardHeader'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  price: number
}

interface CatalogItem {
  id: string
  name: string
  description: string | null
  price: number
  unit: string
  sku: string | null
  category: string | null
}

interface InvoiceData {
  invoiceNumber: string
  date: string
  dueDate: string
  companyName: string
  companyEmail: string
  companyPhone: string
  companyAddress: string
  clientName: string
  clientEmail: string
  clientPhone: string
  clientAddress: string
  notes: string
  taxRate: number
}

export default function EditInvoicePage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params as { id: string }
  const sessionResult = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null)
  const [catalogSearch, setCatalogSearch] = useState('')

  const [formData, setFormData] = useState<InvoiceData>({
    invoiceNumber: '',
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
    { id: '1', description: '', quantity: 1, price: 0 }
  ])

  const [invoiceStatus, setInvoiceStatus] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)

    if (!sessionResult || sessionResult.status === 'unauthenticated') {
      router.push('/login')
    } else if (sessionResult.status === 'authenticated' && id) {
      fetchInvoice()
      fetchCatalogItems()
    }
  }, [sessionResult, id, router])

  const fetchCatalogItems = async () => {
    try {
      const res = await fetch('/api/items')
      if (res.ok) {
        const data = await res.json()
        setCatalogItems(data || [])
      }
    } catch (error) {
      console.error('Error fetching catalog items:', error)
    }
  }

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${id}`)
      if (!res.ok) {
        if (res.status === 404) {
          setNotFound(true)
        }
        throw new Error('Gagal mengambil invoice')
      }

      const data = await res.json()

      // Check for error response
      if (data.error) {
        setNotFound(true)
        return
      }

      setInvoiceStatus(data.status)

      // Check if invoice can be edited
      if (data.status === 'PAID') {
        alert('Invoice yang sudah lunas tidak dapat diubah')
        router.push(`/dashboard/invoices/${id}`)
        return
      }

      // Populate form data
      setFormData({
        invoiceNumber: data.invoiceNumber,
        date: new Date(data.date).toISOString().split('T')[0],
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : '',
        companyName: data.companyName || '',
        companyEmail: data.companyEmail || '',
        companyPhone: data.companyPhone || '',
        companyAddress: data.companyAddress || '',
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone || '',
        clientAddress: data.clientAddress || '',
        notes: data.notes || '',
        taxRate: data.taxRate || 11,
      })

      // Populate items
      if (data.items && data.items.length > 0) {
        setItems(data.items.map((item: any) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
        })))
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
    } finally {
      setLoading(false)
    }
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
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal mengupdate invoice')
      }

      router.push(`/dashboard/invoices/${id}`)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), description: '', quantity: 1, price: 0 }
    ])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const deleteAndReplaceItem = (index: number) => {
    setSelectedItemIndex(index)
    setShowCatalogModal(true)
  }

  const selectCatalogItem = (catalogItem: CatalogItem) => {
    if (selectedItemIndex !== null) {
      const newItems = [...items]
      newItems[selectedItemIndex] = {
        id: Date.now().toString(),
        description: catalogItem.name + (catalogItem.description ? ` - ${catalogItem.description}` : ''),
        quantity: 1,
        price: catalogItem.price,
      }
      setItems(newItems)
    }
    setShowCatalogModal(false)
    setSelectedItemIndex(null)
    setCatalogSearch('')
  }

  const addCatalogItemAsNew = (catalogItem: CatalogItem) => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: catalogItem.name + (catalogItem.description ? ` - ${catalogItem.description}` : ''),
        quantity: 1,
        price: catalogItem.price,
      }
    ])
    setShowCatalogModal(false)
    setSelectedItemIndex(null)
    setCatalogSearch('')
  }

  const filteredCatalogItems = catalogItems.filter((item) =>
    item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    (item.description?.toLowerCase().includes(catalogSearch.toLowerCase()) ?? false) ||
    (item.sku?.toLowerCase().includes(catalogSearch.toLowerCase()) ?? false)
  )

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  const taxAmount = subtotal * (formData.taxRate / 100)
  const total = subtotal + taxAmount

  if (!mounted || loading || !sessionResult || sessionResult.status === 'loading') {
    return (
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-gray-900 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat invoice...</p>
        </div>
      </div>
    )
  }

  if (sessionResult.status === 'unauthenticated') {
    return null
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center">
        <div className="card p-16 text-center max-w-md">
          <div className="w-24 h-24 rounded-2xl icon-box flex items-center justify-center mx-auto mb-6">
            <FileText className="w-12 h-12 text-gray-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Invoice Tidak Ditemukan
          </h3>
          <p className="text-gray-600 mb-8">
            Invoice yang Anda cari tidak ada atau telah dihapus
          </p>
          <button
            onClick={() => router.push('/dashboard/invoices')}
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl btn-primary"
          >
            Kembali ke Daftar Invoice
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-fresh-bg">
      {/* Header */}
      <DashboardHeader
        title="Edit Invoice"
        showBackButton={true}
        backHref={`/dashboard/invoices/${id}`}
      />

      {/* Form */}
      <div className="container mx-auto px-4 py-10">
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
                  className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 focus:border-orange-500 focus:outline-none transition-colors"
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
                  className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 focus:border-orange-500 focus:outline-none transition-colors"
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

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Nama Perusahaan *
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="Nama perusahaan Anda"
                  required
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
                  className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="email@perusahaan.com"
                  required
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
                  className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="+62 812-3456-7890"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Alamat
                </label>
                <textarea
                  value={formData.companyAddress}
                  onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                  rows={2}
                  placeholder="Alamat lengkap"
                />
              </div>
            </div>
          </div>

          {/* Kepada (Client Info) */}
          <div className="card p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Kepada (Info Klien)</h2>

            <div className="space-y-4">
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
                <textarea
                  value={formData.clientAddress}
                  onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                  rows={2}
                  placeholder="Alamat klien"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="card p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Item Invoice</h2>
              <div className="flex items-center gap-3">
                {catalogItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItemIndex(null)
                      setShowCatalogModal(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 font-bold text-sm rounded-xl border border-orange-200 hover:bg-orange-50 transition-colors"
                  >
                    <Package size={16} />
                    Dari Katalog
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

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="p-6 rounded-xl bg-gray border border-orange-200 space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-gray-900">Item #{index + 1}</span>
                    <div className="flex items-center gap-2">
                      {catalogItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => deleteAndReplaceItem(index)}
                          className="p-2 text-orange-600 rounded-xl hover:bg-orange-100 transition-colors"
                          title="Ganti dari Katalog"
                        >
                          <Package size={16} />
                        </button>
                      )}
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                          title="Hapus Item"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
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
                        Harga (Rp) *
                      </label>
                      <input
                        type="number"
                        value={item.price || 0}
                        onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  <div className="text-right font-bold text-gray-900">
                    {formatCurrency(item.quantity * item.price)}
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
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>

        {/* Catalog Modal */}
        {showCatalogModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 border-b border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Pilih dari Katalog</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCatalogModal(false)
                      setSelectedItemIndex(null)
                      setCatalogSearch('')
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Cari item..."
                    className="w-full px-4 py-3 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              {/* Catalog Items List */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {filteredCatalogItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {catalogSearch ? 'Tidak ada item ditemukan' : 'Belum ada item di katalog'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCatalogItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl border border-orange-200 hover:border-orange-400 hover:bg-orange-50 transition-all cursor-pointer"
                        onClick={() => {
                          if (selectedItemIndex !== null) {
                            selectCatalogItem(item)
                          } else {
                            addCatalogItemAsNew(item)
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-gray-900">{item.name}</h4>
                              {item.sku && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                  {item.sku}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              {item.category && (
                                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                                  {item.category}
                                </span>
                              )}
                              <span>Unit: {item.unit}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-gray-900">{formatCurrency(item.price)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-orange-200 bg-gray-50">
                <p className="text-sm text-gray-600 text-center">
                  {selectedItemIndex !== null
                    ? 'Klik item untuk mengganti item yang dipilih'
                    : 'Klik item untuk menambahkan ke invoice'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
