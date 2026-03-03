'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Save, Plus, Trash2, Loader2, Users, ChevronDown, Package, UserPlus, X, Check, PackagePlus } from 'lucide-react'
import { generateInvoiceNumber } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import DashboardHeader from '@/components/DashboardHeader'
import { MessageBox } from '@/components/ui/MessageBox'
import { useMessageBox } from '@/hooks/useMessageBox'

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
  const messageBox = useMessageBox()

  // New client modal state
  const [showClientModal, setShowClientModal] = useState(false)
  const [newClientData, setNewClientData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
  })
  const [isCreatingClient, setIsCreatingClient] = useState(false)

  // New item modal state
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
        await loadClients()

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

    setIsCreatingItem(true)
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newItemData,
          price: parseCurrencyInput(newItemData.price),
          taxRate: formData.taxRate,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        // Refresh catalog items list
        await loadCatalogItems()

        // Add the new item to invoice items
        const newItem = {
          id: Date.now().toString(),
          description: data.name,
          quantity: 1,
          price: data.price,
          priceFormatted: formatCurrencyInput(data.price.toString()),
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
      messageBox.showWarning({
        title: 'Gagal Memuat Template',
        message: 'Template tidak dapat dimuat. Silakan coba lagi atau buat invoice manual.',
        confirmText: 'Mengerti',
        onConfirm: () => messageBox.close(),
      })
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

      // Show success message before redirecting
      messageBox.showInvoiceCreated(
        formData.invoiceNumber,
        formatCurrency(total),
        formData.clientName
      )

      // Redirect after a short delay to show the message
      setTimeout(() => {
        router.push(`/dashboard/invoices/${data.id}`)
      }, 1500)
    } catch (error: any) {
      messageBox.showWarning({
        title: 'Gagal Membuat Invoice',
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
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-gray-900">
                  Pilih dari Klien Tersimpan
                </label>
                <button
                  type="button"
                  onClick={handleOpenClientModal}
                  className="flex items-center gap-1.5 text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors"
                >
                  <UserPlus size={16} />
                  Tambah Klien Baru
                </button>
              </div>
              {clients.length > 0 ? (
                <>
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
                    Pilih klien untuk auto-fill data klien, atau isi manual di bawah
                  </p>
                </>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-gray-600 mb-3">Belum ada klien tersimpan</p>
                  <button
                    type="button"
                    onClick={handleOpenClientModal}
                    className="inline-flex items-center gap-2 px-4 py-2 text-white font-bold text-sm rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 transition-all"
                  >
                    <UserPlus size={16} />
                    Tambah Klien Pertama
                  </button>
                </div>
              )}
            </div>

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
          <div className="card overflow-hidden">
            <div className="p-6 border-b border-orange-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-lg font-bold text-gray-900">Item Invoice</h2>
                <div className="flex flex-wrap gap-2">
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
                    onClick={handleOpenItemModal}
                    className="flex items-center gap-2 px-4 py-2 text-orange-600 font-bold text-sm rounded-xl border border-orange-300 hover:bg-orange-50 transition-colors"
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

            {/* Item Catalog Selector */}
            {showItemCatalog && (
              <div className="p-6 bg-orange-50 border-b border-orange-200">
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

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-orange-200">
                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 w-12">#</th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">Deskripsi *</th>
                    <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 w-24">Qty *</th>
                    <th className="text-right py-4 px-4 text-sm font-bold text-gray-700 w-40">Harga *</th>
                    <th className="text-right py-4 px-4 text-sm font-bold text-gray-700 w-36">Subtotal</th>
                    <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className="border-b border-orange-100 hover:bg-orange-50/30 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-bold text-gray-500">{index + 1}</span>
                      </td>
                      <td className="py-4 px-6">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors text-sm"
                          placeholder="Deskripsi item/jasa"
                          required
                        />
                      </td>
                      <td className="py-4 px-4">
                        <input
                          type="number"
                          value={item.quantity || 1}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 rounded-lg border border-orange-200 text-gray-900 text-center focus:border-orange-500 focus:outline-none transition-colors text-sm"
                          min="1"
                          required
                        />
                      </td>
                      <td className="py-4 px-4">
                        <input
                          type="text"
                          value={item.priceFormatted || ''}
                          onChange={(e) => {
                            const formatted = formatCurrencyInput(e.target.value)
                            updateItem(item.id, 'price', parseCurrencyInput(formatted), formatted)
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-orange-200 text-gray-900 text-right focus:border-orange-500 focus:outline-none transition-colors text-sm"
                          placeholder="Rp 0"
                          required
                        />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-bold text-gray-900">
                          {formatCurrency(item.quantity * item.price)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
            <div className="p-6 bg-gray-50 border-t border-orange-200">
              <div className="max-w-sm ml-auto space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Pajak ({formData.taxRate}%)</span>
                  <span className="font-semibold">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-orange-300 text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
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

          {/* Submit */}
          <div className="card p-8">
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

      {/* Add New Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl z-10">
              <h2 className="text-2xl font-bold text-gray-900">Tambah Klien Baru</h2>
              <p className="text-sm text-gray-600 mt-1">Klien baru akan disimpan dan dapat digunakan untuk invoice berikutnya</p>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-6">
              <form onSubmit={(e) => { e.preventDefault(); handleCreateClient(); }} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Nama Klien *
                  </label>
                  <input
                    type="text"
                    value={newClientData.name}
                    onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="Nama lengkap klien"
                    required
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Perusahaan
                  </label>
                  <input
                    type="text"
                    value={newClientData.company}
                    onChange={(e) => setNewClientData({ ...newClientData, company: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="Nama perusahaan klien"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newClientData.email}
                    onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="email@klien.com"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Telepon
                  </label>
                  <input
                    type="tel"
                    value={newClientData.phone}
                    onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="+62 812 3456 7890"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Alamat
                  </label>
                  <textarea
                    value={newClientData.address}
                    onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors resize-none"
                    placeholder="Alamat lengkap klien"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseClientModal}
                    className="flex-1 px-6 py-3 text-gray-700 font-bold rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingClient}
                    className="flex-1 px-6 py-3 text-white font-bold rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/30"
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

            {/* Modal Close Button */}
            <button
              onClick={handleCloseClientModal}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl z-10">
              <h2 className="text-2xl font-bold text-gray-900">Tambah Item Baru</h2>
              <p className="text-sm text-gray-600 mt-1">Item baru akan disimpan ke katalog dan ditambahkan ke invoice</p>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-6">
              <form onSubmit={(e) => { e.preventDefault(); handleCreateItem(); }} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Nama Item *
                  </label>
                  <input
                    type="text"
                    value={newItemData.name}
                    onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="Nama produk/jasa"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    value={newItemData.description}
                    onChange={(e) => setNewItemData({ ...newItemData, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors resize-none"
                    placeholder="Deskripsi singkat item"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* SKU */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={newItemData.sku}
                      onChange={(e) => setNewItemData({ ...newItemData, sku: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                      placeholder="Kode barang"
                    />
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Satuan *
                    </label>
                    <select
                      value={newItemData.unit}
                      onChange={(e) => setNewItemData({ ...newItemData, unit: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-orange-200 text-gray-900 focus:border-orange-500 focus:outline-none transition-colors"
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
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Kategori
                  </label>
                  <input
                    type="text"
                    value={newItemData.category}
                    onChange={(e) => setNewItemData({ ...newItemData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="Contoh: Jasa, Produk, dll"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Price */}
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Harga *
                    </label>
                    <input
                      type="text"
                      value={newItemData.price}
                      onChange={(e) => setNewItemData({ ...newItemData, price: formatCurrencyInput(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                      placeholder="Rp 0"
                      required
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseItemModal}
                    className="flex-1 px-6 py-3 text-gray-700 font-bold rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingItem}
                    className="flex-1 px-6 py-3 text-white font-bold rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/30"
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

            {/* Modal Close Button */}
            <button
              onClick={handleCloseItemModal}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
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
