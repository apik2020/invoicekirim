'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FileText, Save, Plus, Trash2, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import DashboardHeader from '@/components/DashboardHeader'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface TemplateItem {
  id: string
  description: string
  quantity: number
  price: number
}

export default function EditTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const { id } = use(params as Promise<{ id: string }>)
  const sessionResult = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    notes: '',
    taxRate: 11,
  })

  const [items, setItems] = useState<TemplateItem[]>([
    { id: '1', description: '', quantity: 1, price: 0 }
  ])

  useEffect(() => {
    setMounted(true)

    if (!sessionResult || sessionResult.status === 'unauthenticated') {
      router.push('/login')
    } else if (sessionResult.status === 'authenticated' && id) {
      fetchTemplate()
    }
  }, [sessionResult, id, router])

  const fetchTemplate = async () => {
    try {
      const res = await fetch(`/api/templates/${id}`)
      if (!res.ok) {
        if (res.status === 404) {
          setNotFound(true)
        }
        throw new Error('Gagal mengambil template')
      }

      const data = await res.json()

      // Populate form data
      setFormData({
        name: data.name || '',
        description: data.description || '',
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
      console.error('Error fetching template:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name) {
      alert('Mohon isi nama template')
      return
    }

    if (items.some((item) => !item.description || item.price < 0)) {
      alert('Mohon lengkapi semua item dengan benar')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal mengupdate template')
      }

      router.push('/dashboard/templates')
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

  if (!mounted || loading || !sessionResult || sessionResult.status === 'loading') {
    return (
      <div className="min-h-screen bg-gray flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-dark animate-spin mx-auto mb-4" />
          <p className="text-slate">Memuat template...</p>
        </div>
      </div>
    )
  }

  if (sessionResult.status === 'unauthenticated') {
    return null
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray flex items-center justify-center">
        <div className="card p-16 text-center max-w-md">
          <div className="w-24 h-24 rounded-2xl icon-box flex items-center justify-center mx-auto mb-6">
            <FileText className="w-12 h-12 text-slate" />
          </div>
          <h3 className="text-2xl font-bold text-dark mb-3">
            Template Tidak Ditemukan
          </h3>
          <p className="text-slate mb-8">
            Template yang Anda cari tidak ada atau telah dihapus
          </p>
          <button
            onClick={() => router.push('/dashboard/templates')}
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl btn-primary"
          >
            Kembali ke Daftar Template
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray">
      <DashboardHeader
        title="Edit Template"
        showBackButton={true}
        backHref="/dashboard/templates"
      />

      {/* Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          {/* Template Info */}
          <div className="card p-8">
            <h2 className="text-lg font-bold text-dark mb-6">Informasi Template</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-dark mb-2">
                  Nama Template *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  placeholder="Contoh: Jasa Web Design"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-dark mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  rows={2}
                  placeholder="Deskripsi singkat tentang template ini..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-dark mb-2">
                  Tarif Pajak Default (%)
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

          {/* Items */}
          <div className="card p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-dark">Item Template</h2>
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
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="card p-8">
            <h2 className="text-lg font-bold text-dark mb-4">Catatan Default</h2>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
              rows={3}
              placeholder="Catatan default yang akan muncul di invoice..."
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
              <div className="flex justify-between py-4 border-t-2 border-dark text-2xl font-extrabold text-dark">
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
      </div>
    </div>
  )
}
