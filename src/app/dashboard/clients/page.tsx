'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSession } from '@/hooks/useAppSession'
import { DashboardLayout } from '@/components/DashboardLayout'
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
  User,
  Globe,
  FileText,
} from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string
  phone?: string | null
  address?: string | null
  company?: string | null
  taxId?: string | null
  website?: string | null
  createdAt: string
}

export default function ClientsPage() {
  const router = useRouter()
  const { data: session } = useAppSession()
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
    taxId: '',
    website: '',
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
      taxId: client.taxId || '',
      website: client.website || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (client: Client) => {
    messageBox.showDelete({
      title: 'Hapus Klien?',
      message: (
        <div className="space-y-2">
          <p>
            Anda akan menghapus klien <span className="font-semibold text-brand-500">{client.name}</span>
          </p>
          <p className="text-xs text-text-muted">
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
      taxId: '',
      website: '',
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
      taxId: '',
      website: '',
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
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Memuat klien...</p>
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
            <h1 className="text-2xl md:text-3xl font-bold text-brand-500 mb-2">Daftar Klien</h1>
            <p className="text-text-secondary">
              Kelola data klien untuk mempermudah pembuatan invoice
            </p>
          </div>
          <button
            onClick={handleOpenModal}
            className="btn-primary px-6 py-3 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Klien</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="card p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari klien..."
              className="input pl-12"
            />
          </div>
        </div>
      </div>

      {/* Clients Table */}
      {filteredClients.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-24 h-24 rounded-2xl icon-box-brand mx-auto mb-6">
            <Users className="w-12 h-12 text-brand-500" />
          </div>
          <h3 className="text-xl font-bold text-brand-500 mb-2">
            {searchQuery ? 'Tidak ada klien ditemukan' : 'Belum ada klien'}
          </h3>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            {searchQuery
              ? 'Coba kata kunci lain'
              : 'Tambahkan klien untuk memulai membuat invoice'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleOpenModal}
              className="btn-primary px-6 py-3 inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Tambah Klien Pertama</span>
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-light">
                <tr>
                  <th className="table-header">Nama Klien</th>
                  <th className="table-header">Perusahaan</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Telepon</th>
                  <th className="table-header">Alamat</th>
                  <th className="table-header text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-brand-500" />
                        </div>
                        <span className="font-semibold text-text-primary">{client.name}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        {client.company && <Building2 className="w-4 h-4 text-text-muted" />}
                        <span>{client.company || '-'}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-text-muted" />
                        <span>{client.email}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        {client.phone && <Phone className="w-4 h-4 text-text-muted" />}
                        <span>{client.phone || '-'}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2 max-w-xs">
                        {client.address && <MapPin className="w-4 h-4 text-text-muted flex-shrink-0" />}
                        <span className="truncate">{client.address || '-'}</span>
                      </div>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(client)}
                          className="p-2 text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client)}
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
                {editingClient ? 'Edit Klien' : 'Tambah Klien Baru'}
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
                  <label className="input-label">Nama Klien *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-text-muted" />
                    </div>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input pl-12"
                      placeholder="Nama lengkap klien"
                      required
                    />
                  </div>
                </div>

                {/* Company */}
                <div>
                  <label className="input-label">Perusahaan</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Building2 className="w-5 h-5 text-text-muted" />
                    </div>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="input pl-12"
                      placeholder="Nama perusahaan klien"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="input-label">Email *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-text-muted" />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input pl-12"
                      placeholder="email@klien.com"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="input-label">Telepon</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="w-5 h-5 text-text-muted" />
                    </div>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input pl-12"
                      placeholder="+62 812 3456 7890"
                    />
                  </div>
                </div>

                {/* Tax ID (NPWP) */}
                <div>
                  <label className="input-label">NPWP / Tax ID</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FileText className="w-5 h-5 text-text-muted" />
                    </div>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      className="input pl-12"
                      placeholder="00.000.000.0-000.000"
                    />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label className="input-label">Website</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Globe className="w-5 h-5 text-text-muted" />
                    </div>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="input pl-12"
                      placeholder="https://www.website.com"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="input-label">Alamat</label>
                  <div className="relative">
                    <div className="absolute top-4 left-4 pointer-events-none">
                      <MapPin className="w-5 h-5 text-text-muted" />
                    </div>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="textarea pl-12"
                      placeholder="Alamat lengkap klien"
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
                        <span>{editingClient ? 'Simpan Perubahan' : 'Tambah Klien'}</span>
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
