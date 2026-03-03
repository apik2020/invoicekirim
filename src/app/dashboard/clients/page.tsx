'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import DashboardHeader from '@/components/DashboardHeader'
import { MessageBox } from '@/components/ui/MessageBox'
import { useMessageBox } from '@/hooks/useMessageBox'
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Building2,
  MapPin,
  Loader2,
  Search,
  X,
  Check,
} from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string
  phone?: string | null
  address?: string | null
  company?: string | null
  createdAt: string
}

export default function ClientsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const messageBox = useMessageBox()

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients')

      if (!res.ok) {
        console.error('Failed to fetch clients:', res.status)
        setClients([])
        return
      }

      const data = await res.json()

      // Ensure data is an array
      if (Array.isArray(data)) {
        setClients(data)
      } else {
        console.error('Invalid data format:', data)
        setClients([])
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = editingClient
        ? `/api/clients/${editingClient.id}`
        : '/api/clients'

      const method = editingClient ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        fetchClients()
        handleCloseModal()

        // Show success message
        if (editingClient) {
          messageBox.showSuccess({
            title: 'Klien Diperbarui!',
            message: `Data klien ${formData.name} berhasil diperbarui.`,
          })
        } else {
          messageBox.showClientCreated(formData.name, formData.email)
        }
      } else {
        messageBox.showWarning({
          title: 'Gagal Menyimpan',
          message: data.error || 'Gagal menyimpan klien. Silakan coba lagi.',
          confirmText: 'Mengerti',
          onConfirm: () => messageBox.close(),
        })
      }
    } catch (error) {
      messageBox.showWarning({
        title: 'Terjadi Kesalahan',
        message: 'Terjadi kesalahan saat menyimpan data. Silakan coba lagi.',
        confirmText: 'Mengerti',
        onConfirm: () => messageBox.close(),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      address: client.address || '',
      company: client.company || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (client: Client) => {
    messageBox.showDelete({
      title: 'Hapus Klien?',
      message: (
        <div className="space-y-2">
          <p>
            Anda akan menghapus klien <span className="font-semibold text-gray-900">{client.name}</span>
          </p>
          <p className="text-xs text-gray-500">
            Data klien yang dihapus tidak dapat dikembalikan.
          </p>
        </div>
      ),
      confirmText: 'Ya, Hapus',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/clients/${client.id}`, {
            method: 'DELETE',
          })

          const data = await res.json()

          if (res.ok) {
            fetchClients()
          } else {
            messageBox.showWarning({
              title: 'Gagal Menghapus',
              message: data.error || 'Gagal menghapus klien.',
              confirmText: 'Mengerti',
              onConfirm: () => messageBox.close(),
            })
          }
        } catch (error) {
          messageBox.showWarning({
            title: 'Terjadi Kesalahan',
            message: 'Terjadi kesalahan saat menghapus klien.',
            confirmText: 'Mengerti',
            onConfirm: () => messageBox.close(),
          })
        }
      },
    })
  }

  const handleOpenModal = () => {
    setEditingClient(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      company: '',
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingClient(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      company: '',
    })
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gray-900 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat klien...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-fresh-bg">
      <DashboardHeader
        title="Klien"
        showBackButton={true}
        backHref="/dashboard"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Daftar Klien</h1>
            <p className="text-gray-600">
              Kelola data klien untuk mempermudah pembuatan invoice
            </p>
          </div>

          {/* Search and Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari klien..."
                className="w-full sm:w-64 pl-12 pr-4 py-3 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Add Client Button */}
            <button
              onClick={handleOpenModal}
              className="flex items-center justify-center gap-2 px-6 py-3 text-white font-bold rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 transition-all shadow-lg shadow-orange-500/30"
            >
              <Plus className="w-5 h-5" />
              <span>Tambah Klien</span>
            </button>
          </div>
        </div>

        {/* Clients Table */}
        <div className="card overflow-hidden">
          {filteredClients.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                {searchQuery ? 'Tidak ada klien ditemukan' : 'Belum ada klien'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery
                  ? 'Coba kata kunci lain'
                  : 'Tambahkan klien untuk memulai membuat invoice'}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleOpenModal}
                  className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 transition-all shadow-lg shadow-orange-500/30"
                >
                  <Plus className="w-5 h-5" />
                  <span>Tambah Klien Pertama</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-orange-200">
                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                      Nama Klien
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                      Perusahaan
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                      Email
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                      Telepon
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                      Alamat
                    </th>
                    <th className="text-right py-4 px-6 text-sm font-bold text-gray-700">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-orange-100 hover:bg-orange-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-semibold text-gray-900">{client.name}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-gray-600">{client.company || '-'}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-gray-600">{client.email}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-gray-600">{client.phone || '-'}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-gray-600 max-w-xs truncate">{client.address || '-'}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(client)}
                            className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(client)}
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
                {editingClient ? 'Edit Klien' : 'Tambah Klien Baru'}
              </h2>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Nama Klien *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
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
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-orange-200 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors resize-none"
                    placeholder="Alamat lengkap klien"
                  />
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
                        <span>{editingClient ? 'Simpan Perubahan' : 'Tambah Klien'}</span>
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
