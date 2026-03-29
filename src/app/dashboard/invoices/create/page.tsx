'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppSession } from '@/hooks/useAppSession'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { Save, Plus, Trash2, Loader2, Users, ChevronDown, Package, UserPlus, X, Check, PackagePlus, Lock } from 'lucide-react'
import { generateInvoiceNumber } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { DashboardLayout } from '@/components/DashboardLayout'
import { MessageBox } from '@/components/ui/MessageBox'
import { useMessageBox } from '@/hooks/useMessageBox'
import { cn } from '@/lib/utils'

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

interface TemplateSettings {
  showClientInfo: boolean
  showDiscount: boolean
  showAdditionalDiscount: boolean
  showTax: boolean
  showSignature: boolean
}

function NewInvoicePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionResult = useAppSession()
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [catalogItems, setCatalogItems] = useState<any[]>([])
  const [showItemCatalog, setShowItemCatalog] = useState(false)
  const messageBox = useMessageBox()

  // Check feature access for templates and branding
  const { hasAccess: hasTemplateAccess, isLoading: checkingTemplateAccess } = useFeatureAccess('INVOICE_TEMPLATE')
  const { hasAccess: hasBrandingAccess } = useFeatureAccess('branding')

  // Template settings state
  const [templateSettings, setTemplateSettings] = useState<TemplateSettings>({
    showClientInfo: true,
    showDiscount: false,
    showAdditionalDiscount: false,
    showTax: true,
    showSignature: false,
  })
  const [signatureUrl, setSignatureUrl] = useState<string>('')

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
    // New fields for template settings
    termsAndConditions: '',
    signatoryName: '',
    signatoryTitle: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    additionalDiscountType: 'percentage' as 'percentage' | 'fixed',
    additionalDiscountValue: 0,
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

    // Load template if templateId is provided (only if user has template access)
    if (templateId && sessionResult.status === 'authenticated' && !checkingTemplateAccess) {
      // Check if user has access to templates before loading
      if (hasTemplateAccess) {
        loadTemplate(templateId)
      } else {
        // Show message that templates are Pro only
        messageBox.showWarning({
          title: 'Fitur Template Pro',
          message: 'Template invoice kustom hanya tersedia untuk pengguna Pro. Upgrade untuk menggunakan template dan mempercepat pembuatan invoice.',
          confirmText: 'Mengerti',
          onConfirm: () => {
            messageBox.close()
            // Remove template from URL and redirect to clean create page
            router.push('/dashboard/invoices/create')
          },
        })
      }
    }
  }, [sessionResult, router, templateId, hasTemplateAccess, checkingTemplateAccess])

  const loadClients = async () => {
    try {
      const res = await fetch('/api/clients', {
        credentials: 'include',
      })

      if (res.status === 401) {
        // Unauthorized - redirect to login
        router.push('/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setClients(data)
      } else {
        console.warn('Clients API returned status:', res.status)
      }
    } catch (error) {
      // Network error - log warning but don't break the UI
      console.warn('Failed to load clients (network error):', error)
    }
  }

  const loadCatalogItems = async () => {
    try {
      const res = await fetch('/api/items', {
        credentials: 'include',
      })

      if (res.status === 401) {
        // Unauthorized - session might be expired
        console.warn('Catalog items: Unauthorized, skipping load')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setCatalogItems(data)
      } else {
        // Non-OK response but not an auth error
        console.warn('Catalog items API returned status:', res.status)
      }
    } catch (error) {
      // Network error or other issue - silently fail since catalog items are optional
      console.warn('Failed to load catalog items (non-critical):', error)
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
        termsAndConditions: template.termsAndConditions || '',
        signatoryName: template.signatoryName || '',
        signatoryTitle: template.signatoryTitle || '',
        discountType: template.discountType || 'percentage',
        discountValue: template.discountValue || 0,
        additionalDiscountType: template.additionalDiscountType || 'percentage',
        additionalDiscountValue: template.additionalDiscountValue || 0,
      }))

      // Load template settings
      if (template.settings) {
        setTemplateSettings({
          showClientInfo: template.settings.showClientInfo ?? true,
          showDiscount: template.settings.showDiscount ?? false,
          showAdditionalDiscount: template.settings.showAdditionalDiscount ?? false,
          showTax: template.settings.showTax ?? true,
          showSignature: template.settings.showSignature ?? false,
        })
      }

      // Load signature
      if (template.signatureUrl) {
        setSignatureUrl(template.signatureUrl)
      }

      // Load template items
      if (template.items && template.items.length > 0) {
        setItems(template.items.map((item: any) => ({
          id: Date.now().toString() + Math.random(),
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          priceFormatted: formatCurrencyInput(item.price.toString()),
        })))
      }

      // Load default client if set
      if (template.defaultClientId) {
        const clientRes = await fetch(`/api/clients`)
        if (clientRes.ok) {
          const clients = await clientRes.json()
          const defaultClient = clients.find((c: any) => c.id === template.defaultClientId)
          if (defaultClient) {
            setSelectedClientId(defaultClient.id)
            setFormData(prev => ({
              ...prev,
              clientName: defaultClient.name,
              clientEmail: defaultClient.email,
              clientPhone: defaultClient.phone || '',
              clientAddress: defaultClient.address || '',
            }))
          }
        }
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
      <DashboardLayout title="Buat Invoice Baru" showBackButton backHref="/dashboard/invoices">
        <div className="flex items-center justify-center py-20">
          <div className="text-center animate-fade-in">
            <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">
              {loadingTemplate ? 'Memuat template...' : 'Memuat...'}
            </p>
          </div>
        </div>
      </DashboardLayout>
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
          settings: templateSettings,
          signatureUrl: signatureUrl || null,
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
    // Check if there's an empty item (description is empty)
    const emptyItemIndex = items.findIndex(item => !item.description || item.description.trim() === '')

    if (emptyItemIndex !== -1) {
      // Replace the first empty item
      setItems(items.map((item, index) =>
        index === emptyItemIndex
          ? { id: Date.now().toString(), description: '', quantity: 1, price: 0, priceFormatted: '' }
          : item
      ))
    } else {
      // Add new item at the end if no empty item exists
      setItems([
        ...items,
        { id: Date.now().toString(), description: '', quantity: 1, price: 0, priceFormatted: '' }
      ])
    }
  }

  const removeItem = (id: string) => {
    if (items.length === 1) {
      // If only 1 item, reset it to empty state instead of removing
      setItems([{ id: Date.now().toString(), description: '', quantity: 1, price: 0, priceFormatted: '' }])
    } else {
      // Remove the item if there are multiple items
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

  // Calculate discounts
  const discountAmount = templateSettings.showDiscount && formData.discountValue > 0
    ? (formData.discountType === 'percentage'
      ? subtotal * (formData.discountValue / 100)
      : Math.min(formData.discountValue, subtotal))
    : 0
  const afterFirstDiscount = subtotal - discountAmount
  const additionalDiscountAmount = templateSettings.showAdditionalDiscount && formData.additionalDiscountValue > 0
    ? (formData.additionalDiscountType === 'percentage'
      ? afterFirstDiscount * (formData.additionalDiscountValue / 100)
      : Math.min(formData.additionalDiscountValue, afterFirstDiscount))
    : 0
  const taxableAmount = afterFirstDiscount - additionalDiscountAmount
  const taxAmount = templateSettings.showTax ? taxableAmount * ((formData.taxRate ?? 0) / 100) : 0
  const total = taxableAmount + taxAmount

  return (
    <DashboardLayout
      title="Buat Invoice Baru"
      showBackButton
      backHref="/dashboard/invoices"
    >
      {/* Form */}
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
                  value={formData.taxRate ?? 0}
                  onChange={(e) => setFormData({ ...formData, taxRate: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-text-primary">Dari (Info Perusahaan)</h2>
              {!hasBrandingAccess && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
                  <Lock size={14} className="text-amber-600" />
                  <span className="text-xs font-semibold text-amber-700">Isi Manual</span>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Nama Perusahaan *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className={hasBrandingAccess ? 'input bg-surface-light cursor-not-allowed' : 'input'}
                  placeholder="Nama perusahaan Anda"
                  required
                  readOnly={hasBrandingAccess}
                />
              </div>
              <div>
                <label className="input-label">Email *</label>
                <input
                  type="email"
                  value={formData.companyEmail}
                  onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                  className={hasBrandingAccess ? 'input bg-surface-light cursor-not-allowed' : 'input'}
                  placeholder="email@perusahaan.com"
                  required
                  readOnly={hasBrandingAccess}
                />
              </div>
              <div>
                <label className="input-label">Telepon</label>
                <input
                  type="tel"
                  value={formData.companyPhone}
                  onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                  className={hasBrandingAccess ? 'input bg-surface-light cursor-not-allowed' : 'input'}
                  placeholder="+62 812-3456-7890"
                  readOnly={hasBrandingAccess}
                />
              </div>
              <div className="md:col-span-2">
                <label className="input-label">Alamat</label>
                <input
                  type="text"
                  value={formData.companyAddress}
                  onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                  className={hasBrandingAccess ? 'input bg-surface-light cursor-not-allowed' : 'input'}
                  placeholder="Alamat lengkap"
                  readOnly={hasBrandingAccess}
                />
              </div>
            </div>

            {hasBrandingAccess ? (
              <div className="mt-4 p-4 rounded-xl bg-brand-50 border border-brand-200">
                <p className="text-sm text-brand-700">
                  Info perusahaan diambil dari pengaturan profil. Untuk mengubah, silakan ke{' '}
                  <a href="/dashboard/settings/branding" className="font-bold underline hover:text-brand-800">
                    Pengaturan Branding
                  </a>
                </p>
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-700">
                  <span className="font-semibold">Plan Free:</span> Isi info perusahaan secara manual setiap kali membuat invoice.{' '}
                  <a href="/checkout" className="font-bold underline hover:text-amber-800">
                    Upgrade ke Pro
                  </a>
                  {' '}untuk menyimpan profil perusahaan dan auto-fill di invoice selanjutnya.
                </p>
              </div>
            )}
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

            <div className="grid md:grid-cols-2 gap-4">
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
                <input
                  type="text"
                  value={formData.clientAddress}
                  onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                  className="input"
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
                      onClick={() => setShowItemCatalog(!showItemCatalog)}
                      className="flex items-center gap-2 px-4 py-2 text-text-secondary font-bold text-sm rounded-xl border border-gray-200 bg-surface-light hover:bg-gray-100 transition-colors"
                    >
                      <Package size={16} />
                      Pilih dari Katalog
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

            {/* Item Catalog Selector */}
            {showItemCatalog && (
              <div className="p-4 sm:p-6 bg-brand-50 border-b border-brand-200">
                <h3 className="text-lg font-bold text-text-primary mb-4">Pilih dari Katalog</h3>
                {catalogItems.length === 0 ? (
                  <p className="text-text-secondary">Belum ada item di katalog.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {catalogItems.map((catalogItem) => (
                      <button
                        key={catalogItem.id}
                        type="button"
                        onClick={() => handleAddFromCatalog(catalogItem)}
                        className="p-4 bg-white rounded-xl border border-gray-200 hover:border-brand-500 hover:shadow-md transition-all text-left"
                      >
                        <p className="font-bold text-text-primary mb-1">{catalogItem.name}</p>
                        {catalogItem.description && (
                          <p className="text-sm text-text-muted mb-2 line-clamp-2">{catalogItem.description}</p>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-brand-600 font-bold">{formatCurrency(catalogItem.price)}</span>
                          <span className="text-sm text-text-muted">/{catalogItem.unit}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                          type="text"
                          value={item.priceFormatted || ''}
                          onChange={(e) => {
                            const formatted = formatCurrencyInput(e.target.value)
                            updateItem(item.id, 'price', parseCurrencyInput(formatted), formatted)
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-text-primary text-right focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 transition-all text-sm"
                          placeholder="Rp 0"
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
                          className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                {templateSettings.showDiscount && discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon {formData.discountType === 'percentage' ? `(${formData.discountValue ?? 0}%)` : ''}</span>
                    <span className="font-semibold">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                {templateSettings.showAdditionalDiscount && additionalDiscountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon Tambahan {formData.additionalDiscountType === 'percentage' ? `(${formData.additionalDiscountValue}%)` : ''}</span>
                    <span className="font-semibold">-{formatCurrency(additionalDiscountAmount)}</span>
                  </div>
                )}
                {templateSettings.showTax && (
                  <div className="flex justify-between text-text-secondary">
                    <span>Pajak ({formData.taxRate ?? 0}%)</span>
                    <span className="font-semibold">{formatCurrency(taxAmount)}</span>
                  </div>
                )}
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
              {saving ? 'Menyimpan...' : 'Simpan Invoice'}
            </button>
          </div>
        </form>

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
                    onChange={(e) => setNewItemData({ ...newItemData, price: formatCurrencyInput(e.target.value) })}
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

export default function NewInvoicePage() {
  return (
    <Suspense fallback={
      <DashboardLayout title="Buat Invoice Baru">
        <div className="flex items-center justify-center py-20">
          <div className="text-center animate-fade-in">
            <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Memuat...</p>
          </div>
        </div>
      </DashboardLayout>
    }>
      <NewInvoicePageContent />
    </Suspense>
  )
}
