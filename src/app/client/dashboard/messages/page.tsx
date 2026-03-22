'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MessageCircle,
  Loader2,
  Inbox,
  Send,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { ClientDashboardLayout } from '@/components/ClientDashboardLayout'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Message {
  id: string
  invoiceId: string
  senderType: 'client' | 'vendor'
  senderId: string
  senderName?: string
  message: string
  isRead: boolean
  createdAt: string
  attachments?: any
  invoice?: {
    invoiceNumber: string
    clientName: string
    companyName: string
    total: number
    status: string
    dueDate: string | null
    accessToken?: string
  }
}

interface Invoice {
  id: string
  invoiceNumber: string
  clientName: string
  companyName: string
  total: number
  status: string
  dueDate: string | null
  accessToken?: string
}

export default function ClientMessagesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [replyMessage, setReplyMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetchInvoices()
  }, [])

  useEffect(() => {
    if (selectedInvoice) {
      fetchMessages(selectedInvoice.id)
    }
  }, [selectedInvoice])

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/client/invoices')
      if (res.status === 401) {
        router.push('/client/auth/login')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices || [])
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/client/messages?invoiceId=${invoiceId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedInvoice) return
    setSending(true)
    try {
      const res = await fetch('/api/client/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          message: replyMessage,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [...messages, data.message])
        setReplyMessage('')
        setToast({ type: 'success', message: 'Pesan berhasil dikirim!' })
      }
    } catch (error) {
      console.error('Failed to send reply:', error)
      setToast({ type: 'error', message: 'Gagal mengirim pesan' })
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (messageId: string) => {
    try {
      const res = await fetch(`/api/client/messages?id=${messageId}`, { method: 'DELETE' })
      if (res.ok) {
        setMessages(messages.filter(m => m.id !== messageId))
        setToast({ type: 'success', message: 'Pesan berhasil dihapus' })
      }
    } catch (error) {
      console.error('Failed to delete message:', error)
      setToast({ type: 'error', message: 'Gagal menghapus pesan' })
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-700',
      SENT: 'bg-teal-100 text-teal-700',
      PAID: 'bg-green-100 text-green-700',
      OVERDUE: 'bg-red-100 text-red-700',
      CANCELED: 'bg-gray-100 text-gray-700',
    }
    const labels: Record<string, string> = {
      DRAFT: 'Draft',
      SENT: 'Tertunda',
      PAID: 'Lunas',
      OVERDUE: 'Terlambat',
      CANCELED: 'Dibatalkan',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.DRAFT}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <ClientDashboardLayout title="Pesan">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      </ClientDashboardLayout>
    )
  }

  return (
    <ClientDashboardLayout title="Pesan">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-4 font-bold">x</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Pilih Invoice</h3>
            </div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {invoices.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  Belum ada invoice
                </div>
              ) : (
                invoices.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedInvoice?.id === inv.id ? 'bg-brand-50 border-l-4 border-brand-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{inv.invoiceNumber}</p>
                        <p className="text-sm text-gray-500">{inv.companyName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(inv.total)}</p>
                        {getStatusBadge(inv.status)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Messages Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {!selectedInvoice ? (
              <div className="p-12 text-center">
                <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Pilih Invoice</h3>
                <p className="text-gray-500">Pilih invoice untuk melihat dan mengirim pesan</p>
              </div>
            ) : (
              <>
                {/* Invoice Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedInvoice.invoiceNumber}</h3>
                      <p className="text-sm text-gray-500">{selectedInvoice.companyName}</p>
                    </div>
                    <Link
                      href={`/invoice/${selectedInvoice.accessToken}`}
                      target="_blank"
                      className="text-sm text-brand-500 hover:text-brand-600"
                    >
                      Lihat Invoice
                    </Link>
                  </div>
                </div>

                {/* Messages List */}
                <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      Belum ada pesan
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <MessageCircle className="w-4 h-4 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {msg.senderType === 'client' ? 'Anda' : msg.senderName || 'Vendor'}
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-gray-400">{formatDate(msg.createdAt)}</p>
                                <button
                                  onClick={() => handleDelete(msg.id)}
                                  className="p-1 text-gray-400 hover:text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{msg.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply Form */}
                <div className="p-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Ketik pesan..."
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={sending || !replyMessage.trim()}
                      className="px-4 py-2 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ClientDashboardLayout>
  )
}
