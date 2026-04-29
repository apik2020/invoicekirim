'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  FileText, Plus, Users, Package, Crown, Sparkles, Clock, Send,
  BarChart3, TrendingUp, TrendingDown, PlayCircle,
  Bell, CheckCircle2, Zap, Eye,
} from 'lucide-react'
import {
  DemoTourGuide, DemoWelcomeOverlay, DemoCompleteOverlay,
} from '@/components/demo/DemoTourGuide'
import type { TourStep } from '@/components/demo/DemoTourGuide'
import { DemoPageWrapper } from '@/components/demo/DemoLayout'
import {
  demoInvoices, demoStats, demoRevenueByMonth, demoRevenueByStatus,
  demoActivityLogs,
} from '@/lib/demo-data'
import { formatCurrency } from '@/lib/utils'

// ============================================
// Stat Card
// ============================================
function StatCard({ icon: Icon, label, value, change, changeType, color }: {
  icon: React.ElementType
  label: string
  value: string
  change: string
  changeType: 'up' | 'down'
  color: string
}) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${
          changeType === 'up' ? 'text-success-500' : 'text-primary-500'
        }`}>
          {changeType === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {change}
        </div>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-muted mt-1">{label}</p>
    </div>
  )
}

// ============================================
// Mini Revenue Chart
// ============================================
function DemoRevenueChart() {
  const maxRevenue = Math.max(...demoRevenueByMonth.map(d => d.revenue))
  return (
    <div id="demo-revenue-chart" className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-brand-500">Pendapatan Bulanan</h3>
          <p className="text-sm text-text-muted">6 bulan terakhir</p>
        </div>
        <div className="flex items-center gap-1.5 text-success-500 text-sm font-bold">
          <TrendingUp className="w-4 h-4" />
          +27.9%
        </div>
      </div>
      <div className="flex items-end justify-between gap-3 h-48">
        {demoRevenueByMonth.map((d, i) => {
          const height = (d.revenue / maxRevenue) * 100
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-text-muted">
                {(d.revenue / 1000000).toFixed(0)}jt
              </span>
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-primary-500 to-primary-400 transition-all duration-700"
                style={{ height: `${height}%` }}
              />
              <span className="text-[10px] text-text-muted">{d.month.split(' ')[0]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// Revenue By Status
// ============================================
function DemoRevenueByStatus() {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-bold text-brand-500 mb-4">Status Invoice</h3>
      <div className="space-y-4">
        {demoRevenueByStatus.map((d, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-sm font-medium text-text-primary">{d.status}</span>
              </div>
              <span className="text-sm font-bold text-text-primary">{d.count}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(d.amount / demoStats.totalRevenue) * 100}%`,
                  backgroundColor: d.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// Tour Steps
// ============================================
const tourSteps: TourStep[] = [
  {
    targetId: 'demo-welcome-section',
    title: 'Dashboard Profesional',
    description: 'Ini adalah dashboard utama yang Anda lihat setelah login. Semua data invoice, klien, dan pendapatan ada di sini.',
    position: 'bottom',
  },
  {
    targetId: 'demo-sidebar',
    title: 'Navigasi Lengkap',
    description: 'Klik menu di sidebar untuk menjelajahi setiap halaman: Invoice, Klien, Item, Template, dan Pengaturan.',
    position: 'right',
  },
  {
    targetId: 'demo-quick-actions',
    title: 'Aksi Cepat',
    description: 'Buat invoice baru, kelola klien, atau akses katalog item — semua bisa dalam 1 klik!',
    position: 'bottom',
  },
  {
    targetId: 'demo-stats-cards',
    title: 'Ringkasan Bisnis Real-time',
    description: 'Pantau total pendapatan, jumlah invoice, dan pertumbuhan bisnis Anda secara real-time.',
    position: 'bottom',
  },
  {
    targetId: 'demo-revenue-chart',
    title: 'Grafik Pendapatan',
    description: 'Visualisasi pendapatan bulanan yang memudahkan Anda melihat tren bisnis.',
    position: 'top',
  },
  {
    targetId: 'demo-invoices-table',
    title: 'Daftar Invoice Terbaru',
    description: 'Lihat semua invoice dengan status yang jelas: Lunas, Terkirim, Terlambat, atau Draft.',
    position: 'top',
  },
  {
    targetId: 'demo-activity-feed',
    title: 'Aktivitas Terkini',
    description: 'Pantau setiap aktivitas: invoice terkirim, pembayaran diterima, dan reminder.',
    position: 'top',
  },
  {
    targetId: 'demo-cta-join',
    title: 'Siap Memulai?',
    description: 'Semua fitur yang Anda lihat bisa langsung Anda gunakan! Daftar gratis sekarang.',
    position: 'top',
  },
]

