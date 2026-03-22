'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Send,
  Loader2,
  HelpCircle,
  User,
  Headphones,
  Clock,
} from 'lucide-react'
import { ClientDashboardLayout } from '@/components/ClientDashboardLayout'
import { formatDate } from '@/lib/utils'

interface Message {
  id: string
  message: string
  createdAt: string
  userId: string | null
  adminId: string | null
  clientId: string | null
  users: {
    id: string
    name: string | null
    email: string
  } | null
  client: {
    id: string
    name: string
    email: string
  } | null
}

interface Ticket {
  id: string
  subject: string
  description: string
  category: string
  priority: string
  status: string
  lastReplyAt: string | null
  createdAt: string
  resolvedAt: string | null
  closedAt: string | null
  support_messages: Message[]
}

export default function TicketDetailPage() {
  const router = useRouter()
  const params = useParams()
  const ticketId = params.id as string
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (ticketId) {
      fetchTicket()
    }
  }, [ticketId])

  useEffect(() => {
    scrollToBottom()
  }, [ticket?.support_messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchTicket = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/client/support/${ticketId}`)

      if (res.status === 401) {
        router.push('/client/auth/login')
        return
      }

      if (res.status === 404) {
        router.push('/client/dashboard/support')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setTicket(data.ticket)
      }
    } catch (error) {
      console.error('Error fetching ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendReply = async () => {
    if (!reply.trim() || !ticketId) return

    try {
      setSending(true)
      setError('')
      const res = await fetch(`/api/client/support/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply.trim() }),
      })

      const data = await res.json()

      if (res.ok) {
        setReply('')
        fetchTicket()
      } else {
        setError(data.error || 'Gagal mengirim pesan')
      }
    } catch (error) {
      console.error('Error sending reply:', error)
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setSending(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      open: { bg: 'bg-blue-100', text: 'text-blue-700' },
      in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      waiting_customer: { bg: 'bg-purple-100', text: 'text-purple-700' },
      resolved: { bg: 'bg-green-100', text: 'text-green-700' },
      closed: { bg: 'bg-gray-100', text: 'text-gray-700' },
    }

    const labels: Record<string, string> = {
      open: 'Open',
      in_progress: 'In Progress',
      waiting_customer: 'Menunggu Respon',
      resolved: 'Resolved',
      closed: 'Closed',
    }

    const style = styles[status] || styles.open

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
        {labels[status] || status}
      </span>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      normal: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700',
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority] || styles.normal}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    )
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: 'Pertanyaan Umum',
      billing: 'Pembayaran & Tagihan',
      technical: 'Masalah Teknis',
      feature_request: 'Permintaan Fitur',
    }
    return labels[category] || category
  }

  if (loading) {
    return (
      <ClientDashboardLayout title="Detail Tiket">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      </ClientDashboardLayout>
    )
  }

  if (!ticket) {
    return (
      <ClientDashboardLayout title="Detail Tiket">
        <div className="text-center py-24">
          <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Tiket tidak ditemukan</h3>
          <Link
            href="/client/dashboard/support"
            className="text-brand-500 hover:text-brand-600"
          >
            Kembali ke daftar tiket
          </Link>
        </div>
      </ClientDashboardLayout>
    )
  }

  const isClosed = ticket.status === 'closed'

  return (
    <ClientDashboardLayout title="Detail Tiket">
      {/* Back Button */}
      <Link
        href="/client/dashboard/support"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Daftar Tiket
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Informasi Tiket</h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                {getStatusBadge(ticket.status)}
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Prioritas</p>
                {getPriorityBadge(ticket.priority)}
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Kategori</p>
                <p className="text-sm font-medium text-gray-900">{getCategoryLabel(ticket.category)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Dibuat</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(ticket.createdAt)}</p>
              </div>

              {ticket.lastReplyAt && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Balasan Terakhir</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(ticket.lastReplyAt)}</p>
                </div>
              )}

              {ticket.resolvedAt && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Selesai</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(ticket.resolvedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{ticket.subject}</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[500px]">
              {/* Original Message */}
              <div className="p-4 bg-brand-50 rounded-xl border border-brand-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Anda</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatDate(ticket.createdAt)}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap pl-10">{ticket.description}</p>
              </div>

              {/* Replies */}
              {ticket.support_messages.map((msg) => {
                const isAdmin = msg.adminId && !msg.clientId
                return (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-xl ${
                      isAdmin
                        ? 'bg-purple-50 border border-purple-100'
                        : 'bg-brand-50 border border-brand-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isAdmin ? 'bg-purple-500' : 'bg-brand-500'
                      }`}>
                        {isAdmin ? (
                          <Headphones className="w-4 h-4 text-white" />
                        ) : (
                          <User className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">
                          {isAdmin ? 'Support Team' : (msg.client?.name || 'Anda')}
                        </span>
                        {isAdmin && (
                          <span className="ml-2 px-2 py-0.5 rounded text-xs bg-purple-200 text-purple-800">
                            Support
                          </span>
                        )}
                        <span className="text-xs text-gray-500 ml-2">
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap pl-10">{msg.message}</p>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input */}
            {isClosed ? (
              <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
                <Clock className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Tiket ini sudah ditutup. Jika masih ada pertanyaan, silakan buat tiket baru.
                </p>
              </div>
            ) : (
              <div className="p-4 border-t border-gray-100 space-y-3">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Tulis balasan Anda..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none min-h-[100px]"
                />
                <div className="flex justify-end">
                  <button
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Kirim Balasan
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ClientDashboardLayout>
  )
}
