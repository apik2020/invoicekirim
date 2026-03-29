'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppSession } from '@/hooks/useAppSession'
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
  MessageCircle,
  DollarSign,
  Calendar,
  X,
  Lock,
  Crown,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DashboardLayout } from '@/components/DashboardLayout'
import { MessageBox } from '@/components/ui/MessageBox'
import { useMessageBox } from '@/hooks/useMessageBox'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { cn } from '@/lib/utils'
import type { BrandingSettings } from '@/lib/branding'

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
  paymentMethod: string | null
  paymentNotes: string | null
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
  const { status } = useAppSession()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const messageBox = useMessageBox()

  // Branding state
  const [branding, setBranding] = useState<BrandingSettings | null>(null)
  const { hasAccess: hasBrandingAccess } = useFeatureAccess('branding')

  // 🔒 Feature access check for email sending
  const { hasAccess: canSendEmail, isLoading: emailCheckLoading, showUpgradeModal } = useFeatureAccess('EMAIL_SEND')

  // Payment confirmation modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'TRANSFER',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentNotes: '',
  })
  const [processingPayment, setProcessingPayment] = useState(false)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: invoice ? `Invoice-${invoice.invoiceNumber}` : 'Invoice',
  })

  // Get effective branding colors based on feature access
  const getEffectiveBranding = () => {
    const defaultBranding = {
      primaryColor: '#F97316',
      accentColor: '#276874',
      logoUrl: null,
    }

    if (!hasBrandingAccess || !branding) {
      return defaultBranding
    }

    return {
      primaryColor: branding.showColors ? branding.primaryColor : defaultBranding.primaryColor,
      accentColor: branding.showColors ? branding.accentColor || branding.primaryColor : defaultBranding.accentColor,
      logoUrl: branding.showLogo ? branding.logoUrl : null,
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && id) {
      fetchInvoice()
      fetchBranding()
    }
  }, [status, router, id])

  const fetchBranding = async () => {
    try {
      const res = await fetch('/api/branding')
      if (res.ok) {
        const data = await res.json()
        setBranding(data.branding)
      }
    } catch (error) {
      console.error('Error fetching branding:', error)
    }
  }

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${id}`)

      // Handle 401 Unauthorized - redirect to login
      if (res.status === 401) {
        router.push('/login')
        return
      }

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

      // Show success message based on status
      if (newStatus === 'PAID') {
        messageBox.showPaymentReceived(formatCurrency(invoice.total), invoice.invoiceNumber, 'Manual')
      } else if (newStatus === 'SENT') {
        messageBox.showSuccess({
          title: 'Status Diperbarui!',
          message: `Invoice #${invoice.invoiceNumber} telah ditandai sebagai terkirim.`,
        })
      }
    } catch (error: any) {
      messageBox.showWarning({
        title: 'Gagal Mengubah Status',
        message: error.message,
        confirmText: 'Mengerti',
        onConfirm: () => messageBox.close(),
      })
    } finally {
      setUpdating(false)
    }
  }

  // Payment confirmation handlers
  const handleOpenPaymentModal = () => {
    setPaymentData({
      paymentMethod: 'TRANSFER',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentNotes: '',
    })
    setShowPaymentModal(true)
  }

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false)
    setPaymentData({
      paymentMethod: 'TRANSFER',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentNotes: '',
    })
  }

  const handleConfirmPayment = async () => {
    if (!invoice) return

    setProcessingPayment(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAID',
          paymentMethod: paymentData.paymentMethod,
          paymentDate: paymentData.paymentDate,
          paymentNotes: paymentData.paymentNotes,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal mengubah status pembayaran')
      }

      // Refresh invoice data
      await fetchInvoice()

      // Close modal and show success
      handleClosePaymentModal()
      messageBox.showPaymentReceived(formatCurrency(invoice.total), invoice.invoiceNumber, getPaymentMethodLabel(paymentData.paymentMethod))
    } catch (error: any) {
      messageBox.showWarning({
        title: 'Gagal Mengkonfirmasi Pembayaran',
        message: error.message,
        confirmText: 'Mengerti',
        onConfirm: () => messageBox.close(),
      })
    } finally {
      setProcessingPayment(false)
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      TRANSFER: 'Transfer Bank',
      CASH: 'Tunai',
      EWALLET: 'E-Wallet',
      QRIS: 'QRIS',
      OTHER: 'Lainnya',
    }
    return labels[method] || method
  }

  const handleDelete = async () => {
    if (!invoice) return
    if (invoice.status !== 'DRAFT') {
      messageBox.showWarning({
        title: 'Tidak Dapat Menghapus',
        message: 'Hanya invoice dengan status Draft yang dapat dihapus.',
        confirmText: 'Mengerti',
        onConfirm: () => messageBox.close(),
      })
      return
    }

    messageBox.showDelete({
      title: 'Hapus Invoice?',
      message: (
        <div className="space-y-2">
          <p>
            Anda akan menghapus invoice <span className="font-semibold text-text-primary">#{invoice.invoiceNumber}</span>
          </p>
          <p className="text-xs text-text-muted">
            Tindakan ini tidak dapat dibatalkan. Data invoice akan dihapus permanen.
          </p>
        </div>
      ),
      onConfirm: async () => {
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
          messageBox.showWarning({
            title: 'Gagal Menghapus',
            message: error.message,
            confirmText: 'Mengerti',
            onConfirm: () => messageBox.close(),
          })
        } finally {
          setDeleting(false)
        }
      },
    })
  }

  const handleWhatsApp = () => {
    if (!invoice) return

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const invoiceUrl = `${baseUrl}/invoice/${invoice.accessToken}`

    const message = `*INVOICE ${invoice.invoiceNumber}*

Halo ${invoice.clientName},

${invoice.companyName} telah mengirimkan invoice kepada Anda. Berikut detail invoice:

💰 *Total:* ${formatCurrency(invoice.total)}
📅 *Jatuh Tempo:* ${invoice.dueDate ? formatDate(invoice.dueDate) : '-'}

📄 Lihat Invoice:
${invoiceUrl}

Terima kasih!`

    const encoded = encodeURIComponent(message)

    // Try to get phone number if available
    if (invoice.clientPhone) {
      // Clean phone number (remove spaces, dashes, etc.)
      const cleanPhone = invoice.clientPhone.replace(/[\s\-\(\)]/g, '')
      // Add country code if not present
      const phoneWithCode = cleanPhone.startsWith('+') ? cleanPhone.substring(1) :
                            cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) :
                            cleanPhone
      window.open(`https://wa.me/${phoneWithCode}?text=${encoded}`, '_blank')
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank')
    }
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
        // Get effective branding colors
        const effectiveBranding = getEffectiveBranding()
        const primaryColor = effectiveBranding.primaryColor
        const accentColor = effectiveBranding.accentColor

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
                ${effectiveBranding.logoUrl ? `
                  <div style="margin-bottom: 12px;">
                    <img src="${effectiveBranding.logoUrl}" alt="Logo" style="max-width: 120px; max-height: 48px; object-fit: contain;" />
                  </div>
                ` : ''}
                <h1 style="font-size: 24px; font-weight: bold; color: #333333; margin: 0 0 8px 0;">${invoice.companyName}</h1>
                <p style="font-size: 14px; color: #333333; margin: 0;">${invoice.companyEmail}</p>
                ${invoice.companyPhone ? `<p style="font-size: 14px; color: #333333; margin: 0;">${invoice.companyPhone}</p>` : ''}
                ${invoice.companyAddress ? `<p style="font-size: 14px; color: #333333; margin: 0;">${invoice.companyAddress}</p>` : ''}
              </div>
              <div style="text-align: right;">
                <p style="font-size: 12px; color: #333333; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Invoice</p>
                <p style="font-size: 20px; font-weight: bold; color: ${accentColor}; margin: 8px 0 0 0;">${invoice.invoiceNumber}</p>
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
                  <tr style="border-bottom: 2px solid ${primaryColor};">
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
                <div style="display: flex; justify-content: space-between; padding: 16px 0; border-top: 2px solid ${primaryColor}; margin-top: 16px; font-size: 24px; font-weight: bold; color: ${primaryColor};">
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
                ${effectiveBranding.logoUrl
                  ? `Invoice ini dikirim oleh ${invoice.companyName}`
                  : `Invoice dibuat dengan <a href="https://invoicekirim.com" style="color: ${accentColor}; text-decoration: none; font-weight: 600;">InvoiceKirim</a>`
                }
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

      messageBox.showEmailSent(invoice.clientEmail, 'reminder')
    } catch (error: any) {
      messageBox.showWarning({
        title: 'Gagal Mengirim Reminder',
        message: error.message,
        confirmText: 'Mengerti',
        onConfirm: () => messageBox.close(),
      })
    } finally {
      setSendingReminder(false)
    }
  }

  const handleSendEmail = async () => {
    if (!invoice) return

    // 🔒 Check feature access before sending
    if (!canSendEmail) {
      showUpgradeModal()
      return
    }

    setSendingEmail(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
      })

      if (!res.ok) {
        const errorData = await res.json()

        // Handle feature locked response
        if (errorData.error === 'FEATURE_LOCKED') {
          setSendingEmail(false)
          // Redirect to checkout
          window.location.href = errorData.upgradeUrl || '/checkout'
          return
        }

        throw new Error(errorData.error || 'Gagal mengirim invoice')
      }

      // Refresh invoice data to get updated status
      await fetchInvoice()

      messageBox.showInvoiceSent(invoice.invoiceNumber, invoice.clientName, invoice.clientEmail)
    } catch (error: any) {
      messageBox.showWarning({
        title: 'Gagal Mengirim Invoice',
        message: error.message,
        confirmText: 'Mengerti',
        onConfirm: () => messageBox.close(),
      })
    } finally {
      setSendingEmail(false)
    }
  }

  const getStatusBadge = (status: Invoice['status']) => {
    const styles: Record<string, string> = {
      DRAFT: 'badge-draft',
      SENT: 'badge-sent',
      PAID: 'badge-paid',
      OVERDUE: 'badge-overdue',
      CANCELED: 'bg-gray-100 text-gray-600 line-through',
    }

    const labels = {
      DRAFT: 'Draft',
      SENT: 'Terkirim',
      PAID: 'Lunas',
      OVERDUE: 'Terlambat',
      CANCELED: 'Dibatalkan',
    }

    return (
      <span className={cn('badge', styles[status] || styles.DRAFT)}>
        {labels[status] || status}
      </span>
    )
  }

  const getStatusStamp = (status: Invoice['status']) => {
    const effectiveBranding = getEffectiveBranding()

    const stamps = {
      DRAFT: {
        text: 'DRAFT',
        color: 'border-gray-400 text-text-muted',
        bgColor: 'bg-gray-50',
      },
      SENT: {
        text: 'TERKIRIM',
        color: 'border-secondary-500 text-secondary-600',
        bgColor: 'bg-secondary-50',
      },
      PAID: {
        text: 'LUNAS',
        color: 'border-success-500 text-success-600',
        bgColor: 'bg-success-50',
      },
      OVERDUE: {
        text: 'JATUH TEMPO',
        color: 'border-primary-500 text-primary-600',
        bgColor: 'bg-primary-50',
      },
      CANCELED: {
        text: 'BATAL',
        color: 'border-gray-400 text-text-muted',
        bgColor: 'bg-gray-50',
      },
    }

    const stamp = stamps[status] || stamps.DRAFT

    // For SENT status with branding
    if (status === 'SENT' && hasBrandingAccess) {
      return (
        <div className="relative">
          <div
            className="inline-flex items-center justify-center px-6 py-3 border-4 rounded-lg transform -rotate-12 shadow-sm"
            style={{
              fontFamily: 'system-ui, sans-serif',
              borderColor: effectiveBranding.primaryColor,
              color: effectiveBranding.primaryColor,
              backgroundColor: effectiveBranding.primaryColor + '1A', // 10% opacity
            }}
          >
            <span className="text-xl font-black tracking-widest uppercase">
              {stamp.text}
            </span>
          </div>
        </div>
      )
    }

    return (
      <div className="relative">
        <div
          className={cn(
            'inline-flex items-center justify-center px-6 py-3 border-4 rounded-lg transform -rotate-12 shadow-sm',
            stamp.color,
            stamp.bgColor
          )}
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          <span className="text-xl font-black tracking-widest uppercase">
            {stamp.text}
          </span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <DashboardLayout title="Detail Invoice" showBackButton backHref="/dashboard/invoices">
        <div className="flex items-center justify-center py-20">
          <div className="text-center animate-fade-in">
            <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Memuat invoice...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!invoice) {
    return (
      <DashboardLayout title="Detail Invoice" showBackButton backHref="/dashboard/invoices">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-text-muted" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Invoice tidak ditemukan
          </h2>
          <Link
            href="/dashboard/invoices"
            className="text-brand-500 font-semibold hover:text-brand-600 transition-colors"
          >
            Kembali ke daftar invoice
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Detail Invoice"
      showBackButton
      backHref="/dashboard/invoices"
      actions={
        <>
          <button
            onClick={handleDownloadPDF}
            disabled={generatingPDF}
            className="p-2.5 text-text-secondary rounded-xl btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download PDF"
          >
            {generatingPDF ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
          </button>
          <button
            onClick={handlePrint}
            className="p-2.5 text-text-secondary rounded-xl btn-secondary"
            title="Print"
          >
            <Printer size={20} />
          </button>
          {invoice.status === 'DRAFT' && (
            <>
              <Link
                href={`/dashboard/invoices/${invoice.id}/edit`}
                className="p-2.5 text-text-secondary rounded-xl btn-secondary"
                title="Edit"
              >
                <Edit size={20} />
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2.5 text-red-500 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Hapus"
              >
                {deleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
              </button>
            </>
          )}
        </>
      }
    >
      {/* Header */}
      <div className="mb-6 sm:mb-8 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          {getStatusBadge(invoice.status)}
        </div>

            {/* Action Buttons by Status */}
            <div className="flex flex-wrap gap-3">

            {invoice.status === 'DRAFT' && (
              <>
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-white font-bold rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {sendingEmail ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {sendingEmail ? 'Mengirim...' : 'Kirim Invoice'}
                </button>
                <button
                  onClick={() => handleStatusUpdate('SENT')}
                  disabled={updating}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-text-secondary font-bold rounded-xl btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {updating ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  {updating ? 'Memproses...' : 'Tandai Terkirim'}
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-white font-bold rounded-xl transition-colors text-sm"
                  style={{
                    background: 'linear-gradient(145deg, #25D366, #128C7E)',
                  }}
                >
                  <MessageCircle size={18} />
                  <span className="hidden sm:inline">Kirim via WhatsApp</span>
                  <span className="sm:hidden">WhatsApp</span>
                </button>
                <Link
                  href={`/dashboard/invoices/${invoice.id}/edit`}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-text-secondary font-bold rounded-xl btn-secondary text-sm"
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
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-white font-bold rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {sendingEmail ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {sendingEmail ? 'Mengirim...' : 'Kirim Ulang'}
                </button>
                <button
                  onClick={handleOpenPaymentModal}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-white font-bold rounded-xl bg-success-500 hover:bg-success-600 transition-colors text-sm"
                >
                  <DollarSign size={18} />
                  Tandai Lunas
                </button>
                <button
                  onClick={handleSendReminder}
                  disabled={sendingReminder}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-primary-600 font-bold rounded-xl border-2 border-primary-200 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {sendingReminder ? <Loader2 size={18} className="animate-spin" /> : <Bell size={18} />}
                  {sendingReminder ? 'Mengirim...' : 'Kirim Reminder'}
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-white font-bold rounded-xl transition-colors text-sm"
                  style={{
                    background: 'linear-gradient(145deg, #25D366, #128C7E)',
                  }}
                >
                  <MessageCircle size={18} />
                  <span className="hidden sm:inline">Kirim via WhatsApp</span>
                  <span className="sm:hidden">WhatsApp</span>
                </button>
              </>
            )}

            {invoice.status === 'OVERDUE' && (
              <>
                <button
                  onClick={handleOpenPaymentModal}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-white font-bold rounded-xl bg-success-500 hover:bg-success-600 transition-colors text-sm"
                >
                  <DollarSign size={18} />
                  Tandai Lunas
                </button>
                <button
                  onClick={handleSendReminder}
                  disabled={sendingReminder}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-primary-600 font-bold rounded-xl border-2 border-primary-200 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {sendingReminder ? <Loader2 size={18} className="animate-spin" /> : <Bell size={18} />}
                  {sendingReminder ? 'Mengirim...' : 'Kirim Reminder'}
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-white font-bold rounded-xl transition-colors text-sm"
                  style={{
                    background: 'linear-gradient(145deg, #25D366, #128C7E)',
                  }}
                >
                  <MessageCircle size={18} />
                  <span className="hidden sm:inline">Kirim via WhatsApp</span>
                  <span className="sm:hidden">WhatsApp</span>
                </button>
              </>
            )}

            {invoice.status === 'PAID' && invoice.paidAt && (
              <div className="w-full">
                <div className="p-4 rounded-xl bg-success-50 border border-success-200 mb-3">
                  <p className="font-bold text-success-700 text-center">
                    Invoice ini telah dibayar pada {formatDate(invoice.paidAt)}
                  </p>
                  {invoice.paymentMethod && (
                    <p className="text-sm text-success-600 text-center mt-1">
                      Metode: {getPaymentMethodLabel(invoice.paymentMethod)}
                    </p>
                  )}
                  {invoice.paymentNotes && (
                    <p className="text-sm text-text-secondary text-center mt-1">
                      {invoice.paymentNotes}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition-colors w-full justify-center"
                  style={{
                    background: 'linear-gradient(145deg, #25D366, #128C7E)',
                  }}
                >
                  <MessageCircle size={18} />
                  Kirim via WhatsApp
                </button>
              </div>
            )}
            </div>
          </div>

          {/* Invoice Card */}
          <div ref={printRef} id="invoice-card" className="card p-6 sm:p-8 md:p-10 relative animate-fade-in-up animation-delay-100">
            {/* Status Stamp */}
            <div className="absolute top-6 right-6 sm:top-8 sm:right-8 md:top-10 md:right-10 z-10">
              {getStatusStamp(invoice.status)}
            </div>

            {/* Header */}
            <div className="flex justify-between items-start mb-8 pb-8 border-b border-gray-200">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  {getEffectiveBranding().logoUrl ? (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-surface-light">
                      <img
                        src={getEffectiveBranding().logoUrl!}
                        alt="Logo"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: getEffectiveBranding().primaryColor }}
                    >
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div>
                    <h1 className="font-bold text-xl text-text-primary">
                      {invoice.companyName}
                    </h1>
                    <p className="text-sm text-text-secondary">{invoice.companyEmail}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Title */}
            <div className="mb-8">
              <h2
                className="text-3xl font-extrabold tracking-tight mb-2"
                style={{ color: getEffectiveBranding().accentColor }}
              >
                INVOICE
              </h2>
              <p className="text-text-secondary font-mono">{invoice.invoiceNumber}</p>
            </div>

            {/* Bill To */}
            <div className="mb-8">
              <h3 className="font-bold text-text-primary mb-4 text-sm uppercase tracking-wide text-text-secondary">
                Kepada:
              </h3>
              <div className="bg-surface-light rounded-xl p-6">
                <p className="font-bold text-text-primary text-lg mb-2">
                  {invoice.clientName}
                </p>
                <p className="text-text-secondary">{invoice.clientEmail}</p>
                {invoice.clientPhone && (
                  <p className="text-text-secondary">{invoice.clientPhone}</p>
                )}
                {invoice.clientAddress && (
                  <p className="text-text-secondary whitespace-pre-line">{invoice.clientAddress}</p>
                )}
              </div>
            </div>

            {/* From Section */}
            <div className="mb-8">
              <h3 className="font-bold text-text-primary mb-4 text-sm uppercase tracking-wide text-text-secondary">
                Dari:
              </h3>
              <div className="bg-surface-light rounded-xl p-6">
                <p className="font-bold text-text-primary text-lg mb-1">
                  {invoice.companyName}
                </p>
                <p className="text-text-secondary">{invoice.companyEmail}</p>
                {invoice.companyPhone && (
                  <p className="text-text-secondary">{invoice.companyPhone}</p>
                )}
                {invoice.companyAddress && (
                  <p className="text-text-secondary whitespace-pre-line">{invoice.companyAddress}</p>
                )}
              </div>
            </div>

            {/* Invoice Info */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              <div>
                <span className="text-text-secondary text-sm">Tanggal</span>
                <p className="font-semibold text-text-primary mt-1">
                  {formatDate(invoice.date)}
                </p>
              </div>
              {invoice.dueDate && (
                <div>
                  <span className="text-text-secondary text-sm">Jatuh Tempo</span>
                  <p className="font-semibold text-text-primary mt-1">
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <h3 className="font-bold text-text-primary mb-4 text-sm uppercase tracking-wide text-text-secondary">
                Item Invoice
              </h3>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-light">
                      <th className="text-left py-4 px-4 sm:px-6 font-bold text-text-primary text-sm">
                        Deskripsi
                      </th>
                      <th className="text-center py-4 px-4 sm:px-6 font-bold text-text-primary text-sm">
                        Qty
                      </th>
                      <th className="text-right py-4 px-4 sm:px-6 font-bold text-text-primary text-sm">
                        Harga
                      </th>
                      <th className="text-right py-4 px-4 sm:px-6 font-bold text-text-primary text-sm">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(invoice.items || []).map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-4 px-4 sm:px-6 text-text-primary">
                          {item.description || '-'}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-center text-text-primary">
                          {item.quantity}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-right text-text-primary">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-right font-semibold text-text-primary">
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
                <div className="flex justify-between py-3 text-text-secondary">
                  <span>Subtotal</span>
                  <span className="font-semibold">
                    {formatCurrency(invoice.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between py-3 text-text-secondary">
                  <span>Pajak ({invoice.taxRate}%)</span>
                  <span className="font-semibold">
                    {formatCurrency(invoice.taxAmount)}
                  </span>
                </div>
                <div
                  className="flex justify-between py-4 border-t-2 text-2xl font-extrabold mt-4"
                  style={{ borderColor: getEffectiveBranding().primaryColor + '33', color: getEffectiveBranding().primaryColor }}
                >
                  <span>Total</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="border-t border-gray-200 pt-8">
                <h3 className="font-bold text-text-primary mb-3 text-sm uppercase tracking-wide text-text-secondary">
                  Catatan
                </h3>
                <p className="text-text-secondary whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-text-muted">
                Generated by InvoiceKirim - Invoice Generator untuk Freelancer Indonesia
              </p>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center no-print animate-fade-in-up animation-delay-200">
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
                  className="flex items-center gap-2 px-6 py-3 text-text-secondary font-bold rounded-xl btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  {updating ? 'Memproses...' : 'Tandai Terkirim'}
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition-colors"
                  style={{
                    background: 'linear-gradient(145deg, #25D366, #128C7E)',
                  }}
                >
                  <MessageCircle size={18} />
                  Kirim via WhatsApp
                </button>
                <Link
                  href={`/dashboard/invoices/${invoice.id}/edit`}
                  className="flex items-center gap-2 px-6 py-3 text-text-secondary font-bold rounded-xl btn-secondary"
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
                  onClick={handleOpenPaymentModal}
                  className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl bg-success-500 hover:bg-success-600 transition-colors"
                >
                  <DollarSign size={18} />
                  Tandai Lunas
                </button>
                <button
                  onClick={handleSendReminder}
                  disabled={sendingReminder}
                  className="flex items-center gap-2 px-6 py-3 text-primary-600 font-bold rounded-xl border-2 border-primary-200 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <MessageCircle size={18} />
                  Kirim via WhatsApp
                </button>
              </>
            )}
            {invoice.status === 'OVERDUE' && (
              <>
                <button
                  onClick={handleOpenPaymentModal}
                  className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl bg-success-500 hover:bg-success-600 transition-colors"
                >
                  <DollarSign size={18} />
                  Tandai Lunas
                </button>
                <button
                  onClick={handleSendReminder}
                  disabled={sendingReminder}
                  className="flex items-center gap-2 px-6 py-3 text-primary-600 font-bold rounded-xl border-2 border-primary-200 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <MessageCircle size={18} />
                  Kirim via WhatsApp
                </button>
              </>
            )}
          </div>

      {/* Payment Confirmation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">Konfirmasi Pembayaran</h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Invoice #{invoice?.invoiceNumber} - {invoice ? formatCurrency(invoice.total) : ''}
                  </p>
                </div>
                <button
                  onClick={handleClosePaymentModal}
                  className="p-2 text-text-muted hover:text-text-primary rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Payment Method */}
              <div>
                <label className="block text-sm font-bold text-text-primary mb-2">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-text-primary focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 transition-all"
                >
                  <option value="TRANSFER">Transfer Bank</option>
                  <option value="CASH">Tunai</option>
                  <option value="EWALLET">E-Wallet (GoPay, OVO, Dana)</option>
                  <option value="QRIS">QRIS</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-bold text-text-primary mb-2">
                  Tanggal Pembayaran
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="date"
                    value={paymentData.paymentDate}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 text-text-primary focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 transition-all"
                  />
                </div>
              </div>

              {/* Payment Notes */}
              <div>
                <label className="block text-sm font-bold text-text-primary mb-2">
                  Catatan Pembayaran (Opsional)
                </label>
                <textarea
                  value={paymentData.paymentNotes}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentNotes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 transition-all resize-none"
                  placeholder="Contoh: Transfer dari BCA ke Mandiri"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={handleClosePaymentModal}
                className="flex-1 px-4 py-3 text-text-secondary font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={processingPayment}
                className="flex-1 px-4 py-3 text-white font-bold rounded-xl bg-success-500 hover:bg-success-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processingPayment ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    <span>Konfirmasi Lunas</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MessageBox for notifications */}
      <MessageBox
        open={messageBox.state.open}
        onClose={messageBox.close}
        title={messageBox.state.title}
        message={messageBox.state.message}
        variant={messageBox.state.variant}
        confirmText={messageBox.state.confirmText}
        cancelText={messageBox.state.cancelText}
        onConfirm={messageBox.state.onConfirm}
        onCancel={messageBox.state.onCancel}
        loading={messageBox.state.loading}
        icon={messageBox.state.icon}
      >
        {messageBox.state.children}
      </MessageBox>
    </DashboardLayout>
  )
}
