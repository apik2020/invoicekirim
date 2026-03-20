'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AnnouncementTable } from '@/components/admin/AnnouncementTable'
import { AnnouncementModal } from '@/components/admin/AnnouncementModal'

interface Announcement {
  id: string
  title: string
  message: string
  type: string
  targetType: string
  displayType: string
  isDismissible: boolean
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  createdAt: string
  _count: {
    announcement_reads: number
  }
}

export default function AdminAnnouncementsPage() {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleAnnouncementDelete = async (announcement: Announcement) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pengumuman "${announcement.title}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/announcements/${announcement.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        alert('Pengumuman berhasil dihapus')
        setRefreshKey((k) => k + 1)
      } else {
        const data = await res.json()
        alert(`Gagal menghapus pengumuman: ${data.error}`)
      }
    } catch (error) {
      console.error('Error deleting announcement:', error)
      alert('Terjadi kesalahan saat menghapus pengumuman')
    }
  }

  const handleSave = () => {
    setShowCreateModal(false)
    setEditingAnnouncement(null)
    setRefreshKey((k) => k + 1)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Pengumuman & Broadcast</h1>
          <p className="text-text-secondary">Kirim pengumuman ke semua pengguna atau segmen tertentu</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <p className="text-sm opacity-80">Total Pengumuman</p>
            <p className="text-2xl font-bold">-</p>
          </div>
          <div className="card p-4 bg-gradient-to-br from-lime-500 to-lime-600 text-white">
            <p className="text-sm opacity-80">Pengumuman Aktif</p>
            <p className="text-2xl font-bold">-</p>
          </div>
          <div className="card p-4 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
            <p className="text-sm opacity-80">Total Views</p>
            <p className="text-2xl font-bold">-</p>
          </div>
        </div>

        {/* Announcement Table */}
        <AnnouncementTable
          key={refreshKey}
          onCreateNew={() => setShowCreateModal(true)}
          onAnnouncementSelect={(announcement) => setSelectedAnnouncement(announcement)}
          onAnnouncementEdit={(announcement) => setEditingAnnouncement(announcement)}
          onAnnouncementDelete={handleAnnouncementDelete}
        />
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <AnnouncementModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleSave}
        />
      )}

      {/* Edit Modal */}
      {editingAnnouncement && (
        <AnnouncementModal
          announcement={editingAnnouncement}
          onClose={() => setEditingAnnouncement(null)}
          onSave={handleSave}
        />
      )}

      {/* Detail Modal */}
      {selectedAnnouncement && !editingAnnouncement && (
        <AnnouncementDetailModal
          announcement={selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
          onEdit={() => {
            setEditingAnnouncement(selectedAnnouncement)
            setSelectedAnnouncement(null)
          }}
        />
      )}
    </AdminLayout>
  )
}

function AnnouncementDetailModal({
  announcement,
  onClose,
  onEdit,
}: {
  announcement: Announcement
  onClose: () => void
  onEdit: () => void
}) {
  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      info: 'bg-blue-100 text-blue-700',
      success: 'bg-green-100 text-green-700',
      warning: 'bg-yellow-100 text-yellow-700',
      error: 'bg-red-100 text-red-700',
    }
    return colors[type] || colors.info
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Detail Pengumuman</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="sr-only">Tutup</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="pb-4 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">{announcement.title}</h3>
            <p className="text-gray-600 mt-2">{announcement.message}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Tipe</p>
              <span className={`inline-block px-2 py-1 rounded-lg text-xs font-bold mt-1 ${getTypeColor(announcement.type)}`}>
                {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tampilan</p>
              <p className="font-medium capitalize">{announcement.displayType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Target</p>
              <p className="font-medium capitalize">{announcement.targetType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">
                {announcement.isActive ? (
                  <span className="text-lime-600">Aktif</span>
                ) : (
                  <span className="text-gray-500">Tidak Aktif</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Mulai</p>
              <p className="font-medium">{formatDate(announcement.startsAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Berakhir</p>
              <p className="font-medium">{formatDate(announcement.endsAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Dapat Ditutup</p>
              <p className="font-medium">{announcement.isDismissible ? 'Ya' : 'Tidak'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Dilihat</p>
              <p className="font-medium">{announcement._count.announcement_reads}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
          >
            Edit Pengumuman
          </button>
        </div>
      </div>
    </div>
  )
}
