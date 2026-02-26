import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FileText, TrendingUp, DollarSign, Clock, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import DashboardHeader from '@/components/DashboardHeader'

async function getDashboardData(userId: string) {
  const [invoices, subscription] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { items: true },
    }),
    prisma.subscription.findUnique({
      where: { userId },
    }),
  ])

  const totalInvoices = invoices.length
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const paidInvoices = invoices.filter((inv) => inv.status === 'PAID').length
  const pendingInvoices = invoices.filter(
    (inv) => inv.status === 'SENT' || inv.status === 'DRAFT'
  ).length

  return {
    invoices,
    subscription,
    stats: {
      totalInvoices,
      totalRevenue,
      paidInvoices,
      pendingInvoices,
    },
  }
}

function StatCard({ title, value, icon: Icon, color = 'text-dark' }: { title: string; value: string | number; icon: any; color?: string }) {
  return (
    <div className="card card-hover p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate">{title}</h3>
        <div className="w-12 h-12 rounded-xl icon-box">
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      <p className="text-3xl font-bold text-dark">{value}</p>
    </div>
  )
}

async function DashboardContent() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  const data = await getDashboardData(session.user.id)

  return (
    <div className="space-y-10">
      {/* Welcome Section */}
      <div>
        <h1 className="font-bold text-3xl md:text-4xl text-dark mb-2 tracking-tight">
          Selamat Datang, {session.user?.name || 'Kawan'}! 👋
        </h1>
        <p className="text-slate">
          Kelola invoice bisnismu dengan mudah dan profesional
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Invoice"
          value={data.stats.totalInvoices}
          icon={FileText}
        />
        <StatCard
          title="Total Pendapatan"
          value={formatCurrency(data.stats.totalRevenue)}
          icon={DollarSign}
          color="text-teal-light"
        />
        <StatCard
          title="Invoice Lunas"
          value={data.stats.paidInvoices}
          icon={TrendingUp}
          color="text-teal-light"
        />
        <StatCard
          title="Invoice Pending"
          value={data.stats.pendingInvoices}
          icon={Clock}
          color="text-teal-light"
        />
      </div>

      {/* Quick Links */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-dark mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/invoices/create"
            className="flex items-center gap-3 p-4 rounded-xl bg-gray hover:bg-gray border border-slate transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-charcoal flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-dark">Buat Invoice</h3>
              <p className="text-sm text-slate">Buat invoice baru</p>
            </div>
          </Link>
          <Link
            href="/dashboard/templates"
            className="flex items-center gap-3 p-4 rounded-xl bg-gray hover:bg-gray border border-slate transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-green-light flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-dark">Template</h3>
              <p className="text-sm text-slate">Kelola template invoice</p>
            </div>
          </Link>
          <Link
            href="/dashboard/invoices"
            className="flex items-center gap-3 p-4 rounded-xl bg-gray hover:bg-gray border border-slate transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-green-light flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-dark">Daftar Invoice</h3>
              <p className="text-sm text-slate">Lihat semua invoice</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="card p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-dark">Invoice Terbaru</h2>
          <Link
            href="/dashboard/invoices"
            className="text-sm text-dark hover:text-teal-light font-medium"
          >
            Lihat Semua →
          </Link>
        </div>

        {data.invoices.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-2xl icon-box mx-auto mb-4">
              <FileText className="w-10 h-10 text-slate" />
            </div>
            <h3 className="text-lg font-bold text-dark mb-2">
              Belum ada invoice
            </h3>
            <p className="text-slate mb-6">
              Buat invoice pertamamu sekarang
            </p>
            <Link
              href="/dashboard/invoices/create"
              className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl btn-primary"
            >
              Buat Invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate">
                  <th className="text-left py-3 text-sm font-bold text-slate">Nomor</th>
                  <th className="text-left py-3 text-sm font-bold text-slate">Klien</th>
                  <th className="text-left py-3 text-sm font-bold text-slate">Tanggal</th>
                  <th className="text-left py-3 text-sm font-bold text-slate">Status</th>
                  <th className="text-right py-3 text-sm font-bold text-slate">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((invoice: any) => (
                  <tr key={invoice.id} className="border-b border-slate hover:bg-gray transition-colors">
                    <td className="py-4 font-bold text-dark">{invoice.invoiceNumber}</td>
                    <td className="py-4 text-slate">{invoice.clientName}</td>
                    <td className="py-4 text-slate">
                      {new Date(invoice.date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                        invoice.status === 'PAID'
                          ? 'bg-green-light-100 text-teal-light-700'
                          : invoice.status === 'SENT'
                          ? 'bg-teal-100 text-teal-700'
                          : invoice.status === 'OVERDUE'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-slate-light-700'
                      }`}>
                        {invoice.status === 'PAID' ? 'Lunas' : invoice.status === 'SENT' ? 'Terkirim' : invoice.status === 'OVERDUE' ? 'Terlambat' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-4 text-right font-bold text-dark">
                      {formatCurrency(invoice.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Plan Status */}
      {data.subscription && data.subscription.planType === 'FREE' && (
        <div className="card p-8 bg-gradient-to-br from-terracotta/10 to-transparent border-dark">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-dark mb-2">
                Paket Gratis - {data.stats.totalInvoices}/10 Invoice
              </h3>
              <p className="text-slate">
                Upgrade ke Paket Pro untuk invoice tanpa batas dan fitur premium lainnya
              </p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl btn-primary whitespace-nowrap"
            >
              Upgrade ke Pro
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray">
      {/* Header */}
      <DashboardHeader
        title="Dashboard"
        actions={
          <Link
            href="/dashboard/invoices/create"
            className="flex items-center gap-2 px-5 py-2.5 text-white font-bold rounded-xl btn-primary"
          >
            Buat Invoice
          </Link>
        }
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Suspense fallback={<div className="text-center py-20 text-slate">Memuat...</div>}>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  )
}
