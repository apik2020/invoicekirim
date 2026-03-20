'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { SupportTicketTable } from '@/components/admin/SupportTicketTable'
import { SupportTicketDetailModal } from '@/components/admin/SupportTicketDetailModal'
import { MessageCircle, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default function AdminSupportPage() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Support Tickets</h1>
          <p className="text-text-secondary">Kelola permintaan bantuan dari pengguna</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <MessageCircle className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-sm opacity-80">Total Tickets</p>
            <p className="text-2xl font-bold">-</p>
          </div>
          <div className="card p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <Clock className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-sm opacity-80">In Progress</p>
            <p className="text-2xl font-bold">-</p>
          </div>
          <div className="card p-4 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CheckCircle className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-sm opacity-80">Resolved</p>
            <p className="text-2xl font-bold">-</p>
          </div>
          <div className="card p-4 bg-gradient-to-br from-red-500 to-red-600 text-white">
            <AlertCircle className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-sm opacity-80">Urgent</p>
            <p className="text-2xl font-bold">-</p>
          </div>
        </div>

        {/* Ticket Table */}
        <SupportTicketTable
          key={refreshKey}
          onTicketSelect={(ticket) => setSelectedTicketId(ticket.id)}
        />
      </div>

      {/* Detail Modal */}
      {selectedTicketId && (
        <SupportTicketDetailModal
          ticketId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          onUpdate={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </AdminLayout>
  )
}
