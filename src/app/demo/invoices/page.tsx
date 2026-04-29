'use client'

import Link from 'next/link'
import {
  Plus, Search, Filter, FileText, Send, CheckCircle2, Clock, AlertCircle,
  Eye, Download, MoreHorizontal,
} from 'lucide-react'
import { DemoPageWrapper } from '@/components/demo/DemoLayout'
import { demoInvoices } from '@/lib/demo-data'
import { formatCurrency } from '@/lib/utils'

const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  PAID: { label: 'Lunas', className: 'status-paid', icon: CheckCircle2 },
  SENT: { label: 'Terkirim', className: 'status-sent', icon: Send },
  OVERDUE: { label: 'Terlambat', className: 'status-overdue', icon: AlertCircle },
  DRAFT: { label: 'Draft', className: 'status-draft', icon: Clock },
}

export default function DemoInvoicesPage() {
  return (
    <DemoPageWrapper title="Invoice">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-brand-500">Daftar Invoice</h2>
            <p className="text-text-secondary text-sm">Kelola dan pantau semua invoice Anda</p>
          </div>
          <Link
            href="/demo/invoices/create"
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all"
          >
            <Plus className="w-5 h-5" />
            Buat Invoice Baru
          </Link>
        </div>

        {/* Filters */}
        <div className="card p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Cari invoice..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              readOnly
            />
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-text-secondary hover:bg-surface-light transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Lunas', count: 18, amount: 'Rp 150.000.000', color: 'bg-green-50 border-green-200 text-green-700' },
            { label: 'Terkirim', count: 8, amount: 'Rp 50.000.000', color: 'bg-blue-50 border-blue-200 text-blue-700' },
            { label: 'Terlambat', count: 3, amount: 'Rp 22.500.000', color: 'bg-red-50 border-red-200 text-red-700' },
            { label: 'Draft', count: 3, amount: 'Rp 12.500.000', color: 'bg-gray-50 border-gray-200 text-gray-700' },
          ].map((s) => (
            <div key={s.label} className={`card p-4 border ${s.color}`}>
              <p className="text-xs font-semibold opacity-80">{s.label}</p>
              <p className="text-lg font-bold">{s.count}</p>
              <p className="text-xs opacity-70">{s.amount}</p>
            </div>
          ))}
        </div>

        {/* Invoice list - Mobile Cards */}
        <div className="block sm:hidden space-y-3">
          {demoInvoices.map((inv) => {
            const cfg = statusConfig[inv.status]
            return (
              <div key={inv.id} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-text-primary">{inv.invoiceNumber}</span>
                  <span className={`status-pill text-[10px] ${cfg.className}`}>{cfg.label}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">{inv.clientName}</span>
                  <span className="font-bold text-text-primary">{formatCurrency(inv.total)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>{new Date(inv.date).toLocaleDateString('id-ID')}</span>
                  <span>Jatuh tempo: {new Date(inv.dueDate).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary-50 text-primary-600 text-xs font-semibold hover:bg-primary-100 transition-colors">
                    <Eye className="w-3.5 h-3.5" /> Lihat
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand-50 text-brand-600 text-xs font-semibold hover:bg-brand-100 transition-colors">
                    <Send className="w-3.5 h-3.5" /> Kirim
                  </button>
                  <button className="flex items-center justify-center p-2 rounded-lg text-text-muted hover:bg-gray-100 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Invoice list - Desktop Table */}
        <div className="hidden sm:block card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-light">
                <tr>
                  <th className="table-header">Nomor</th>
                  <th className="table-header">Klien</th>
                  <th className="table-header">Tanggal</th>
                  <th className="table-header">Jatuh Tempo</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Total</th>
                  <th className="table-header text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {demoInvoices.map((inv) => {
                  const cfg = statusConfig[inv.status]
                  return (
                    <tr key={inv.id} className="table-row">
                      <td className="table-cell font-bold text-text-primary">{inv.invoiceNumber}</td>
                      <td className="table-cell text-text-secondary">{inv.clientName}</td>
                      <td className="table-cell text-text-secondary">{new Date(inv.date).toLocaleDateString('id-ID')}</td>
                      <td className="table-cell text-text-secondary">{new Date(inv.dueDate).toLocaleDateString('id-ID')}</td>
                      <td className="table-cell">
                        <span className={`status-pill ${cfg.className}`}>
                          <cfg.icon className="w-3 h-3 mr-1" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="table-cell text-right font-bold text-text-primary">{formatCurrency(inv.total)}</td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-2 rounded-lg text-text-muted hover:text-primary-500 hover:bg-primary-50 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-lg text-text-muted hover:text-brand-500 hover:bg-brand-50 transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-gray-100 transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="card p-6 cta-gradient rounded-2xl text-white text-center">
          <h3 className="text-xl font-bold mb-2">Ingin mengelola invoice seperti ini?</h3>
          <p className="text-white/90 mb-4">Daftar gratis dan langsung buat invoice pertama Anda.</p>
          <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition-colors">
            Daftar Gratis Sekarang
          </Link>
        </div>
      </div>
    </DemoPageWrapper>
  )
}
