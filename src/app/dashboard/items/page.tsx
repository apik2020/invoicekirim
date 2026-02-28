'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import DashboardHeader from '@/components/DashboardHeader'
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
  const { data: session } = useSession()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')

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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
    setMessage(null)

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
        setMessage({
          type: 'success',
          text: editingItem ? 'Item berhasil diperbarui!' : 'Item berhasil ditambahkan!',
        })
        fetchItems()

        // Close modal after a short delay
        setTimeout(() => {
          handleCloseModal()
        }, 1500)
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal menyimpan item' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus item "${name}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({
          type: 'success',
          text: 'Item berhasil dihapus!',
        })
        fetchItems()
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal menghapus item' })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
      setTimeout(() => setMessage(null), 3000)
    }
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
    setMessage(null)
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
    setMessage(null)
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
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gray-900 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat item...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-fresh-bg">
      <DashboardHeader
        title="Katalog Item"
        showBackButton={true}
        backHref="/dashboard"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-lime-50 border border-lime-200 text-lime-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-5 h-5 flex-shrink-0" />
            ) : (
              <X className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Katalog Item</h1>
            <p className="text-gray-600">
              Kelola katalog produk/jasa untuk invoice
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari item..."
                className="w-full sm:w-64 pl-12 pr-4 py-3 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 rounded-xl border border-orange-200 text-gray-900 focus:border-orange-500 focus:outline-none transition-colors"
              >
                <option value="">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            {/* Add Item Button */}
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 transition-all shadow-lg shadow-orange-500/30"
            >
              <Plus className="w-5 h-5" />
              <span>Tambah Item</span>
            </button>
          </div>
        </div>

        {/* Items Table */}
        <div className="card overflow-hidden">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                {searchQuery || selectedCategory ? 'Tidak ada item ditemukan' : 'Belum ada item'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || selectedCategory
                  ? 'Coba kata kunci atau kategori lain'
                  : 'Tambahkan item untuk katalog produk/jasa Anda'}
              </p>
              {!searchQuery && !selectedCategory && (
                <button
                  onClick={handleOpenModal}
                  className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 transition-all shadow-lg shadow-orange-500/30"
                >
                  <Plus className="w-5 h-5" />
                  <span>Tambah Item Pertama</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-orange-200">
                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                      Nama Item
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                      SKU
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                      Kategori
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                      Satuan
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                      Harga
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                      Pajak
                    </th>
                    <th className="text-right py-4 px-6 text-sm font-bold text-gray-700">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-b border-orange-100 hover:bg-orange-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-gray-500 max-w-xs truncate">{item.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg">
                          {item.sku || '-'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {item.category ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-lg">
                            <Tag className="w-3 h-3" />
                            {item.category}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {item.unit}
                      </td>
                      <td className="py-4 px-6 font-semibold text-gray-900">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {item.taxRate}%
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingItem ? 'Edit Item' : 'Tambah Item Baru'}
              </h2>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-6">
              {message && (
                <div
                  className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                    message.type === 'success'
                      ? 'bg-lime-50 border border-lime-200 text-lime-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  {message.type === 'success' ? (
                    <Check className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <X className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span className="font-medium text-sm">{message.text}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Nama Item *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors resize-none"
                    placeholder="Deskripsi item"
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
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
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
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
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
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="Contoh: Jasa, Produk, dll"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Price */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Harga *
                    </label>
                    <input
                      type="text"
                      value={formData.price}
                      onChange={(e) => {
                        const formatted = formatCurrencyInput(e.target.value)
                        setFormData({ ...formData, price: formatted })
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                      placeholder="Rp 0"
                      required
                    />
                  </div>

                  {/* Tax Rate */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Pajak (%)
                    </label>
                    <input
                      type="number"
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
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
                    className="flex-1 px-6 py-3 text-gray-700 font-bold rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 text-white font-bold rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/30"
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

            {/* Modal Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
