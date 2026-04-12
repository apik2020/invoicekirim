'use client'

import { AlertCircle, Clock, Calendar, X, Send, Loader2, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { id } from 'date-fns/locale'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { useState } from 'react'

interface Invoice {
  id: string
  invoiceNumber: string
  clientName: string
  total: number
  dueDate: string | Date | null
}

interface DueDateAlertsProps {
  overdue: Invoice[]
  dueToday: Invoice[]
  dueThisWeek: Invoice[]
}

export function DueDateAlerts({ overdue, dueToday, dueThisWeek }: DueDateAlertsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  // Don't show alerts if there's nothing to show
  if (overdue.length === 0 && dueToday.length === 0 && dueThisWeek.length === 0) {
    return null
  }

  const dismiss = (key: string) => {
    setDismissed((prev) => new Set([...prev, key]))
  }

  const handleSendReminder = async (invoiceId: string) => {
    setSendingId(invoiceId)
    setError(null)

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/remind`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gagal mengirim reminder')
        return
      }

      setSentIds((prev) => new Set([...prev, invoiceId]))
    } catch {
      setError('Terjadi kesalahan saat mengirim reminder')
    } finally {
      setSendingId(null)
    }
  }

  // Get first item from each category
  const firstOverdue = overdue[0]
  const firstDueToday = dueToday[0]
  const firstDueThisWeek = dueThisWeek[0]

  return (
    <div className="space-y-4">
      {/* Error toast */}
      {error && (
        <div className="card p-4 bg-red-50 border border-red-200 flex items-center justify-between">
          <p className="text-sm text-red-700 font-medium">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Overdue Alert */}
      {firstOverdue && !dismissed.has('overdue') && (
        <div className="card p-6 bg-gradient-to-r from-pink-50 to-red-50 border-pink-300 border-2 relative">
          <button
            onClick={() => dismiss('overdue')}
            className="absolute top-4 right-4 text-pink-400 hover:text-pink-600"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-500 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg">
                {overdue.length} Invoice {overdue.length === 1 ? 'Terlambat' : 'Terlambat'}!
              </h3>

              <p className="text-gray-700 mt-1">
                Invoice untuk <strong>{firstOverdue.clientName}</strong> jatuh tempo{' '}
                {firstOverdue.dueDate && formatDistanceToNow(new Date(firstOverdue.dueDate), {
                  addSuffix: true,
                  locale: id,
                })}
              </p>

              <p className="text-sm font-bold text-pink-700 mt-2">
                Total: {formatCurrency(overdue.reduce((sum, inv) => sum + inv.total, 0))}
              </p>

              <div className="flex gap-3 mt-4">
                <Link
                  href={`/dashboard/invoices/${firstOverdue.id}`}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg text-sm transition-colors"
                >
                  Lihat Invoice
                </Link>
                <button
                  onClick={() => handleSendReminder(firstOverdue.id)}
                  disabled={sendingId === firstOverdue.id || sentIds.has(firstOverdue.id)}
                  className="px-4 py-2 bg-white hover:bg-gray-50 text-pink-600 font-bold rounded-lg text-sm border border-pink-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sendingId === firstOverdue.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : sentIds.has(firstOverdue.id) ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Terkirim
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Kirim Reminder
                    </>
                  )}
                </button>
              </div>

              {overdue.length > 1 && (
                <Link
                  href="/dashboard/invoices?status=OVERDUE"
                  className="block mt-3 text-sm font-bold text-pink-600 hover:text-pink-700"
                >
                  Lihat semua {overdue.length} invoice terlambat →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Due Today Alert */}
      {firstDueToday && !dismissed.has('today') && (
        <div className="card p-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-300 border-2 relative">
          <button
            onClick={() => dismiss('today')}
            className="absolute top-4 right-4 text-orange-400 hover:text-orange-600"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg">
                {dueToday.length} Invoice Jatuh Tempo Hari Ini
              </h3>

              <p className="text-gray-700 mt-1">
                Invoice untuk <strong>{firstDueToday.clientName}</strong> sebesar{' '}
                <strong>{formatCurrency(firstDueToday.total)}</strong>
              </p>

              <div className="flex gap-3 mt-4">
                <Link
                  href={`/dashboard/invoices/${firstDueToday.id}`}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-sm transition-colors"
                >
                  Lihat Invoice
                </Link>
                <button
                  onClick={() => handleSendReminder(firstDueToday.id)}
                  disabled={sendingId === firstDueToday.id || sentIds.has(firstDueToday.id)}
                  className="px-4 py-2 bg-white hover:bg-gray-50 text-orange-600 font-bold rounded-lg text-sm border border-orange-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sendingId === firstDueToday.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : sentIds.has(firstDueToday.id) ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Terkirim
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Kirim Reminder
                    </>
                  )}
                </button>
              </div>

              {dueToday.length > 1 && (
                <Link
                  href="/dashboard/invoices"
                  className="block mt-3 text-sm font-bold text-orange-600 hover:text-orange-700"
                >
                  Lihat semua invoice jatuh tempo →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Due This Week Alert */}
      {firstDueThisWeek && !dismissed.has('week') && overdue.length === 0 && dueToday.length === 0 && (
        <div className="card p-6 bg-gradient-to-r from-yellow-50 to-lime-50 border-yellow-300 border-2 relative">
          <button
            onClick={() => dismiss('week')}
            className="absolute top-4 right-4 text-yellow-600 hover:text-yellow-700"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg">
                {dueThisWeek.length} Invoice Jatuh Tempo Minggu Ini
              </h3>

              <p className="text-gray-700 mt-1">
                Invoice berikutnya jatuh tempo pada{' '}
                <strong>
                  {firstDueThisWeek.dueDate && format(new Date(firstDueThisWeek.dueDate), 'EEEE, d MMMM', { locale: id })}
                </strong>
              </p>

              <p className="text-sm font-bold text-yellow-700 mt-2">
                Total: {formatCurrency(dueThisWeek.reduce((sum, inv) => sum + inv.total, 0))}
              </p>

              {dueThisWeek.length > 1 && (
                <Link
                  href="/dashboard/invoices"
                  className="inline-block mt-3 text-sm font-bold text-yellow-600 hover:text-yellow-700"
                >
                  Lihat semua {dueThisWeek.length} invoice →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
