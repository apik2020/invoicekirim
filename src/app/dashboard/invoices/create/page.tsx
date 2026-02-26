'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FileText, Save, Plus, Trash2, Loader2 } from 'lucide-react'
import { generateInvoiceNumber } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import DashboardHeader from '@/components/DashboardHeader'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  price: number
}

export default function NewInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionResult = useSession()
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [loadingTemplate, setLoadingTemplate] = useState(false)

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
    { id: '1', description: '', quantity: 1, price: 0 }
  ])

  // Handle mount and authentication
  useEffect(() => {
    setMounted(true)

    if (sessionResult.status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (sessionResult.data?.user?.email && !formData.companyEmail) {
      setFormData(prev => ({ ...prev, companyEmail: sessionResult.data!.user!.email || '' }))
    }

    // Load template if templateId is provided
    if (templateId && sessionResult.status === 'authenticated') {
      loadTemplate(templateId)
    }
  }, [sessionResult, formData.companyEmail, router, templateId])

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
      <div className="min-h-screen bg-gray flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-dark animate-spin mx-auto mb-4" />
          <p className="text-slate">
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
      { id: Date.now().toString(), description: '', quantity: 1, price: 0 }
    ])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
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

  return (
    <div className="min-h-screen bg-gray">
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
            <h2 className="text-lg font-bold text-dark mb-6">Informasi Invoice</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-dark mb-2">
                  Nomor Invoice *
                </label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  placeholder="INV-001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-dark mb-2">
                  Tanggal *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-dark mb-2">
                  Jatuh Tempo
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-dark mb-2">
                  Tarif Pajak (%)
                </label>
                <input
                  type="number"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
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
            <h2 className="text-lg font-bold text-dark mb-6">Dari (Info Perusahaan)</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-dark mb-2">
                  Nama Perusahaan *
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  placeholder="Nama perusahaan Anda"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-dark mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.companyEmail}
                  onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  placeholder="email@perusahaan.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-dark mb-2">
                  Telepon
                </label>
                <input
                  type="tel"
                  value={formData.companyPhone}
                  onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  placeholder="+62 812-3456-7890"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-dark mb-2">
                  Alamat
                </label>
                <input
                  type="text"
                  value={formData.companyAddress}
                  onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  placeholder="Alamat lengkap"
                />
              </div>
            </div>
          </div>

          {/* Kepada (Client Info) */}
          <div className="card p-8">
            <h2 className="text-lg font-bold text-dark mb-6">Kepada (Info Klien)</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-dark mb-2">
                  Nama Klien *
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  placeholder="Nama klien"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-dark mb-2">
                  Email Klien *
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  placeholder="client@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-dark mb-2">
                  Telepon
                </label>
                <input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  placeholder="+62 812-3456-7890"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-dark mb-2">
                  Alamat
                </label>
                <input
                  type="text"
                  value={formData.clientAddress}
                  onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  placeholder="Alamat klien"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="card p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-dark">Item Invoice</h2>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 text-white font-bold text-sm rounded-xl btn-primary"
              >
                <Plus size={16} />
                Tambah Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="p-6 rounded-xl bg-gray border border-slate space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-dark">Item #{index + 1}</span>
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
                      <label className="block text-sm font-bold text-dark mb-2">
                        Deskripsi *
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate focus:border-dark focus:outline-none transition-colors"
                        placeholder="Jasa/Barang"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-dark mb-2">
                        Jumlah *
                      </label>
                      <input
                        type="number"
                        value={item.quantity || 1}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate focus:border-dark focus:outline-none transition-colors"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-dark mb-2">
                        Harga (Rp) *
                      </label>
                      <input
                        type="number"
                        value={item.price || 0}
                        onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate focus:border-dark focus:outline-none transition-colors"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <span className="font-bold text-dark text-right">
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
            <h2 className="text-lg font-bold text-dark mb-4">Catatan</h2>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
              rows={3}
              placeholder="Catatan tambahan untuk invoice..."
            />
          </div>

          {/* Totals & Submit */}
          <div className="card p-8">
            <div className="space-y-3 mb-8">
              <div className="flex justify-between text-slate">
                <span>Subtotal</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate">
                <span>Pajak ({formData.taxRate}%)</span>
                <span className="font-semibold">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between py-4 border-t-2 border-dark text-dark text-2xl font-bold">
                <span>Total</span>
                <span className="text-dark">{formatCurrency(total)}</span>
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
