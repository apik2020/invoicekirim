'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Loader2, Send, Clock, CheckCircle, User, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Message {
  id: string
  message: string
  isInternal: boolean
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
  userId: string | null
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
  support_messages: Message[]
}

interface SupportTicketDetailModalProps {
  ticketId: string | null
  onClose: () => void
  onUpdate: () => void
}

export function SupportTicketDetailModal({ ticketId, onClose, onUpdate }: SupportTicketDetailModalProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [reply, setReply] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    if (!ticketId) return

    try {
      setLoading(true)
      const res = await fetch(`/api/admin/support/${ticketId}`)
      const data = await res.json()

      if (res.ok) {
        setTicket(data)
      }
    } catch (error) {
      console.error('Error fetching ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendReply = async () => {
    if (!ticketId || !reply.trim()) return

    try {
      setSending(true)
      const res = await fetch(`/api/admin/support/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: reply.trim(),
          isInternal,
        }),
      })

      if (res.ok) {
        setReply('')
        setIsInternal(false)
        fetchTicket()
        onUpdate()
      }
    } catch (error) {
      console.error('Error sending reply:', error)
    } finally {
      setSending(false)
    }
  }

  const updateStatus = async (status: string) => {
    if (!ticketId) return

    try {
      setUpdatingStatus(true)
      const res = await fetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status }),
      })

      if (res.ok) {
        fetchTicket()
        onUpdate()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setUpdatingStatus(false)
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

    const style = styles[status] || styles.open

    return (
      <span className={`px-3 py-1 rounded-lg text-sm font-bold ${style.bg} ${style.text}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  if (!ticketId) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{ticket?.subject || 'Loading...'}</h2>
            <div className="flex items-center gap-3 mt-2">
              {ticket && getStatusBadge(ticket.status)}
              {ticket && (
                <>
                  {ticket.client ? (
                    <span className="text-sm text-gray-500">
                      <User className="w-4 h-4 inline mr-1" />
                      {ticket.client.name}
                      <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-teal-100 text-teal-700 font-medium">
                        CLIENT
                      </span>
                    </span>
                  ) : ticket.users ? (
                    <span className="text-sm text-gray-500">
                      <User className="w-4 h-4 inline mr-1" />
                      {ticket.users.name || ticket.users.email}
                    </span>
                  ) : null}
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : ticket ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Original Message */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {ticket.client?.name || ticket.users?.name || ticket.users?.email || 'Unknown'}
                    </span>
                    {ticket.client && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-teal-100 text-teal-700 font-medium">
                        CLIENT
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(ticket.createdAt)}
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {/* Replies */}
              {ticket.support_messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-xl ${
                    msg.isInternal
                      ? 'bg-yellow-50 border border-yellow-200'
                      : msg.adminId
                      ? 'bg-purple-50 border border-purple-200'
                      : msg.clientId
                      ? 'bg-teal-50 border border-teal-200'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {msg.client?.name || msg.users?.name || msg.users?.email || 'Admin'}
                      </span>
                      {msg.isInternal && (
                        <span className="px-2 py-0.5 rounded text-xs bg-yellow-200 text-yellow-800">
                          Internal Note
                        </span>
                      )}
                      {msg.adminId && !msg.isInternal && (
                        <span className="px-2 py-0.5 rounded text-xs bg-purple-200 text-purple-800">
                          Support
                        </span>
                      )}
                      {msg.clientId && (
                        <span className="px-2 py-0.5 rounded text-xs bg-teal-200 text-teal-800">
                          Client
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(msg.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 p-4 space-y-4">
              {/* Status Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Ubah Status:</span>
                {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                  <button
                    onClick={() => updateStatus('resolved')}
                    disabled={updatingStatus}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-sm hover:bg-green-200 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Resolved
                  </button>
                )}
                {ticket.status === 'resolved' && (
                  <button
                    onClick={() => updateStatus('closed')}
                    disabled={updatingStatus}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Close
                  </button>
                )}
                {ticket.status === 'closed' && (
                  <button
                    onClick={() => updateStatus('open')}
                    disabled={updatingStatus}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm hover:bg-blue-200 disabled:opacity-50"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Reopen
                  </button>
                )}
              </div>

              {/* Reply Input */}
              <div className="space-y-2">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Tulis balasan..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-brand-500 focus:outline-none min-h-[100px]"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-600">
                      Catatan internal (tidak terlihat user)
                    </span>
                  </label>
                  <button
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Kirim
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
