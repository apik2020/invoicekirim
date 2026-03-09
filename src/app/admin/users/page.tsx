'use client'

import { useState } from 'react'
import { UserTable } from '@/components/admin/UserTable'
import { UserDetailModal } from '@/components/admin/UserDetailModal'
import { AdminLayout } from '@/components/admin/AdminLayout'

export default function AdminUsersPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const handleUserDelete = async (user: any) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus user "${user.email}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        alert('User berhasil dihapus')
        window.location.reload()
      } else {
        const data = await res.json()
        alert(`Gagal menghapus user: ${data.error}`)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Terjadi kesalahan saat menghapus user')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Daftar Pengguna</h1>
          <p className="text-text-secondary">Kelola data pengguna, langganan, dan aktivitas</p>
        </div>

        {/* User Table */}
        <div className="card">
          <UserTable
            onUserSelect={(user) => setSelectedUserId(user.id)}
            onUserDelete={handleUserDelete}
          />
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </AdminLayout>
  )
}
