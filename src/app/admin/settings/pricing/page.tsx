'use client'

import { useState, useEffect } from 'react'
import {
  Save, Plus, Edit, Trash2, Tag, Check, X, Star, Loader2, CreditCard,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { cn } from '@/lib/utils'
import { FEATURE_DEFINITIONS } from '@/lib/pricing-features'

interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  price_monthly: number
  price_yearly: number
  yearly_discount_percent: number | null
  currency: string
  stripePriceId: string | null
  trialDays: number
  is_popular: boolean
  isActive: boolean
  sortOrder: number
  ctaText: string | null
  features_json: Record<string, boolean | number | null>
}

interface FormData {
  name: string
  slug: string
  description: string
  price_monthly: number
  price_yearly: number
  stripePriceId: string
  trialDays: number
  is_popular: boolean
  isActive: boolean
  sortOrder: number
  ctaText: string
  features: Record<string, boolean | number | null>
}

const initialFormData: FormData = {
  name: '',
  slug: '',
  description: '',
  price_monthly: 0,
  price_yearly: 0,
  stripePriceId: '',
  trialDays: 0,
  is_popular: false,
  isActive: true,
  sortOrder: 0,
  ctaText: '',
  features: {},
}

export default function AdminPricingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/pricing')
      if (res.ok) {
        const data = await res.json()
        setPlans(data.plans)
      }
    } catch {
      setError('Gagal memuat data pricing')
    } finally {
      setIsLoading(false)
    }
  }

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()

  const handleNameChange = (name: string) =>
    setFormData({ ...formData, name, slug: generateSlug(name) })

  const handleFeatureToggle = (key: string, enabled: boolean) => {
    setFormData({
      ...formData,
      features: { ...formData.features, [key]: enabled ? true : false },
    })
  }

  const handleFeatureValue = (key: string, value: number | null) => {
    setFormData({
      ...formData,
      features: { ...formData.features, [key]: value },
    })
  }

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      stripePriceId: plan.stripePriceId || '',
      trialDays: plan.trialDays,
      is_popular: plan.is_popular,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      ctaText: plan.ctaText || '',
      features: { ...(plan.features_json as Record<string, boolean | number | null>) },
    })
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const handleNew = () => {
    setEditingPlan(null)
    const defaultFeatures: Record<string, boolean | number | null> = {}
    FEATURE_DEFINITIONS.forEach(f => { defaultFeatures[f.key] = false })
    setFormData({ ...initialFormData, features: defaultFeatures, sortOrder: plans.length })
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingPlan(null)
    setFormData(initialFormData)
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const url = editingPlan ? `/api/admin/pricing/${editingPlan.id}` : '/api/admin/pricing'
      const method = editingPlan ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan paket')

      setSuccess(editingPlan ? 'Paket berhasil diupdate!' : 'Paket berhasil dibuat!')
      setShowForm(false)
      setEditingPlan(null)
      setFormData(initialFormData)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (planId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus paket ini?')) return

    try {
      const res = await fetch(`/api/admin/pricing/${planId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menghapus paket')
      }
      setSuccess('Paket berhasil dihapus!')
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

  // Auto-calculate yearly discount
  const yearlyDiscount = formData.price_monthly > 0 && formData.price_yearly > 0
    ? Math.round(((formData.price_monthly * 12 - formData.price_yearly) / (formData.price_monthly * 12)) * 100)
    : null

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Kelola Pricing</h1>
              <p className="text-text-secondary">Atur paket dan fitur subscription</p>
            </div>
          </div>
          <button onClick={handleNew} className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-sm font-semibold">
            <Plus className="w-4 h-4" />
            <span>Tambah Paket</span>
          </button>
        </div>

        {error && (
          <div className="card p-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-3 text-red-700"><X className="w-5 h-5" /><span>{error}</span></div>
          </div>
        )}
        {success && (
          <div className="card p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-3 text-green-700"><Check className="w-5 h-5" /><span>{success}</span></div>
          </div>
        )}

        {showForm && (
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">{editingPlan ? 'Edit Paket' : 'Tambah Paket Baru'}</h2>
                <p className="text-sm text-text-secondary">{editingPlan ? `Mengedit ${editingPlan.name}` : 'Buat paket subscription baru'}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Nama Paket *</label>
                  <input type="text" value={formData.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Contoh: Pro" className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Slug *</label>
                  <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="Contoh: pro" className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Harga Bulanan (IDR) *</label>
                  <input type="number" value={formData.price_monthly} onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })} placeholder="49000" className="input-field" min="0" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Harga Tahunan (IDR) *</label>
                  <input type="number" value={formData.price_yearly} onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) || 0 })} placeholder="490000" className="input-field" min="0" required />
                  {yearlyDiscount !== null && yearlyDiscount > 0 && (
                    <p className="text-xs text-success-600 mt-1">Diskon tahunan: {yearlyDiscount}%</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Masa Trial (Hari)</label>
                  <input type="number" value={formData.trialDays} onChange={(e) => setFormData({ ...formData, trialDays: parseInt(e.target.value) || 0 })} placeholder="7" className="input-field" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Teks Tombol CTA</label>
                  <input type="text" value={formData.ctaText} onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })} placeholder="Mulai Pro - Gratis 7 Hari" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Stripe Price ID</label>
                  <input type="text" value={formData.stripePriceId} onChange={(e) => setFormData({ ...formData, stripePriceId: e.target.value })} placeholder="price_xxxxx" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Deskripsi</label>
                  <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Untuk freelancer profesional" className="input-field" />
                </div>
                <div className="md:col-span-2 flex flex-wrap gap-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.is_popular} onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                    <span className="text-sm text-text-primary flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500" /> Tandai sebagai paket populer
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                    <span className="text-sm text-text-primary">Aktifkan paket</span>
                  </label>
                </div>
              </div>

              {/* Features Section */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-lg font-bold text-text-primary mb-4">Fitur Paket</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {FEATURE_DEFINITIONS.map((def) => {
                    const val = formData.features[def.key]
                    const isIncluded = val !== false && val !== null && val !== undefined

                    return (
                      <div
                        key={def.key}
                        className={cn(
                          'p-4 rounded-xl border-2 transition-all',
                          isIncluded ? 'border-brand-200 bg-brand-50' : 'border-gray-200 bg-gray-50'
                        )}
                      >
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isIncluded}
                            onChange={(e) => handleFeatureToggle(def.key, e.target.checked)}
                            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-text-primary">{def.name}</span>
                            <p className="text-xs text-text-muted mt-1">{def.description}</p>
                          </div>
                        </label>
                        {def.type === 'number' && isIncluded && (
                          <div className="mt-3 ml-7">
                            <label className="text-xs text-text-secondary">Limit value:</label>
                            <input
                              type="number"
                              value={typeof val === 'number' ? val : ''}
                              onChange={(e) => handleFeatureValue(def.key, e.target.value ? parseInt(e.target.value) : null)}
                              placeholder="Kosongkan untuk unlimited"
                              className="input-field mt-1 text-sm py-1.5"
                              min="1"
                            />
                            <p className="text-xs text-text-muted mt-1">Kosongkan untuk unlimited</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={handleCancel} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-text-secondary hover:bg-gray-50 transition-all text-sm font-semibold">
                  <X className="w-4 h-4" /><span>Batal</span>
                </button>
                <button type="submit" disabled={isSaving || !formData.name || !formData.slug} className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSaving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Menyimpan...</span></>
                  ) : (
                    <><Save className="w-4 h-4" /><span>{editingPlan ? 'Update Paket' : 'Simpan Paket'}</span></>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Plans List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const features = plan.features_json as Record<string, boolean | number | null>
            return (
              <div key={plan.id} className={cn('card p-6 relative', plan.is_popular && 'ring-2 ring-brand-200')}>
                {plan.is_popular && (
                  <div className="absolute -top-3 left-6">
                    <span className="px-3 py-1 bg-brand-500 text-white text-xs font-bold rounded-full">POPULER</span>
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-text-primary">{plan.name}</h3>
                    <p className="text-sm text-text-secondary">{plan.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(plan)} className="p-2 rounded-lg hover:bg-gray-100 text-text-secondary hover:text-brand-600 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(plan.id)} className="p-2 rounded-lg hover:bg-red-50 text-text-secondary hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-text-primary">{formatPrice(plan.price_monthly)}</span>
                  <span className="text-text-secondary text-sm"> /bulan</span>
                  {plan.price_yearly > 0 && (
                    <span className="ml-3 text-text-muted text-sm">{formatPrice(plan.price_yearly)} /tahun</span>
                  )}
                  {plan.yearly_discount_percent && (
                    <span className="ml-2 text-success-600 text-xs font-bold">-{plan.yearly_discount_percent}%</span>
                  )}
                </div>

                <div className="flex items-center gap-4 mb-4 text-sm">
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium', plan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>
                    {plan.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                  {plan.trialDays > 0 && <span className="text-text-muted">Trial {plan.trialDays} hari</span>}
                </div>

                <div className="space-y-2 border-t border-gray-100 pt-4">
                  {FEATURE_DEFINITIONS.map((def) => {
                    const val = features[def.key]
                    const isIncluded = val !== false && val !== null && val !== undefined
                    return (
                      <div key={def.key} className="flex items-center gap-2 text-sm">
                        {isIncluded ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-gray-300" />}
                        <span className={isIncluded ? 'text-text-primary' : 'text-text-muted'}>
                          {def.name}
                          {def.key === 'invoice_limit' && isIncluded && typeof val === 'number' && (
                            <span className="text-text-muted ml-1">({val}/bulan)</span>
                          )}
                          {def.key === 'invoice_limit' && isIncluded && val === true && (
                            <span className="text-text-muted ml-1">(unlimited)</span>
                          )}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {plans.length === 0 && (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Belum ada paket</h3>
            <p className="text-text-secondary mb-6">Buat paket subscription pertama Anda</p>
            <button onClick={handleNew} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-sm font-semibold">
              <Plus className="w-4 h-4" /><span>Tambah Paket</span>
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
