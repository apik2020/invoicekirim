'use client'

import { ActivityLogTable } from '@/components/admin/ActivityLogTable'
import { AdminLayout } from '@/components/admin/AdminLayout'

export default function AdminActivityLogsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Audit Logs</h1>
          <p className="text-text-secondary">Lihat semua aktivitas pengguna dalam sistem</p>
        </div>

        {/* Activity Logs Table */}
        <div className="card">
          <ActivityLogTable />
        </div>
      </div>
    </AdminLayout>
  )
}
