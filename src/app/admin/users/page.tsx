'use client'

import { useState } from 'react'
import { UserTable } from '@/components/admin/UserTable'
import { UserDetailModal } from '@/components/admin/UserDetailModal'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useMessageBox } from '@/hooks/useMessageBox'
import { MessageBox } from '@/components/ui/MessageBox'

export default function AdminUsersPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const messageBox = useMessageBox()

  const handleUserDelete = async (user: any) => {
    messageBox.showDelete({
      title: 'Hapus User?',
      message: (
        <div className="space-y-2">
          <p>
            Anda akan menghapus user <span className="font-semibold text-gray-900">{user.email}</span>.
          </p>
          <p className="text-xs text-gray-500">Tindakan ini tidak dapat dibatalkan.</p>
        </div>
      ),
      confirmText: 'Ya, Hapus',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/users/${user.id}`, {
            method: 'DELETE',
          })

          if (res.ok) {
            window.location.reload()
          } else {
            const data = await res.json()
            messageBox.showWarning({
              title: 'Gagal Menghapus',
              message: data.error || 'Gagal menghapus user. Silakan coba lagi.',
              confirmText: 'Mengerti',
              onConfirm: () => messageBox.close(),
            })
          }
        } catch (error) {
          console.error('Error deleting user:', error)
          messageBox.showWarning({
            title: 'Kesalahan',
            message: 'Terjadi kesalahan saat menghapus user.',
            confirmText: 'Mengerti',
            onConfirm: () => messageBox.close(),
          })
        }
      },
    })
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
    </AdminLayout>
  )
}