// ============================================
// Main Demo Dashboard Page
// ============================================
export default function DemoPage() {
  const [tourState, setTourState] = useState<'welcome' | 'touring' | 'complete' | 'idle'>('welcome')

  const handleStartTour = useCallback(() => setTourState('touring'), [])
  const handleSkipTour = useCallback(() => setTourState('idle'), [])
  const handleTourComplete = useCallback(() => setTourState('complete'), [])
  const handleTourClose = useCallback(() => setTourState('idle'), [])

  return (
    <DemoPageWrapper title="Dashboard">
      <div className="space-y-8">
        {/* Welcome + Plan Badge */}
        <div id="demo-welcome-section">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="font-bold text-2xl md:text-3xl text-brand-500 tracking-tight">
              Selamat Datang, Demo User!
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
              <Crown className="w-3 h-3" />
              Profesional
            </span>
          </div>
          <p className="text-text-secondary">
            Kelola invoice bisnismu dengan mudah dan profesional
          </p>
          <p className="text-sm text-text-muted mt-1">
            Invoice bulan ini: <span className="font-semibold text-text-primary">32</span>/Unlimited
          </p>
        </div>

        {/* Quick Actions */}
        <div id="demo-quick-actions" className="card p-4 sm:p-6">
          <h2 className="text-lg font-bold text-brand-500 mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {[
              { icon: Plus, label: 'Buat Invoice', sublabel: 'Invoice baru', color: 'from-primary-500 to-primary-600', bg: 'bg-primary-50', border: 'border-primary-200', hoverBg: 'hover:bg-primary-100', href: '/demo/invoices/create' },
              { icon: Users, label: 'Klien', sublabel: 'Kelola klien', color: 'from-brand-500 to-brand-600', bg: 'bg-brand-50', border: 'border-brand-200', hoverBg: 'hover:bg-brand-100', href: '/demo/clients' },
              { icon: Package, label: 'Item', sublabel: 'Katalog item', color: 'from-secondary-400 to-secondary-500', bg: 'bg-secondary-50', border: 'border-secondary-200', hoverBg: 'hover:bg-secondary-100', href: '/demo/items' },
              { icon: FileText, label: 'Template', sublabel: 'Kelola template', color: 'from-highlight-400 to-highlight-500', bg: 'bg-highlight-50', border: 'border-highlight-200', hoverBg: 'hover:bg-highlight-100', href: '/demo/templates' },
              { icon: FileText, label: 'Daftar Invoice', sublabel: 'Lihat invoice', color: 'from-success-400 to-success-500', bg: 'bg-success-50', border: 'border-success-200', hoverBg: 'hover:bg-success-100', href: '/demo/invoices' },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={`flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl ${action.bg} ${action.hoverBg} border ${action.border} transition-colors text-center sm:text-left`}
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg`}>
                  <action.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-xs sm:text-sm">{action.label}</h3>
                  <p className="text-xs text-text-muted hidden sm:block">{action.sublabel}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div id="demo-stats-cards" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={TrendingUp}
            label="Total Pendapatan"
            value={formatCurrency(demoStats.thisMonthRevenue)}
            change="+27.9%"
            changeType="up"
            color="bg-success-100 text-success-600"
          />
          <StatCard
            icon={FileText}
            label="Total Invoice"
            value={demoStats.totalInvoices.toString()}
            change="+5 bulan ini"
            changeType="up"
            color="bg-primary-100 text-primary-600"
          />
          <StatCard
            icon={Users}
            label="Total Klien"
            value={demoStats.totalClients.toString()}
            change="+3 baru"
            changeType="up"
            color="bg-brand-100 text-brand-600"
          />
          <StatCard
            icon={Clock}
            label="Belum Dibayar"
            value={formatCurrency(72500000)}
            change="8 invoice"
            changeType="down"
            color="bg-amber-100 text-amber-600"
          />
        </div>

        {/* Revenue Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DemoRevenueChart />
          </div>
          <DemoRevenueByStatus />
        </div>

        {/* Invoices Table */}
        <div id="demo-invoices-table" className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-brand-500">Invoice Terbaru</h2>
            <Link href="/demo/invoices" className="text-sm text-brand-500 font-medium hover:text-brand-600 transition-colors">
              Lihat Semua →
            </Link>
          </div>

          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-2">
            {demoInvoices.slice(0, 5).map((inv) => (
              <div key={inv.id} className="p-3 rounded-xl bg-surface-light hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-text-primary text-sm">{inv.invoiceNumber}</span>
                  <span className={`status-pill text-[10px] ${
                    inv.status === 'PAID' ? 'status-paid'
                      : inv.status === 'SENT' ? 'status-sent'
                        : inv.status === 'OVERDUE' ? 'status-overdue'
                          : 'status-draft'
                  }`}>
                    {inv.status === 'PAID' ? 'Lunas' : inv.status === 'SENT' ? 'Terkirim' : inv.status === 'OVERDUE' ? 'Terlambat' : 'Draft'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">{inv.clientName}</span>
                  <span className="font-bold text-text-primary text-sm">{formatCurrency(inv.total)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-light">
                <tr>
                  <th className="table-header">Nomor</th>
                  <th className="table-header">Klien</th>
                  <th className="table-header">Tanggal</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {demoInvoices.map((inv) => (
                  <tr key={inv.id} className="table-row">
                    <td className="table-cell font-bold text-text-primary">{inv.invoiceNumber}</td>
                    <td className="table-cell text-text-secondary">{inv.clientName}</td>
                    <td className="table-cell text-text-secondary">
                      {new Date(inv.date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="table-cell">
                      <span className={`status-pill ${
                        inv.status === 'PAID' ? 'status-paid'
                          : inv.status === 'SENT' ? 'status-sent'
                            : inv.status === 'OVERDUE' ? 'status-overdue'
                              : 'status-draft'
                      }`}>
                        {inv.status === 'PAID' ? 'Lunas' : inv.status === 'SENT' ? 'Terkirim' : inv.status === 'OVERDUE' ? 'Terlambat' : 'Draft'}
                      </span>
                    </td>
                    <td className="table-cell text-right font-bold text-text-primary">
                      {formatCurrency(inv.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div id="demo-activity-feed" className="card p-6">
          <h2 className="text-lg font-bold text-brand-500 mb-4">Aktivitas Terkini</h2>
          <div className="space-y-4">
            {demoActivityLogs.map((log) => {
              const iconMap: Record<string, { icon: React.ElementType; color: string }> = {
                INVOICE_SENT: { icon: Send, color: 'bg-blue-100 text-blue-600' },
                PAYMENT_RECEIVED: { icon: CheckCircle2, color: 'bg-green-100 text-green-600' },
                INVOICE_CREATED: { icon: FileText, color: 'bg-purple-100 text-purple-600' },
                REMINDER_SENT: { icon: Bell, color: 'bg-amber-100 text-amber-600' },
              }
              const { icon: Icon, color } = iconMap[log.type] || { icon: Zap, color: 'bg-gray-100 text-gray-600' }
              return (
                <div key={log.id} className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">{log.message}</p>
                    <p className="text-xs text-text-muted mt-0.5">{log.timestamp}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA Join */}
        <div id="demo-cta-join" className="card p-6 sm:p-8 cta-gradient rounded-2xl text-white text-center shadow-brand">
          <div className="max-w-lg mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Tertarik? Mulai Gratis Sekarang!
            </h2>
            <p className="text-white/90 mb-6 leading-relaxed">
              Semua fitur yang Anda lihat di demo ini siap digunakan. Mulai dari Rp 0 — tanpa kartu kredit.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-600 font-bold rounded-xl text-lg hover:bg-brand-50 transition-colors shadow-lg"
              >
                <Sparkles className="w-5 h-5" />
                Daftar Gratis
              </Link>
              <Link
                href="/#pricing"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 text-white font-bold rounded-xl text-lg hover:bg-white/30 transition-colors"
              >
                Lihat Paket
              </Link>
            </div>
            <p className="mt-4 text-white/80 text-sm">Tanpa kartu kredit • Setup cepat • Langsung bisa dipakai</p>
          </div>
        </div>
      </div>

      {/* Tour Overlays */}
      {tourState === 'welcome' && (
        <DemoWelcomeOverlay onStart={handleStartTour} onSkip={handleSkipTour} />
      )}
      {tourState === 'touring' && (
        <DemoTourGuide
          steps={tourSteps}
          onComplete={handleTourComplete}
          onSkip={handleTourClose}
        />
      )}
      {tourState === 'complete' && (
        <DemoCompleteOverlay onClose={handleTourClose} />
      )}
    </DemoPageWrapper>
  )
}
