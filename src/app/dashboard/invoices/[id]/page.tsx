'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useReactToPrint } from 'react-to-print'
import {
  FileText,
  Edit,
  Trash2,
  Send,
  Download,
  Check,
  Loader2,
  Printer,
  Bell,
  Share2,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import DashboardHeader from '@/components/DashboardHeader'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  price: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  date: string
  dueDate: string | null
  accessToken?: string
  companyName: string
  companyEmail: string
  companyPhone: string | null
  companyAddress: string | null
  clientName: string
  clientEmail: string
  clientPhone: string | null
  clientAddress: string | null
  items: InvoiceItem[]
  notes: string | null
  taxRate: number
  subtotal: number
  taxAmount: number
  total: number
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELED'
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id } = use(params)
  const { data: session, status } = useSession()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [copied, setCopied] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: invoice ? `Invoice-${invoice.invoiceNumber}` : 'Invoice',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && id) {
      fetchInvoice()
    }
  }, [status, router, id])

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${id}`)
      if (!res.ok) throw new Error('Gagal mengambil invoice')

      const data = await res.json()
      setInvoice(data)
    } catch (error) {
      console.error('Error fetching invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: Invoice['status']) => {
    if (!invoice) return

    setUpdating(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal mengubah status')
      }

      // Refresh invoice data
      await fetchInvoice()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!invoice) return
    if (!confirm('Apakah Anda yakin ingin menghapus invoice ini?')) return
    if (invoice.status === 'PAID') {
      alert('Tidak dapat menghapus invoice yang sudah lunas')
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menghapus invoice')
      }

      router.push('/dashboard/invoices')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleWhatsApp = () => {
    if (!invoice) return

    const message = `*INVOICE - ${invoice.invoiceNumber}*

Dari: ${invoice.companyName}
Kepada: ${invoice.clientName}

Total: ${formatCurrency(invoice.total)}

