'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Users, UserPlus, Loader2, LogOut } from 'lucide-react'
import { UserTable } from '@/components/admin/UserTable'
import { UserDetailModal } from '@/components/admin/UserDetailModal'

export default function AdminUsersPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
    if (status === 'authenticated') {
      setLoading(false)
    }
  }, [status, router])

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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-fresh-bg">

      {/* Header */}
      <div className="bg-white border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin - User Management</h1>
              <p className="text-gray-600 text-sm">Kelola pengguna InvoiceKirim</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/admin/payments')}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Payments
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Daftar Pengguna</h2>
          <p className="text-gray-600">Kelola data pengguna, langganan, dan aktivitas</p>
        </div>

        {/* User Table */}
        <UserTable
          onUserSelect={(user) => setSelectedUserId(user.id)}
          onUserDelete={handleUserDelete}
        />
      </div>

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  )
}
