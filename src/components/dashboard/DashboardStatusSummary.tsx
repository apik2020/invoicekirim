'use client'

import Link from 'next/link'
import { FileText, Send, CheckCircle, AlertCircle, Edit2 } from 'lucide-react'

interface DashboardStatusSummaryProps {
  counts: {
    ALL: number
    DRAFT: number
    SENT: number
    PAID: number
    OVERDUE: number
  }
}

const STATUS_CARDS = [
  { key: 'ALL', label: 'Total Invoice', icon: FileText, href: '/dashboard/invoices', color: 'icon-box-orange' },
  { key: 'SENT', label: 'Terkirim', icon: Send, href: '/dashboard/invoices?status=SENT', color: 'icon-box-yellow' },
  { key: 'PAID', label: 'Lunas', icon: CheckCircle, href: '/dashboard/invoices?status=PAID', color: 'icon-box-lime' },
  { key: 'OVERDUE', label: 'Terlambat', icon: AlertCircle, href: '/dashboard/invoices?status=OVERDUE', color: 'icon-box-pink' },
  { key: 'DRAFT', label: 'Draft', icon: Edit2, href: '/dashboard/invoices?status=DRAFT', color: 'icon-box-orange' },
]

export function DashboardStatusSummary({ counts }: DashboardStatusSummaryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {STATUS_CARDS.map((card) => {
        const Icon = card.icon
        const count = counts[card.key as keyof typeof counts] || 0

        return (
          <Link
            key={card.key}
            href={card.href}
            className="card card-hover p-4 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.color}`}>
                <Icon className="w-5 h-5 text-gray-700" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{count}</span>
            </div>
            <p className="text-sm font-bold text-gray-600">{card.label}</p>
          </Link>
        )
      })}
    </div>
  )
}
