'use client'

import Link from 'next/link'
import {
  Search, Plus, Users, Mail, Phone, FileText, ChevronRight,
} from 'lucide-react'
import { DemoPageWrapper } from '@/components/demo/DemoLayout'
import { demoClients } from '@/lib/demo-data'
import { formatCurrency } from '@/lib/utils'

export default function DemoClientsPage() {
  return (
    <DemoPageWrapper title="Klien">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-brand-500">Daftar Klien</h2>
            <p className="text-text-secondary text-sm">Kelola data klien Anda di satu tempat</p>
          </div>
          <button className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25">
            <Plus className="w-5 h-5" />
            Tambah Klien
          </button>
        </div>

        {/* Search */}
        <div className="card p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Cari klien berdasarkan nama atau email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              readOnly
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-brand-500">15</p>
            <p className="text-xs text-text-muted">Total Klien</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-success-500">3</p>
            <p className="text-xs text-text-muted">Baru Bulan Ini</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-primary-500">32</p>
            <p className="text-xs text-text-muted">Total Invoice</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-text-primary">Rp 235jt</p>
            <p className="text-xs text-text-muted">Total Revenue</p>
          </div>
        </div>

        {/* Client list - Mobile */}
        <div className="block sm:hidden space-y-3">
          {demoClients.map((client) => (
            <div key={client.id} className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-brand-500">
                    {client.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-text-primary text-sm truncate">{client.name}</h3>
                  <p className="text-xs text-text-muted truncate">{client.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{client.totalInvoices} invoice</span>
                <span className="font-bold text-text-primary">{formatCurrency(client.totalRevenue)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Client list - Desktop Table */}
        <div className="hidden sm:block card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-light">
                <tr>
                  <th className="table-header">Klien</th>
                  <th className="table-header">Email</th>
                  <th className="table-header text-center">Invoice</th>
                  <th className="table-header text-right">Total Revenue</th>
                  <th className="table-header text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {demoClients.map((client) => (
                  <tr key={client.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-brand-500">
                            {client.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="font-semibold text-text-primary">{client.name}</span>
                      </div>
                    </td>
                    <td className="table-cell text-text-secondary">{client.email}</td>
                    <td className="table-cell text-center">{client.totalInvoices}</td>
                    <td className="table-cell text-right font-bold text-text-primary">{formatCurrency(client.totalRevenue)}</td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-2 rounded-lg text-text-muted hover:text-brand-500 hover:bg-brand-50 transition-colors">
                          <Mail className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg text-text-muted hover:text-primary-500 hover:bg-primary-50 transition-colors">
                          <FileText className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-gray-100 transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="card p-6 cta-gradient rounded-2xl text-white text-center">
          <h3 className="text-xl font-bold mb-2">Kelola klien dengan mudah!</h3>
          <p className="text-white/90 mb-4">Simpan data klien, lacak riwayat invoice, dan kirim tagihan dalam satu klik.</p>
          <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition-colors">
            Daftar Gratis Sekarang
          </Link>
        </div>
      </div>
    </DemoPageWrapper>
  )
}
