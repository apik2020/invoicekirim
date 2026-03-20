'use client'

import { useState, useEffect } from 'react'
import { X, Save, Loader2, Megaphone } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  message: string
  type: string
  targetType: string
  targetUsers?: string[] | null
  displayType: string
  isDismissible: boolean
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
}

interface AnnouncementModalProps {
  announcement?: Announcement | null
  onClose: () => void
  onSave: () => void
}

export function AnnouncementModal({ announcement, onClose, onSave }: AnnouncementModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    targetType: 'all',
    targetUsers: [] as string[],
    displayType: 'banner',
    isDismissible: true,
    isActive: true,
    startsAt: '',
    endsAt: '',
  })

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title,
        message: announcement.message,
        type: announcement.type,
        targetType: announcement.targetType,
        targetUsers: (announcement.targetUsers as string[]) || [],
        displayType: announcement.displayType,
        isDismissible: announcement.isDismissible,
        isActive: announcement.isActive,
        startsAt: announcement.startsAt ? new Date(announcement.startsAt).toISOString().slice(0, 16) : '',
        endsAt: announcement.endsAt ? new Date(announcement.endsAt).toISOString().slice(0, 16) : '',
      })
    }
  }, [announcement])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = announcement
        ? `/api/admin/announcements/${announcement.id}`
        : '/api/admin/announcements'
      const method = announcement ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        onSave()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error saving announcement:', error)
      alert('Terjadi kesalahan saat menyimpan pengumuman')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-brand-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {announcement ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judul <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-brand-500 focus:outline-none"
              placeholder="Judul pengumuman"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pesan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-brand-500 focus:outline-none min-h-[100px]"
              placeholder="Isi pesan pengumuman..."
              required
            />
          </div>

          {/* Type & Display Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipe
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-brand-500 focus:outline-none"
              >
                <option value="info">Info (Biru)</option>
                <option value="success">Success (Hijau)</option>
                <option value="warning">Warning (Kuning)</option>
                <option value="error">Error (Merah)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tampilan
              </label>
              <select
                value={formData.displayType}
                onChange={(e) => setFormData({ ...formData, displayType: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-brand-500 focus:outline-none"
              >
                <option value="banner">Banner</option>
                <option value="modal">Modal</option>
                <option value="toast">Toast</option>
              </select>
            </div>
          </div>

          {/* Target Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Audiens
            </label>
            <select
              value={formData.targetType}
              onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-brand-500 focus:outline-none"
            >
              <option value="all">Semua Pengguna</option>
              <option value="free">Pengguna FREE</option>
              <option value="pro">Pengguna PRO</option>
              <option value="specific">Pengguna Tertentu</option>
            </select>
          </div>

          {/* Valid From & Until */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mulai Dari
              </label>
              <input
                type="datetime-local"
                value={formData.startsAt}
                onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Berakhir Pada
              </label>
              <input
                type="datetime-local"
                value={formData.endsAt}
                onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isDismissible"
                checked={formData.isDismissible}
                onChange={(e) => setFormData({ ...formData, isDismissible: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <label htmlFor="isDismissible" className="text-sm text-gray-700">
                Pengguna bisa menutup pengumuman ini
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Pengumuman aktif
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
