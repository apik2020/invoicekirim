'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAppSession } from '@/hooks/useAppSession'
import { FileText, Save, Plus, Trash2, Loader2, Package, X, UserPlus, Check, Users, ChevronDown, PackagePlus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { DashboardLayout } from '@/components/DashboardLayout'
import { MessageBox } from '@/components/ui/MessageBox'
import { useMessageBox } from '@/hooks/useMessageBox'
import { cn } from '@/lib/utils'

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
  const sessionResult = useAppSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null)
  const [catalogSearch, setCatalogSearch] = useState('')
  const messageBox = useMessageBox()

  // Client state
  const [clients, setClients] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [showClientModal, setShowClientModal] = useState(false)
  const [newClientData, setNewClientData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
  })
  const [isCreatingClient, setIsCreatingClient] = useState(false)

  // Item modal state
  const [showItemModal, setShowItemModal] = useState(false)
  const [newItemData, setNewItemData] = useState({
    name: '',
    description: '',
    sku: '',
    unit: 'pcs',
    price: '',
    category: '',
  })
  const [isCreatingItem, setIsCreatingItem] = useState(false)

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
      fetchClients()
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

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients')
      if (res.ok) {
        const data = await res.json()
        setClients(data || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${id}`)
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
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
        messageBox.showWarning({
          title: 'Tidak Dapat Mengubah Invoice',
          message: 'Invoice yang sudah lunas tidak dapat diubah.',
          confirmText: 'Kembali',
          onConfirm: () => {
            messageBox.close()
            router.push(`/dashboard/invoices/${id}`)
          },
        })
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
      messageBox.showWarning({
        title: 'Data Belum Lengkap',
        message: 'Mohon lengkapi field yang wajib diisi: Nama Perusahaan, Nama Klien, dan Email Klien.',
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

      // Show success message before redirecting
      messageBox.showInvoiceUpdated(formData.invoiceNumber)

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/dashboard/invoices/${id}`)
      }, 1500)
    } catch (error: any) {
      messageBox.showWarning({
        title: 'Gagal Menyimpan Perubahan',
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

  // Client handling functions
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

  const handleOpenClientModal = () => {
    setNewClientData({
      name: formData.clientName || '',
      email: formData.clientEmail || '',
      phone: formData.clientPhone || '',
      company: '',
      address: formData.clientAddress || '',
    })
    setShowClientModal(true)
  }

  const handleCloseClientModal = () => {
    setShowClientModal(false)
    setNewClientData({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
    })
  }

  const handleCreateClient = async () => {
    // Validate required fields
    if (!newClientData.name || !newClientData.email) {
      messageBox.showWarning({
        title: 'Data Belum Lengkap',
        message: 'Nama klien dan email wajib diisi.',
        confirmText: 'Mengerti',
        onConfirm: () => messageBox.close(),
      })
      return
    }

    setIsCreatingClient(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClientData),
      })

      const data = await res.json()

      if (res.ok) {
        // Refresh clients list
        await fetchClients()

        // Auto-select the newly created client
        setSelectedClientId(data.id)
        setFormData({
          ...formData,
          clientName: data.name,
          clientEmail: data.email,
          clientPhone: data.phone || '',
          clientAddress: data.address || '',
        })

        // Close modal and show success
        handleCloseClientModal()
        messageBox.showClientCreated(data.name, data.email)
      } else {
        messageBox.showWarning({
          title: 'Gagal Membuat Klien',
          message: data.error || 'Gagal membuat klien baru. Silakan coba lagi.',
          confirmText: 'Mengerti',
          onConfirm: () => messageBox.close(),
        })
      }
    } catch (error) {
      messageBox.showWarning({
        title: 'Terjadi Kesalahan',
        message: 'Terjadi kesalahan saat membuat klien baru.',
        confirmText: 'Mengerti',
        onConfirm: () => messageBox.close(),
      })
    } finally {
      setIsCreatingClient(false)
    }
  }

  // Item handling functions
  const handleOpenItemModal = () => {
    setNewItemData({
      name: '',
      description: '',
      sku: '',
      unit: 'pcs',
      price: '',
      category: '',
    })
    setShowItemModal(true)
  }

  const handleCloseItemModal = () => {
    setShowItemModal(false)
    setNewItemData({
      name: '',
      description: '',
      sku: '',
      unit: 'pcs',
      price: '',
      category: '',
    })
  }

  const handleCreateItem = async () => {
    // Validate required fields
    if (!newItemData.name || !newItemData.price) {
      messageBox.showWarning({
        title: 'Data Belum Lengkap',
        message: 'Nama item dan harga wajib diisi.',
        confirmText: 'Mengerti',
        onConfirm: () => messageBox.close(),
      })
      return
    }

    // Parse price from formatted string
    const priceValue = parseInt(newItemData.price.replace(/\D/g, '')) || 0

    setIsCreatingItem(true)
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newItemData,
          price: priceValue,
          taxRate: formData.taxRate,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        // Refresh catalog items list
        await fetchCatalogItems()

        // Add the new item to invoice items
        const newItem = {
          id: Date.now().toString(),
          description: data.name,
          quantity: 1,
          price: data.price,
        }
        setItems([...items, newItem])

        // Close modal and show success
        handleCloseItemModal()
        messageBox.showSuccess({
          title: 'Item Ditambahkan!',
          message: `${data.name} berhasil ditambahkan ke katalog dan invoice.`,
        })
      } else {
        messageBox.showWarning({
          title: 'Gagal Membuat Item',
          message: data.error || 'Gagal membuat item baru. Silakan coba lagi.',
          confirmText: 'Mengerti',
          onConfirm: () => messageBox.close(),
        })
      }
    } catch (error) {
      messageBox.showWarning({
        title: 'Terjadi Kesalahan',
        message: 'Terjadi kesalahan saat membuat item baru.',
        confirmText: 'Mengerti',
        onConfirm: () => messageBox.close(),
      })
    } finally {
      setIsCreatingItem(false)
    }
  }

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
      <DashboardLayout title="Edit Invoice" showBackButton backHref={`/dashboard/invoices/${id}`}>
        <div className="flex items-center justify-center py-20">
          <div className="text-center animate-fade-in">
            <Loader2 className="w-16 h-16 text-brand-500 animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Memuat invoice...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (sessionResult.status === 'unauthenticated') {
    return null
  }

  if (notFound) {
    return (
      <DashboardLayout title="Edit Invoice" showBackButton backHref={`/dashboard/invoices/${id}`}>
        <div className="card p-8 sm:p-12 text-center max-w-md mx-auto">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-text-muted" />
          </div>
          <h3 className="text-2xl font-bold text-text-primary mb-3">
            Invoice Tidak Ditemukan
          </h3>
          <p className="text-text-secondary mb-8">
            Invoice yang Anda cari tidak ada atau telah dihapus
          </p>
          <button
            onClick={() => router.push('/dashboard/invoices')}
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl btn-primary"
          >
            Kembali ke Daftar Invoice
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Edit Invoice"
      showBackButton
      backHref={`/dashboard/invoices/${id}`}
    >
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Invoice Info */}
          <div className="card p-6 sm:p-8 animate-fade-in-up">
            <h2 className="text-lg font-bold text-text-primary mb-6">Informasi Invoice</h2>

            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="input-label">Nomor Invoice *</label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  className="input"
                  placeholder="INV-001"
                  required
                />
              </div>
              <div>
                <label className="input-label">Tanggal *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="input-label">Jatuh Tempo</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="input-label">Tarif Pajak (%)</label>
                <input
                  type="number"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
                  className="input"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>

          {/* Dari (Company Info) */}
          <div className="card p-6 sm:p-8 animate-fade-in-up animation-delay-100">
            <h2 className="text-lg font-bold text-text-primary mb-6">Dari (Info Perusahaan)</h2>

            <div className="space-y-4">
              <div>
                <label className="input-label">Nama Perusahaan *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="input"
                  placeholder="Nama perusahaan Anda"
                  required
                />
              </div>
              <div>
                <label className="input-label">Email *</label>
                <input
                  type="email"
                  value={formData.companyEmail}
                  onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                  className="input"
                  placeholder="email@perusahaan.com"
                  required
                />
              </div>
              <div>
                <label className="input-label">Telepon</label>
                <input
                  type="tel"
                  value={formData.companyPhone}
                  onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                  className="input"
                  placeholder="+62 812-3456-7890"
                />
              </div>
              <div>
                <label className="input-label">Alamat</label>
                <textarea
                  value={formData.companyAddress}
                  onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                  className="textarea"
                  rows={2}
                  placeholder="Alamat lengkap"
                />
              </div>
            </div>
          </div>

          {/* Kepada (Client Info) */}
          <div className="card p-6 sm:p-8 animate-fade-in-up animation-delay-200">
            <h2 className="text-lg font-bold text-text-primary mb-6">Kepada (Info Klien)</h2>

            {/* Client Selector */}
            <div className="mb-6 p-4 bg-brand-50 border border-brand-200 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="block text-sm font-bold text-text-primary">
                  Pilih dari Klien Tersimpan
                </label>
                <button
                  type="button"
                  onClick={handleOpenClientModal}
                  className="flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors"
                >
                  <UserPlus size={16} />
                  Tambah Klien Baru
                </button>
              </div>
              {clients.length > 0 ? (
                <>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <select
                      value={selectedClientId}
                      onChange={(e) => handleClientSelect(e.target.value)}
                      className="w-full pl-12 pr-10 py-3 rounded-xl border border-gray-200 text-text-primary focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 appearance-none cursor-pointer transition-all"
                    >
                      <option value="">-- Pilih Klien (Opsional) --</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name} {client.company && `(${client.company})`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
                  </div>
                  <p className="text-sm text-text-secondary mt-2">
                    Pilih klien untuk auto-fill data klien, atau isi manual di bawah
                  </p>
                </>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-text-secondary mb-3">Belum ada klien tersimpan</p>
                  <button
                    type="button"
                    onClick={handleOpenClientModal}
                    className="inline-flex items-center gap-2 px-4 py-2 text-white font-bold text-sm rounded-xl btn-primary"
                  >
                    <UserPlus size={16} />
                    Tambah Klien Pertama
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="input-label">Nama Klien *</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="input"
                  placeholder="Nama klien"
                  required
                />
              </div>
              <div>
                <label className="input-label">Email Klien *</label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  className="input"
                  placeholder="client@email.com"
                  required
                />
              </div>
              <div>
                <label className="input-label">Telepon</label>
                <input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  className="input"
                  placeholder="+62 812-3456-7890"
                />
              </div>
              <div>
                <label className="input-label">Alamat</label>
                <textarea
                  value={formData.clientAddress}
                  onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                  className="textarea"
                  rows={2}
                  placeholder="Alamat klien"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="card overflow-hidden animate-fade-in-up animation-delay-300">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-lg font-bold text-text-primary">Item Invoice</h2>
                <div className="flex flex-wrap gap-2">
                  {catalogItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedItemIndex(null)
                        setShowCatalogModal(true)
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-text-secondary font-bold text-sm rounded-xl border border-gray-200 bg-surface-light hover:bg-gray-100 transition-colors"
                    >
                      <Package size={16} />
                      Dari Katalog
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleOpenItemModal}
                    className="flex items-center gap-2 px-4 py-2 text-brand-600 font-bold text-sm rounded-xl border border-brand-300 hover:bg-brand-50 transition-colors"
                  >
                    <PackagePlus size={16} />
                    Tambah Item Baru
                  </button>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 px-4 py-2 text-white font-bold text-sm rounded-xl btn-primary"
                  >
                    <Plus size={16} />
                    Tambah Baris
                  </button>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-surface-light border-b border-gray-100">
                    <th className="text-left py-4 px-4 sm:px-6 text-sm font-bold text-text-secondary w-12">#</th>
                    <th className="text-left py-4 px-4 sm:px-6 text-sm font-bold text-text-secondary">Deskripsi *</th>
                    <th className="text-center py-4 px-4 text-sm font-bold text-text-secondary w-24">Qty *</th>
                    <th className="text-right py-4 px-4 text-sm font-bold text-text-secondary w-36 sm:w-40">Harga *</th>
                    <th className="text-right py-4 px-4 text-sm font-bold text-text-secondary w-32 sm:w-36">Subtotal</th>
                    <th className="text-center py-4 px-4 text-sm font-bold text-text-secondary w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-surface-light/50 transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <span className="font-bold text-text-muted">{index + 1}</span>
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 transition-all text-sm"
                          placeholder="Deskripsi item/jasa"
                          required
                        />
                      </td>
                      <td className="py-4 px-4">
                        <input
                          type="number"
                          value={item.quantity || 1}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-text-primary text-center focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 transition-all text-sm"
                          min="1"
                          required
                        />
                      </td>
                      <td className="py-4 px-4">
                        <input
                          type="number"
                          value={item.price || 0}
                          onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-text-primary text-right focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 transition-all text-sm"
                          min="0"
                          step="0.01"
                          required
                        />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-bold text-text-primary">
                          {formatCurrency(item.quantity * item.price)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Hapus item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Subtotal, Tax, Total */}
            <div className="p-4 sm:p-6 bg-surface-light border-t border-gray-100">
              <div className="max-w-sm ml-auto space-y-3">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Pajak ({formData.taxRate}%)</span>
                  <span className="font-semibold">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200 text-xl font-bold text-brand-500">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="card p-6 sm:p-8 animate-fade-in-up animation-delay-400">
            <h2 className="text-lg font-bold text-text-primary mb-4">Catatan</h2>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="textarea"
              rows={3}
              placeholder="Catatan tambahan untuk invoice..."
            />
          </div>

          {/* Submit */}
          <div className="card p-6 sm:p-8 animate-fade-in-up animation-delay-500">
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-scale-in">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-text-primary">Pilih dari Katalog</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCatalogModal(false)
                      setSelectedItemIndex(null)
                      setCatalogSearch('')
                    }}
                    className="p-2 text-text-muted hover:text-text-primary rounded-xl hover:bg-gray-100 transition-colors"
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
                    className="input"
                    autoFocus
                  />
                </div>
              </div>

              {/* Catalog Items List */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {filteredCatalogItems.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 text-text-muted" />
                    </div>
                    <p className="text-text-secondary">
                      {catalogSearch ? 'Tidak ada item ditemukan' : 'Belum ada item di katalog'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCatalogItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl border border-gray-200 hover:border-brand-400 hover:bg-brand-50 transition-all cursor-pointer"
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
                              <h4 className="font-bold text-text-primary">{item.name}</h4>
                              {item.sku && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-text-secondary">
                                  {item.sku}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-sm text-text-secondary mb-1">{item.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-sm text-text-muted">
                              {item.category && (
                                <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                                  {item.category}
                                </span>
                              )}
                              <span>Unit: {item.unit}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-text-primary">{formatCurrency(item.price)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-100 bg-surface-light">
                <p className="text-sm text-text-secondary text-center">
                  {selectedItemIndex !== null
                    ? 'Klik item untuk mengganti item yang dipilih'
                    : 'Klik item untuk menambahkan ke invoice'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add New Client Modal */}
        {showClientModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 sm:px-8 py-6 rounded-t-2xl z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Tambah Klien Baru</h2>
                    <p className="text-sm text-text-secondary mt-1">Klien baru akan disimpan dan dapat digunakan untuk invoice berikutnya</p>
                  </div>
                  <button
                    onClick={handleCloseClientModal}
                    className="p-2 text-text-muted hover:text-text-primary rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-6 sm:px-8 py-6">
                <form onSubmit={(e) => { e.preventDefault(); handleCreateClient(); }} className="space-y-5">
                  {/* Name */}
                  <div>
                    <label className="input-label">Nama Klien *</label>
                    <input
                      type="text"
                      value={newClientData.name}
                      onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                      className="input"
                      placeholder="Nama lengkap klien"
                      required
                    />
                  </div>

                  {/* Company */}
                  <div>
                    <label className="input-label">Perusahaan</label>
                    <input
                      type="text"
                      value={newClientData.company}
                      onChange={(e) => setNewClientData({ ...newClientData, company: e.target.value })}
                      className="input"
                      placeholder="Nama perusahaan klien"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="input-label">Email *</label>
                    <input
                      type="email"
                      value={newClientData.email}
                      onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                      className="input"
                      placeholder="email@klien.com"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="input-label">Telepon</label>
                    <input
                      type="tel"
                      value={newClientData.phone}
                      onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                      className="input"
                      placeholder="+62 812 3456 7890"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="input-label">Alamat</label>
                    <textarea
                      value={newClientData.address}
                      onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                      rows={3}
                      className="textarea"
                      placeholder="Alamat lengkap klien"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseClientModal}
                      className="flex-1 px-6 py-3 text-text-secondary font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingClient}
                      className="flex-1 px-6 py-3 text-white font-bold rounded-xl btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingClient ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          <span>Simpan Klien</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add New Item Modal */}
        {showItemModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 sm:px-8 py-6 rounded-t-2xl z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Tambah Item Baru</h2>
                    <p className="text-sm text-text-secondary mt-1">Item baru akan disimpan ke katalog dan ditambahkan ke invoice</p>
                  </div>
                  <button
                    onClick={handleCloseItemModal}
                    className="p-2 text-text-muted hover:text-text-primary rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-6 sm:px-8 py-6">
                <form onSubmit={(e) => { e.preventDefault(); handleCreateItem(); }} className="space-y-5">
                  {/* Name */}
                  <div>
                    <label className="input-label">Nama Item *</label>
                    <input
                      type="text"
                      value={newItemData.name}
                      onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
                      className="input"
                      placeholder="Nama produk/jasa"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="input-label">Deskripsi</label>
                    <textarea
                      value={newItemData.description}
                      onChange={(e) => setNewItemData({ ...newItemData, description: e.target.value })}
                      rows={2}
                      className="textarea"
                      placeholder="Deskripsi singkat item"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* SKU */}
                    <div>
                      <label className="input-label">SKU</label>
                      <input
                        type="text"
                        value={newItemData.sku}
                        onChange={(e) => setNewItemData({ ...newItemData, sku: e.target.value })}
                        className="input"
                        placeholder="Kode barang"
                      />
                    </div>

                    {/* Unit */}
                    <div>
                      <label className="input-label">Satuan *</label>
                      <select
                        value={newItemData.unit}
                        onChange={(e) => setNewItemData({ ...newItemData, unit: e.target.value })}
                        className="select"
                        required
                      >
                        <option value="pcs">Pcs</option>
                        <option value="kg">Kg</option>
                        <option value="gram">Gram</option>
                        <option value="meter">Meter</option>
                        <option value="jam">Jam</option>
                        <option value="hari">Hari</option>
                        <option value="bulan">Bulan</option>
                        <option value="unit">Unit</option>
                        <option value="set">Set</option>
                        <option value="box">Box</option>
                      </select>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="input-label">Kategori</label>
                    <input
                      type="text"
                      value={newItemData.category}
                      onChange={(e) => setNewItemData({ ...newItemData, category: e.target.value })}
                      className="input"
                      placeholder="Contoh: Jasa, Produk, dll"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="input-label">Harga *</label>
                    <input
                      type="text"
                      value={newItemData.price}
                      onChange={(e) => {
                        const numbers = e.target.value.replace(/\D/g, '')
                        if (numbers) {
                          setNewItemData({ ...newItemData, price: 'Rp ' + parseInt(numbers).toLocaleString('id-ID') })
                        } else {
                          setNewItemData({ ...newItemData, price: '' })
                        }
                      }}
                      className="input"
                      placeholder="Rp 0"
                      required
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseItemModal}
                      className="flex-1 px-6 py-3 text-text-secondary font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingItem}
                      className="flex-1 px-6 py-3 text-white font-bold rounded-xl btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingItem ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          <span>Simpan Item</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

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