Terima kasih!`

    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
  }

  const handleDownloadPDF = async () => {
    if (!invoice) return

    setGeneratingPDF(true)
    try {
      // Create a simple HTML structure with only hex colors
      const html2canvas = await import('html2canvas')
      const { jsPDF } = await import('jspdf')

      // Helper function to convert RGB to hex
      const rgbToHex = (r: number, g: number, b: number): string => {
        return '#' + [r, g, b].map(x => {
          const hex = x.toString(16)
          return hex.length === 1 ? '0' + hex : hex
        }).join('')
      }

      // Helper to safely get color as hex
      const getSafeColor = (colorStr: string): string => {
        // If already hex, return as is
        if (colorStr.startsWith('#')) return colorStr

        // Parse rgb/rgba
        const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        if (rgbMatch) {
          return rgbToHex(
            parseInt(rgbMatch[1]),
            parseInt(rgbMatch[2]),
            parseInt(rgbMatch[3])
          )
        }

        return '#000000' // fallback
      }

      // Build simple HTML string
      const buildInvoiceHTML = () => {
        const items = invoice.items.map(item => `
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 16px 8px; color: #333333;">${item.description || '-'}</td>
            <td style="padding: 16px 8px; text-align: center; color: #333333;">${item.quantity}</td>
            <td style="padding: 16px 8px; text-align: right; color: #333333;">${formatCurrency(item.price)}</td>
            <td style="padding: 16px 8px; text-align: right; color: #333333; font-weight: 600;">${formatCurrency(item.quantity * item.price)}</td>
          </tr>
        `).join('')

        return `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 48px; background: #FFFFFF; color: #333333;">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; padding-bottom: 32px; border-bottom: 2px solid #E2E8F0;">
              <div>
                <h1 style="font-size: 24px; font-weight: bold; color: #333333; margin: 0 0 8px 0;">${invoice.companyName}</h1>
                <p style="font-size: 14px; color: #333333; margin: 0;">${invoice.companyEmail}</p>
                ${invoice.companyPhone ? `<p style="font-size: 14px; color: #333333; margin: 0;">${invoice.companyPhone}</p>` : ''}
                ${invoice.companyAddress ? `<p style="font-size: 14px; color: #333333; margin: 0;">${invoice.companyAddress}</p>` : ''}
              </div>
              <div style="text-align: right;">
                <p style="font-size: 12px; color: #333333; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Invoice</p>
                <p style="font-size: 20px; font-weight: bold; color: #333333; margin: 8px 0 0 0;">${invoice.invoiceNumber}</p>
              </div>
            </div>

            <!-- Bill To -->
            <div style="margin-bottom: 40px;">
              <h3 style="font-size: 12px; color: #333333; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold;">Kepada:</h3>
              <div style="background: #F5F5F5; padding: 24px; border-radius: 12px;">
                <p style="font-size: 18px; font-weight: bold; color: #333333; margin: 0 0 8px 0;">${invoice.clientName}</p>
                <p style="font-size: 14px; color: #333333; margin: 0;">${invoice.clientEmail}</p>
                ${invoice.clientPhone ? `<p style="font-size: 14px; color: #333333; margin: 0;">${invoice.clientPhone}</p>` : ''}
                ${invoice.clientAddress ? `<p style="font-size: 14px; color: #333333; margin: 0;">${invoice.clientAddress}</p>` : ''}
              </div>
            </div>

            <!-- Dates -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 40px;">
              <div>
                <p style="font-size: 12px; color: #333333; margin: 0 0 4px 0;">Tanggal</p>
                <p style="font-size: 14px; font-weight: 600; color: #333333; margin: 0;">${formatDate(invoice.date)}</p>
              </div>
              ${invoice.dueDate ? `
              <div>
                <p style="font-size: 12px; color: #333333; margin: 0 0 4px 0;">Jatuh Tempo</p>
                <p style="font-size: 14px; font-weight: 600; color: #333333; margin: 0;">${formatDate(invoice.dueDate)}</p>
              </div>
              ` : ''}
            </div>

            <!-- Items Table -->
            <div style="margin-bottom: 40px;">
              <h3 style="font-size: 12px; color: #333333; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold;">Item Invoice</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #E2E8F0;">
                    <th style="padding: 16px 8px; text-align: left; font-weight: bold; color: #333333; font-size: 14px;">Deskripsi</th>
                    <th style="padding: 16px 8px; text-align: center; font-weight: bold; color: #333333; font-size: 14px;">Qty</th>
                    <th style="padding: 16px 8px; text-align: right; font-weight: bold; color: #333333; font-size: 14px;">Harga</th>
                    <th style="padding: 16px 8px; text-align: right; font-weight: bold; color: #333333; font-size: 14px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${items}
                </tbody>
              </table>
            </div>

            <!-- Totals -->
            <div style="display: flex; justify-content: flex-end;">
              <div style="width: 100%; max-width: 320px;">
                <div style="display: flex; justify-content: space-between; padding: 12px 0; color: #333333;">
                  <span>Subtotal</span>
                  <span style="font-weight: 600;">${formatCurrency(invoice.subtotal)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; color: #333333;">
                  <span>Pajak (${invoice.taxRate}%)</span>
                  <span style="font-weight: 600;">${formatCurrency(invoice.taxAmount)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 16px 0; border-top: 2px solid #E2E8F0; margin-top: 16px; font-size: 24px; font-weight: bold; color: #00D4C5;">
                  <span>Total</span>
                  <span>${formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            ${invoice.notes ? `
            <!-- Notes -->
            <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #E2E8F0;">
              <h3 style="font-size: 12px; color: #333333; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold;">Catatan</h3>
              <p style="font-size: 14px; color: #333333; margin: 0; white-space: pre-line;">${invoice.notes}</p>
            </div>
            ` : ''}

            <!-- Footer -->
            <div style="margin-top: 48px; padding-top: 32px; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="font-size: 12px; color: #333333; margin: 0;">
                Invoice dibuat dengan <a href="https://invoicekirim.com" style="color: #00D4C5; text-decoration: none; font-weight: 600;">InvoiceKirim</a>
              </p>
            </div>
          </div>
        `
      }

      // Create a hidden div with our HTML
      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.width = '800px'
      container.innerHTML = buildInvoiceHTML()
      document.body.appendChild(container)

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 100))

      // Capture with html2canvas
      const canvas = await html2canvas.default(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
      })

      // Remove container
      document.body.removeChild(container)

      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF('p', 'mm', 'a4')

      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`invoice-${invoice.invoiceNumber}.pdf`)
    } catch (error) {
      console.error('Download PDF error:', error)
      alert('Gagal download PDF: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setGeneratingPDF(false)
    }
  }

  const handleSendReminder = async () => {
    if (!invoice) return

    setSendingReminder(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/remind`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal mengirim reminder')
      }

      alert('Payment reminder berhasil dikirim ke ' + invoice.clientEmail)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSendingReminder(false)
    }
  }

  const handleSendEmail = async () => {
    if (!invoice) return

    setSendingEmail(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal mengirim invoice')
      }

      const data = await res.json()

      // Refresh invoice data to get updated status
      await fetchInvoice()

      alert(data.message || 'Invoice berhasil dikirim ke ' + invoice.clientEmail)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSendingEmail(false)
    }
  }

  const handleShareLink = async () => {
    if (!invoice?.accessToken) return

    const clientUrl = `${window.location.origin}/client/invoices/${invoice.accessToken}`

    try {
      await navigator.clipboard.writeText(clientUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = clientUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getStatusBadge = (status: Invoice['status']) => {
    const styles = {
      DRAFT: 'bg-gray-100 text-gray-700',
      SENT: 'bg-teal-100 text-teal-700',
      PAID: 'bg-green-light-100 text-teal-light-700',
      OVERDUE: 'bg-red-100 text-red-700',
      CANCELED: 'bg-gray-100 text-gray-700 line-through',
    }

    const labels = {
      DRAFT: 'Draft',
      SENT: 'Terkirim',
      PAID: 'Lunas',
      OVERDUE: 'Terlambat',
      CANCELED: 'Dibatalkan',
    }

    return (
      <span
        className={`px-4 py-2 rounded-xl text-sm font-bold ${
          styles[status] || styles.DRAFT
        }`}
      >
        {labels[status] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gray-900 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat invoice...</p>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Invoice tidak ditemukan
          </h2>
          <Link
            href="/dashboard/invoices"
            className="text-gray-900 font-bold hover:underline"
          >
            Kembali ke daftar invoice
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-fresh-bg print:bg-white">
      {/* Header */}
      <DashboardHeader
        title="Detail Invoice"
        showBackButton={true}
        backHref="/dashboard/invoices"
        actions={
          <>
            <button
              onClick={handleDownloadPDF}
              disabled={generatingPDF}
              className="p-2.5 text-gray-600 rounded-xl btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download PDF"
            >
              {generatingPDF ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
            </button>
            <button
              onClick={handlePrint}
              className="p-2.5 text-gray-600 rounded-xl btn-secondary"
              title="Print"
            >
              <Printer size={20} />
            </button>
            <button
              onClick={handleShareLink}
              className="p-2.5 text-gray-600 rounded-xl btn-secondary relative"
              title="Share Link"
            >
              {copied ? <Check size={20} className="text-teal-light" /> : <Share2 size={20} />}
            </button>
            {invoice.status === 'DRAFT' && (
              <Link
                href={`/dashboard/invoices/${invoice.id}/edit`}
                className="p-2.5 text-gray-600 rounded-xl btn-secondary"
                title="Edit"
              >
                <Edit size={20} />
              </Link>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting || invoice.status === 'PAID'}
              className="p-2.5 text-teal-light rounded-xl hover:bg-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Hapus"
            >
              {deleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
            </button>
          </>
        }
      />

      {/* Invoice Content */}
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Detail Invoice</h1>
              <p className="text-gray-600">
                Lihat dan kelola detail invoice {invoice.invoiceNumber}
              </p>
            </div>

            {/* Status & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {getStatusBadge(invoice.status)}

            {/* Action Buttons by Status */}
            {invoice.status === 'DRAFT' && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingEmail ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {sendingEmail ? 'Mengirim...' : 'Kirim Invoice'}
                </button>
                <button
                  onClick={() => handleStatusUpdate('SENT')}
                  disabled={updating}
                  className="flex items-center gap-2 px-6 py-3 text-gray-600 font-bold rounded-xl btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  {updating ? 'Memproses...' : 'Tandai Terkirim'}
                </button>
                <Link
                  href={`/dashboard/invoices/${invoice.id}/edit`}
                  className="flex items-center gap-2 px-6 py-3 text-gray-600 font-bold rounded-xl btn-secondary"
                >
                  <Edit size={18} />
                  Edit
                </Link>
              </div>
            )}

            {invoice.status === 'SENT' && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingEmail ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {sendingEmail ? 'Mengirim...' : 'Kirim Ulang'}
                </button>
                <button
                  onClick={() => handleStatusUpdate('PAID')}
                  disabled={updating}
                  className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl bg-green-light-500 hover:bg-green-light-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  {updating ? 'Memproses...' : 'Tandai Lunas'}
                </button>
                <button
                  onClick={handleSendReminder}
                  disabled={sendingReminder}
                  className="flex items-center gap-2 px-6 py-3 text-teal-light font-bold rounded-xl border-2 border-orange-200 hover:bg-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingReminder ? <Loader2 size={18} className="animate-spin" /> : <Bell size={18} />}
                  {sendingReminder ? 'Mengirim...' : 'Kirim Reminder'}
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition-colors"
                  style={{
                    background: 'linear-gradient(145deg, #25D366, #128C7E)',
                  }}
                >
                  <Send size={18} />
                  WhatsApp
                </button>
              </div>
            )}

            {invoice.status === 'OVERDUE' && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleStatusUpdate('PAID')}
                  disabled={updating}
                  className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl bg-green-light-500 hover:bg-green-light-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  {updating ? 'Memproses...' : 'Tandai Lunas'}
                </button>
                <button
                  onClick={handleSendReminder}
                  disabled={sendingReminder}
                  className="flex items-center gap-2 px-6 py-3 text-teal-light font-bold rounded-xl border-2 border-orange-200 hover:bg-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingReminder ? <Loader2 size={18} className="animate-spin" /> : <Bell size={18} />}
                  {sendingReminder ? 'Mengirim...' : 'Kirim Reminder'}
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition-colors"
                  style={{
                    background: 'linear-gradient(145deg, #25D366, #128C7E)',
                  }}
                >
                  <Send size={18} />
                  WhatsApp
                </button>
              </div>
            )}

            {invoice.status === 'PAID' && invoice.paidAt && (
              <div className="w-full text-center p-4 rounded-xl bg-green-light-50 border border-green-200">
                <p className="font-bold text-teal-light-700">
                  Invoice ini telah dibayar pada {formatDate(invoice.paidAt)}
                </p>
              </div>
            )}
            </div>
          </div>

          {/* Invoice Card */}
          <div ref={printRef} id="invoice-card" className="bg-white p-8 md:p-10 rounded-3xl shadow-lg">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 pb-8 border-b border-orange-200">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-charcoal flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-xl text-gray-900">
                      {invoice.companyName}
                    </h1>
                    <p className="text-sm text-gray-600">{invoice.companyEmail}</p>
                  </div>
                </div>
              </div>
              {getStatusBadge(invoice.status)}
            </div>

            {/* Invoice Title */}
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                INVOICE
              </h2>
              <p className="text-gray-600 font-mono">{invoice.invoiceNumber}</p>
            </div>

            {/* Bill To */}
            <div className="mb-8">
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide text-gray-600">
                Kepada:
              </h3>
              <div className="bg-gray rounded-xl p-6">
                <p className="font-bold text-gray-900 text-lg mb-2">
                  {invoice.clientName}
                </p>
                <p className="text-gray-600">{invoice.clientEmail}</p>
                {invoice.clientPhone && (
                  <p className="text-gray-600">{invoice.clientPhone}</p>
                )}
                {invoice.clientAddress && (
                  <p className="text-gray-600 whitespace-pre-line">{invoice.clientAddress}</p>
                )}
              </div>
            </div>

            {/* From Section */}
            <div className="mb-8">
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide text-gray-600">
                Dari:
              </h3>
              <div className="bg-gray rounded-xl p-6">
                <p className="font-bold text-gray-900 text-lg mb-1">
                  {invoice.companyName}
                </p>
                <p className="text-gray-600">{invoice.companyEmail}</p>
                {invoice.companyPhone && (
                  <p className="text-gray-600">{invoice.companyPhone}</p>
                )}
                {invoice.companyAddress && (
                  <p className="text-gray-600 whitespace-pre-line">{invoice.companyAddress}</p>
                )}
              </div>
            </div>

            {/* Invoice Info */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              <div>
                <span className="text-gray-600 text-sm">Tanggal</span>
                <p className="font-semibold text-gray-900 mt-1">
                  {formatDate(invoice.date)}
                </p>
              </div>
              {invoice.dueDate && (
                <div>
                  <span className="text-gray-600 text-sm">Jatuh Tempo</span>
                  <p className="font-semibold text-gray-900 mt-1">
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide text-gray-600">
                Item Invoice
              </h3>
              <div className="overflow-x-auto rounded-xl border border-orange-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray">
                      <th className="text-left py-4 px-6 font-bold text-gray-900">
                        Deskripsi
                      </th>
                      <th className="text-center py-4 px-6 font-bold text-gray-900">
                        Qty
                      </th>
                      <th className="text-right py-4 px-6 font-bold text-gray-900">
                        Harga
                      </th>
                      <th className="text-right py-4 px-6 font-bold text-gray-900">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-b border-orange-200">
                        <td className="py-4 px-6 text-gray-900">
                          {item.description || '-'}
                        </td>
                        <td className="py-4 px-6 text-center text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="py-4 px-6 text-right text-gray-900">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="py-4 px-6 text-right font-semibold text-gray-900">
                          {formatCurrency(item.quantity * item.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-full md:w-80">
                <div className="flex justify-between py-3 text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">
                    {formatCurrency(invoice.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between py-3 text-gray-600">
                  <span>Pajak ({invoice.taxRate}%)</span>
                  <span className="font-semibold">
                    {formatCurrency(invoice.taxAmount)}
                  </span>
                </div>
                <div className="flex justify-between py-4 border-t-2 border-orange-200 text-2xl font-extrabold text-gray-900 mt-4">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="border-t border-orange-200 pt-8">
                <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide text-gray-600">
                  Catatan
                </h3>
                <p className="text-gray-600 whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-orange-200 text-center">
              <p className="text-sm text-gray-600">
                Generated by InvoiceKirim - Invoice Generator untuk Freelancer Indonesia
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center no-print">
            {invoice.status === 'DRAFT' && (
              <>
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingEmail ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {sendingEmail ? 'Mengirim...' : 'Kirim Invoice'}
                </button>
                <button
                  onClick={() => handleStatusUpdate('SENT')}
                  disabled={updating}
                  className="flex items-center gap-2 px-6 py-3 text-gray-600 font-bold rounded-xl btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  {updating ? 'Memproses...' : 'Tandai Terkirim'}
                </button>
                <Link
                  href={`/dashboard/invoices/${invoice.id}/edit`}
                  className="flex items-center gap-2 px-6 py-3 text-gray-600 font-bold rounded-xl btn-secondary"
                >
                  <Edit size={18} />
                  Edit
                </Link>
              </>
            )}
            {invoice.status === 'SENT' && (
              <>
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingEmail ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {sendingEmail ? 'Mengirim...' : 'Kirim Ulang'}
                </button>
                <button
                  onClick={() => handleStatusUpdate('PAID')}
                  disabled={updating}
                  className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl bg-green-light-500 hover:bg-green-light-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  {updating ? 'Memproses...' : 'Tandai Lunas'}
                </button>
                <button
                  onClick={handleSendReminder}
                  disabled={sendingReminder}
                  className="flex items-center gap-2 px-6 py-3 text-teal-light font-bold rounded-xl border-2 border-orange-200 hover:bg-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingReminder ? <Loader2 size={18} className="animate-spin" /> : <Bell size={18} />}
                  {sendingReminder ? 'Mengirim...' : 'Kirim Reminder'}
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition-colors"
                  style={{
                    background: 'linear-gradient(145deg, #25D366, #128C7E)',
                  }}
                >
                  <Send size={18} />
                  WhatsApp
                </button>
              </>
            )}
            {invoice.status === 'OVERDUE' && (
              <>
                <button
                  onClick={() => handleStatusUpdate('PAID')}
                  disabled={updating}
                  className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl bg-green-light-500 hover:bg-green-light-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  {updating ? 'Memproses...' : 'Tandai Lunas'}
                </button>
                <button
                  onClick={handleSendReminder}
                  disabled={sendingReminder}
                  className="flex items-center gap-2 px-6 py-3 text-teal-light font-bold rounded-xl border-2 border-orange-200 hover:bg-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingReminder ? <Loader2 size={18} className="animate-spin" /> : <Bell size={18} />}
                  {sendingReminder ? 'Mengirim...' : 'Kirim Reminder'}
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition-colors"
                  style={{
                    background: 'linear-gradient(145deg, #25D366, #128C7E)',
                  }}
                >
                  <Send size={18} />
                  WhatsApp
                </button>
              </>
            )}
            {invoice.status === 'PAID' && invoice.paidAt && (
              <div className="w-full text-center p-4 rounded-xl bg-green-light-50 border border-green-200">
                <p className="font-bold text-teal-light-700">
                  Invoice ini telah dibayar pada {formatDate(invoice.paidAt)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
