'use client'

import { AlertTriangle, Clock, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface DueDateSummaryProps {
  overdueCount: number
  overdueAmount: number
  dueThisWeekCount: number
  dueThisWeekAmount: number
}

export function DueDateSummary({
  overdueCount,
  overdueAmount,
  dueThisWeekCount,
  dueThisWeekAmount,
}: DueDateSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Overdue Card */}
      {overdueCount > 0 && (
        <Link
          href="/dashboard/invoices?status=OVERDUE"
          className="card card-hover p-6 bg-gradient-to-br from-pink-50 to-red-50 border-pink-200 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-pink-500 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>

            <div className="flex-1">
              <p className="text-sm font-bold text-pink-700">Invoice Terlambat</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{overdueCount}</p>
              <p className="text-sm text-gray-700 mt-1">{formatCurrency(overdueAmount)}</p>
            </div>

            <div className="text-pink-500">
              →
            </div>
          </div>
        </Link>
      )}

      {/* Due This Week Card */}
      {dueThisWeekCount > 0 && (
        <Link
          href="/dashboard/invoices"
          className="card card-hover p-6 bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center">
              <Clock className="w-7 h-7 text-white" />
            </div>

            <div className="flex-1">
              <p className="text-sm font-bold text-orange-700">Jatuh Tempo Minggu Ini</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{dueThisWeekCount}</p>
              <p className="text-sm text-gray-700 mt-1">{formatCurrency(dueThisWeekAmount)}</p>
            </div>

            <div className="text-orange-500">
              →
            </div>
          </div>
        </Link>
      )}

      {/* No due invoices */}
      {overdueCount === 0 && dueThisWeekCount === 0 && (
        <div className="col-span-1 md:col-span-2 card p-8 bg-gradient-to-br from-lime-50 to-green-50 border-lime-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-lime-500 flex items-center justify-center">
              <Calendar className="w-7 h-7 text-white" />
            </div>

            <div>
              <p className="text-lg font-bold text-gray-900">Semua Aman! ✨</p>
              <p className="text-gray-700">Tidak ada invoice yang jatuh tempo dalam 7 hari ke depan</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
