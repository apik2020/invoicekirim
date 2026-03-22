'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSession } from '@/hooks/useAppSession'
import { DashboardLayout } from '@/components/DashboardLayout'
import { MessageBox } from '@/components/ui/MessageBox'
import { useMessageBox } from '@/hooks/useMessageBox'
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  X,
  Check,
  Tag,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

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

interface Item {
  id: string
  name: string
  description: string | null
  sku: string | null
  unit: string
  price: number
  taxRate: number
  category: string | null
  createdAt: string
}

export default function ItemsPage() {
  const router = useRouter()
  const { data: session } = useAppSession()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const messageBox = useMessageBox()

  // Get unique categories
  const categories = Array.from(
    new Set(items.map((item) => item.category).filter(Boolean))
  ) as string[]

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    unit: 'pcs',
    price: '',
    taxRate: '11',
    category: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items')
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Failed to fetch items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = editingItem
        ? `/api/items/${editingItem.id}`
        : '/api/items'

      const method = editingItem ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseCurrencyInput(formData.price),
          taxRate: parseFloat(formData.taxRate),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        fetchItems()
        handleCloseModal()
        messageBox.showSuccess({
          title: editingItem ? 'Item Diperbarui!' : 'Item Ditambahkan!',
          message: `${formData.name} berhasil ${editingItem ? 'diperbarui' : 'ditambahkan'} ke katalog.`,
        })
      } else {
        messageBox.showWarning({
          title: 'Gagal Menyimpan',
          message: data.error || 'Gagal menyimpan item. Silakan coba lagi.',
          confirmText: 'Mengerti',
          onConfirm: () => messageBox.close(),
        })
      }
    } catch (error) {
      messageBox.showWarning({
        title: 'Terjadi Kesalahan',
        message: 'Terjadi kesalahan saat menyimpan item.',
        confirmText: 'Mengerti',
        onConfirm: () => messageBox.close(),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (item: Item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      sku: item.sku || '',
      unit: item.unit,
      price: formatCurrencyInput(item.price.toString()),
      taxRate: item.taxRate.toString(),
      category: item.category || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (item: Item) => {
    messageBox.showDelete({
      title: 'Hapus Item?',
      message: (
        <div className="space-y-2">
          <p>
            Anda akan menghapus item <span className="font-semibold text-brand-500">{item.name}</span>
          </p>
          <p className="text-xs text-text-muted">
            Item yang dihapus tidak dapat dikembalikan.
          </p>
        </div>
      ),
      confirmText: 'Ya, Hapus',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/items/${item.id}`, {
            method: 'DELETE',
          })

          const data = await res.json()

          if (res.ok) {
            fetchItems()
          } else {
            messageBox.showWarning({
              title: 'Gagal Menghapus',
              message: data.error || 'Gagal menghapus item.',
              confirmText: 'Mengerti',
              onConfirm: () => messageBox.close(),
            })
          }
        } catch (error) {
          messageBox.showWarning({
            title: 'Terjadi Kesalahan',
            message: 'Terjadi kesalahan saat menghapus item.',
            confirmText: 'Mengerti',
            onConfirm: () => messageBox.close(),
          })
        }
      },
    })
  }

  const handleOpenModal = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      description: '',
      sku: '',
      unit: 'pcs',
      price: '',
      taxRate: '11',
      category: '',
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setFormData({
      name: '',
      description: '',
      sku: '',
      unit: 'pcs',
      price: '',
      taxRate: '11',
      category: '',
    })
  }

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  ).filter(
    (item) => !selectedCategory || item.category === selectedCategory
  )

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Memuat item...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-brand-500 mb-2">Katalog Item</h1>
            <p className="text-text-secondary">
              Kelola katalog produk/jasa untuk invoice
            </p>
          </div>
          <button
            onClick={handleOpenModal}
            className="btn-primary px-6 py-3 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Item</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari item..."
                className="input pl-12"
              />
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="select sm:w-48"
              >
                <option value="">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      {filteredItems.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-24 h-24 rounded-2xl icon-box-secondary mx-auto mb-6">
            <Package className="w-12 h-12 text-secondary-600" />
          </div>
          <h3 className="text-xl font-bold text-brand-500 mb-2">
            {searchQuery || selectedCategory ? 'Tidak ada item ditemukan' : 'Belum ada item'}
          </h3>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            {searchQuery || selectedCategory
              ? 'Coba kata kunci atau kategori lain'
              : 'Tambahkan item untuk katalog produk/jasa Anda'}
          </p>
          {!searchQuery && !selectedCategory && (
            <button
              onClick={handleOpenModal}
              className="btn-primary px-6 py-3 inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Tambah Item Pertama</span>
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-light">
                <tr>
                  <th className="table-header">Nama Item</th>
                  <th className="table-header">SKU</th>
                  <th className="table-header">Kategori</th>
                  <th className="table-header">Satuan</th>
                  <th className="table-header">Harga</th>
                  <th className="table-header">Pajak</th>
                  <th className="table-header text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center">
                          <Package className="w-5 h-5 text-secondary-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-text-muted max-w-xs truncate">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-text-secondary rounded-lg">
                        {item.sku || '-'}
                      </span>
                    </td>
                    <td className="table-cell">
                      {item.category ? (
                        <span className="badge-brand">
                          <Tag className="w-3 h-3" />
                          {item.category}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="table-cell text-text-secondary">
                      {item.unit}
                    </td>
                    <td className="table-cell font-bold text-text-primary">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="table-cell text-text-secondary">
                      {item.taxRate}%
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-brand-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-brand-500">
                {editingItem ? 'Edit Item' : 'Tambah Item Baru'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="absolute top-5 right-6 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="input-label">Nama Item *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="Nama produk/jasa"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="input-label">Deskripsi</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="textarea"
                    placeholder="Deskripsi item"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* SKU */}
                  <div>
                    <label className="input-label">SKU</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="input"
                      placeholder="Kode barang"
                    />
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="input-label">Satuan *</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
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
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                    placeholder="Contoh: Jasa, Produk, dll"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Price */}
                  <div>
                    <label className="input-label">Harga *</label>
                    <input
                      type="text"
                      value={formData.price}
                      onChange={(e) => {
                        const formatted = formatCurrencyInput(e.target.value)
                        setFormData({ ...formData, price: formatted })
                      }}
                      className="input"
                      placeholder="Rp 0"
                      required
                    />
                  </div>

                  {/* Tax Rate */}
                  <div>
                    <label className="input-label">Pajak (%)</label>
                    <input
                      type="number"
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                      className="input"
                      placeholder="11"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 btn-secondary px-6 py-3"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 btn-primary px-6 py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        <span>{editingItem ? 'Simpan Perubahan' : 'Tambah Item'}</span>
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
