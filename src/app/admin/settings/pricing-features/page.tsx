'use client'

import { useState, useEffect } from 'react'
import {
  Save,
  Plus,
  Edit,
  Trash2,
  Tag,
  Check,
  X,
  Loader2,
  List,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { cn } from '@/lib/utils'

interface Feature {
  id: string
  name: string
  key: string
  description: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface FeatureFormData {
  name: string
  key: string
  description: string
  sortOrder: number
  isActive: boolean
}

const initialFormData: FeatureFormData = {
  name: '',
  key: '',
  description: '',
  sortOrder: 0,
  isActive: true,
}

export default function AdminPricingFeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null)
  const [formData, setFormData] = useState<FeatureFormData>(initialFormData)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchFeatures()
  }, [])

  const fetchFeatures = async () => {
    try {
      const res = await fetch('/api/admin/pricing-features')
      if (res.ok) {
        const data = await res.json()
        setFeatures(data.features)
      }
    } catch {
      setError('Gagal memuat data fitur')
    } finally {
      setIsLoading(false)
    }
  }

  const generateKey = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .replace(/-+/g, '_')
      .trim()
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      key: editingFeature ? formData.key : generateKey(name),
    })
  }

  const handleEdit = (feature: Feature) => {
    setEditingFeature(feature)
    setFormData({
      name: feature.name,
      key: feature.key,
      description: feature.description || '',
      sortOrder: feature.sortOrder,
      isActive: feature.isActive,
    })
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const handleNew = () => {
    setEditingFeature(null)
    setFormData({
      ...initialFormData,
      sortOrder: features.length,
    })
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingFeature(null)
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
      const url = editingFeature
        ? `/api/admin/pricing-features?id=${editingFeature.id}`
        : '/api/admin/pricing-features'
      const method = editingFeature ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan fitur')
      }

      setSuccess(editingFeature ? 'Fitur berhasil diupdate!' : 'Fitur berhasil dibuat!')
      setShowForm(false)
      setEditingFeature(null)
      setFormData(initialFormData)
      fetchFeatures()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (featureId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus fitur ini? Fitur ini juga akan dihapus dari semua paket.')) return

    try {
      const res = await fetch(`/api/admin/pricing-features?id=${featureId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menghapus fitur')
      }

      setSuccess('Fitur berhasil dihapus!')
      fetchFeatures()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const handleToggleActive = async (feature: Feature) => {
    try {
      const res = await fetch(`/api/admin/pricing-features?id=${feature.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: feature.name,
          key: feature.key,
          description: feature.description,
          sortOrder: feature.sortOrder,
          isActive: !feature.isActive,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal mengubah status')
      }

      fetchFeatures()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

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
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
              <List className="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Kelola Fitur Pricing</h1>
              <p className="text-text-secondary">Atur fitur yang tersedia untuk paket subscription</p>
            </div>
          </div>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Fitur</span>
          </button>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="card p-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-3 text-red-700">
              <X className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="card p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-3 text-green-700">
              <Check className="w-5 h-5" />
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">
                  {editingFeature ? 'Edit Fitur' : 'Tambah Fitur Baru'}
                </h2>
                <p className="text-sm text-text-secondary">
                  {editingFeature ? `Mengedit ${editingFeature.name}` : 'Buat fitur pricing baru'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Feature Name */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Nama Fitur *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Contoh: Batas Invoice"
                    className="input-field"
                    required
                  />
                </div>

                {/* Key */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Key *
                  </label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    placeholder="Contoh: invoice_limit"
                    className="input-field"
                    required
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Identifier unik untuk fitur (huruf kecil, angka, underscore)
                  </p>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="input-field"
                    min="0"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Semakin kecil semakin awal
                  </p>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Deskripsi
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi singkat fitur ini"
                    className="input-field"
                  />
                </div>

                {/* Active Checkbox */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-text-primary">Fitur aktif</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-text-secondary hover:bg-gray-50 transition-all text-sm font-semibold"
                >
                  <X className="w-4 h-4" />
                  <span>Batal</span>
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !formData.name || !formData.key}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingFeature ? 'Update Fitur' : 'Simpan Fitur'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Features List */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Urutan</th>
                <th className="table-header">Nama Fitur</th>
                <th className="table-header">Key</th>
                <th className="table-header">Deskripsi</th>
                <th className="table-header">Status</th>
                <th className="table-header">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {features.map((feature) => (
                <tr key={feature.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell text-sm">
                    {feature.sortOrder}
                  </td>
                  <td className="table-cell">
                    <span className="font-medium text-text-primary">{feature.name}</span>
                  </td>
                  <td className="table-cell">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-text-muted">
                      {feature.key}
                    </code>
                  </td>
                  <td className="table-cell text-sm text-text-secondary">
                    {feature.description || '-'}
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => handleToggleActive(feature)}
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium transition-colors',
                        feature.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {feature.isActive ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(feature)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-text-secondary hover:text-brand-600 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(feature.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-text-secondary hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {features.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <List className="w-8 h-8 text-text-muted" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">
                Belum ada fitur
              </h3>
              <p className="text-text-secondary mb-6">
                Buat fitur pricing pertama Anda
              </p>
              <button
                onClick={handleNew}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Fitur</span>
              </button>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="card p-6 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">Tips Mengelola Fitur</h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• Fitur dengan key <code>invoice_limit</code> akan menampilkan batas invoice per bulan</li>
            <li>• Urutan tampil mempengaruhi posisi fitur di halaman pricing</li>
            <li>• Fitur yang dinonaktifkan tidak akan tampil di halaman pricing publik</li>
            <li>• Menghapus fitur akan menghapusnya dari semua paket yang terkait</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  )
}
