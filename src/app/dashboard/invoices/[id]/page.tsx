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
  // Template fields
  settings?: {
    showClientInfo?: boolean
    showDiscount?: boolean
    showAdditionalDiscount?: boolean
    showTax?: boolean
    showSignature?: boolean
  } | null
  termsAndConditions?: string | null
  signatureUrl?: string | null
  signatoryName?: string | null
  signatoryTitle?: string | null
  discountType?: string | null
  discountValue?: number | null
  discountAmount?: number | null
  additionalDiscountType?: string | null
  additionalDiscountValue?: number | null
  additionalDiscountAmount?: number | null
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
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, id])

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

  const handleWhatsApp = async () => {
    if (!invoice) return

    // If client has a phone number, try OpenWA API first
    if (invoice.clientPhone) {
      setSendingWhatsApp(true)
      try {
        const res = await fetch(`/api/whatsapp/invoice/${invoice.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'invoice' }),
        })

        const data = await res.json()

        if (res.ok && data.success) {
          setSendingWhatsApp(false)
          showMessageBox({
            title: 'Berhasil!',
            message: `Invoice berhasil dikirim via WhatsApp ke ${invoice.clientPhone}`,
            type: 'success',
          })
          return
        }

        // OpenWA not configured or failed — fall through to wa.me
        console.warn('[WA] OpenWA failed, falling back to wa.me:', data.error)
      } catch (err) {
        console.warn('[WA] OpenWA error, falling back to wa.me:', err)
      }
      setSendingWhatsApp(false)
    }

    // Fallback: open wa.me link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const invoiceUrl = `${baseUrl}/invoice/${invoice.accessToken}`
    const paymentStatus = invoice.paidAt || invoice.status === 'PAID' ? 'LUNAS' : 'Belum Dibayar'

    const message = `*INVOICE ${invoice.invoiceNumber}*

Halo ${invoice.clientName},

${invoice.companyName} telah mengirimkan invoice kepada Anda. Berikut detail invoice:

💰 *Total:* ${formatCurrency(invoice.total)}
📅 *Jatuh Tempo:* ${invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
✅ *Status Pembayaran:* ${paymentStatus}

📄 Lihat Invoice:
${invoiceUrl}

Terima kasih!`

    const encoded = encodeURIComponent(message)

    if (invoice.clientPhone) {
      const cleanPhone = invoice.clientPhone.replace(/[\s\-\(\)]/g, '')
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

      // Convert image URL to base64 data URL via server proxy to avoid CORS issues
      const imageToDataUrl = async (url: string): Promise<string | null> => {
        // Method 1: Server-side proxy (bypasses CORS entirely)
        try {
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`
          const response = await fetch(proxyUrl)
          if (response.ok) {
            const { dataUrl } = await response.json()
            if (dataUrl) return dataUrl
          }
        } catch (e) {
          console.warn('[PDF] Proxy failed for', url, e)
        }

        // Method 2: Direct fetch with CORS
        try {
          const response = await fetch(url, { mode: 'cors' })
          if (response.ok) {
            const blob = await response.blob()
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve(reader.result as string)
              reader.onerror = () => reject(new Error('FileReader failed'))
              reader.readAsDataURL(blob)
            })
            if (dataUrl) return dataUrl
          }
        } catch (e) {
          console.warn('[PDF] Direct CORS fetch failed for', url, e)
        }

        // Method 3: Load image into canvas (may work if same-origin)
        try {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.src = url
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve()
            img.onerror = () => reject(new Error('Image load failed'))
            setTimeout(() => reject(new Error('Image load timeout')), 5000)
          })
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            return canvas.toDataURL('image/png')
          }
        } catch (e) {
          console.warn('[PDF] Canvas method failed for', url, e)
        }

        console.error('[PDF] All image conversion methods failed for', url)
        return null
      }

      // Pre-load images to base64
      const effectiveBranding = getEffectiveBranding()
      const logoDataUrl = effectiveBranding.logoUrl ? await imageToDataUrl(effectiveBranding.logoUrl) : null
      const signatureDataUrl = invoice.signatureUrl ? await imageToDataUrl(invoice.signatureUrl) : null

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

      // Build HTML matching the new A4 invoice design
      const buildInvoiceHTML = () => {
        const accentColor = effectiveBranding.accentColor

        const items = invoice.items.map((item, index) => `
          <tr style="border-bottom: 1px solid #E2E8F0; background-color: ${index % 2 !== 0 ? '#f8fafc' : 'transparent'};">
            <td style="padding: 10px 8px; color: #334155; font-size: 13px;">${item.description || '-'}</td>
            <td style="padding: 10px 8px; text-align: center; color: #334155; font-size: 13px;">${item.quantity}</td>
            <td style="padding: 10px 8px; text-align: right; color: #334155; font-size: 13px;">${formatCurrency(item.price)}</td>
            <td style="padding: 10px 8px; text-align: right; color: #1e293b; font-size: 13px; font-weight: 600;">${formatCurrency(item.quantity * item.price)}</td>
          </tr>
        `).join('')

        const statusBadge = invoice.status === 'PAID'
          ? `<span style="background: #22c55e; color: white; font-size: 10px; font-weight: 700; padding: 4px 12px; border-radius: 4px; text-transform: uppercase;">LUNAS</span>`
          : invoice.status === 'SENT'
          ? `<span style="background: #22c55e; color: white; font-size: 10px; font-weight: 700; padding: 4px 12px; border-radius: 4px; text-transform: uppercase;">TERKIRIM</span>`
          : invoice.status === 'OVERDUE'
          ? `<span style="background: #ef4444; color: white; font-size: 10px; font-weight: 700; padding: 4px 12px; border-radius: 4px; text-transform: uppercase;">JATUH TEMPO</span>`
          : invoice.status === 'CANCELED'
          ? `<span style="background: #94a3b8; color: white; font-size: 10px; font-weight: 700; padding: 4px 12px; border-radius: 4px; text-transform: uppercase;">BATAL</span>`
          : `<span style="background: #94a3b8; color: white; font-size: 10px; font-weight: 700; padding: 4px 12px; border-radius: 4px; text-transform: uppercase;">DRAFT</span>`

        const logoHtml = logoDataUrl
          ? `<div style="width: 106px; height: 68px; border: 1px solid #e2e8f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; background: #f8fafc; overflow: hidden;"><img src="${logoDataUrl}" alt="Logo" style="max-width: 100%; max-height: 100%; object-fit: contain; padding: 4px;" /></div>`
          : `<div style="width: 45px; height: 45px; border-radius: 6px; display: flex; align-items: center; justify-content: center; background-color: ${accentColor};"><span style="color: white; font-weight: bold; font-size: 18px;">${invoice.companyName?.charAt(0)?.toUpperCase() || 'I'}</span></div>`

        return `
          <div style="font-family: var(--font-inter), 'Inter', 'Arial', sans-serif; width: 794px; height: 1123px; margin: 0 auto; background: #FFFFFF; color: #333333;">
            <div style="display: flex; flex-direction: column; height: 100%; padding: 5mm 42px;">

              <!-- Header: Logo left, INVOICE + status right -->
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                <div>${logoHtml}</div>
                <div style="text-align: right;">
                  <h1 style="font-size: 42px; font-weight: 800; color: ${accentColor}; margin: 0; line-height: 1;">INVOICE</h1>
                  <p style="font-size: 13px; color: #64748b; margin: 4px 0 12px 0; font-family: monospace;">${invoice.invoiceNumber}</p>
                  ${statusBadge}
                </div>
              </div>

              <!-- Date Fields -->
              <div style="display: flex; gap: 24px; margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid #e2e8f0;">
                <div>
                  <span style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Tanggal</span>
                  <p style="font-size: 13px; font-weight: 600; color: #1e293b; margin: 3px 0 0 0;">${formatDate(invoice.date)}</p>
                </div>
                ${invoice.dueDate ? `
                <div>
                  <span style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Jatuh Tempo</span>
                  <p style="font-size: 13px; font-weight: 600; color: #1e293b; margin: 3px 0 0 0;">${formatDate(invoice.dueDate)}</p>
                </div>
                ` : ''}
              </div>

              <!-- DARI & KEPADA Side by Side -->
              <div style="display: flex; gap: 48px; margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid #e2e8f0;">
                <div style="flex: 1;">
                  <h3 style="font-size: 10px; font-weight: 700; color: ${accentColor}; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Dari:</h3>
                  <p style="font-size: 13px; font-weight: 700; color: #1e293b; margin: 0 0 3px 0;">${invoice.companyName}</p>
                  <p style="font-size: 12px; color: #475569; margin: 0 0 2px 0;">${invoice.companyEmail}</p>
                  ${invoice.companyPhone ? `<p style="font-size: 12px; color: #475569; margin: 0 0 2px 0;">${invoice.companyPhone}</p>` : ''}
                  ${invoice.companyAddress ? `<p style="font-size: 12px; color: #475569; margin: 0;">${invoice.companyAddress}</p>` : ''}
                </div>
                <div style="flex: 1; text-align: right;">
                  <h3 style="font-size: 10px; font-weight: 700; color: ${accentColor}; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Kepada:</h3>
                  <p style="font-size: 13px; font-weight: 700; color: #1e293b; margin: 0 0 3px 0;">${invoice.clientName}</p>
                  <p style="font-size: 12px; color: #475569; margin: 0 0 2px 0;">${invoice.clientEmail}</p>
                  ${invoice.clientPhone ? `<p style="font-size: 12px; color: #475569; margin: 0 0 2px 0;">${invoice.clientPhone}</p>` : ''}
                  ${invoice.clientAddress ? `<p style="font-size: 12px; color: #475569; margin: 0;">${invoice.clientAddress}</p>` : ''}
                </div>
              </div>

              <!-- Items Table -->
              <div style="margin-bottom: 18px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="border-bottom: 2px solid ${accentColor};">
                      <th style="padding: 10px 8px; text-align: left; font-weight: 700; color: ${accentColor}; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Deskripsi</th>
                      <th style="padding: 10px 8px; text-align: center; font-weight: 700; color: ${accentColor}; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                      <th style="padding: 10px 8px; text-align: right; font-weight: 700; color: ${accentColor}; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Harga</th>
                      <th style="padding: 10px 8px; text-align: right; font-weight: 700; color: ${accentColor}; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items}
                  </tbody>
                </table>
              </div>

              <!-- Totals + Notes Row -->
              <div style="display: flex; gap: 48px;">
                <!-- Notes Left -->
                <div style="flex: 1;">
                  ${invoice.notes ? `
                  <h3 style="font-size: 10px; font-weight: 700; color: ${accentColor}; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Catatan:</h3>
                  <div style="padding: 12px; border: 1px solid #e2e8f0; border-radius: 4px; background: #f8fafc; font-size: 11px; color: #475569; white-space: pre-line; min-height: 60px;">${invoice.notes}</div>
                  ` : ''}
                </div>

                <!-- Totals Right -->
                <div style="flex: 1; display: flex; justify-content: flex-end;">
                  <div style="width: 100%; max-width: 220px;">
                    <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                      <span style="font-size: 12px; color: #64748b;">Subtotal</span>
                      <span style="font-size: 12px; font-weight: 600; color: #1e293b;">${formatCurrency(invoice.subtotal)}</span>
                    </div>
                    ${invoice.discountAmount && invoice.discountAmount > 0 ? `
                    <div style="display: flex; justify-content: space-between; padding: 1mm 0;">
                      <span style="font-size: 10px; color: #64748b;">Diskon ${invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}</span>
                      <span style="font-size: 10px; font-weight: 600; color: #16a34a;">-${formatCurrency(invoice.discountAmount)}</span>
                    </div>
                    ` : ''}
                    ${invoice.additionalDiscountAmount && invoice.additionalDiscountAmount > 0 ? `
                    <div style="display: flex; justify-content: space-between; padding: 1mm 0;">
                      <span style="font-size: 10px; color: #64748b;">Diskon Tambahan ${invoice.additionalDiscountType === 'percentage' ? `(${invoice.additionalDiscountValue}%)` : ''}</span>
                      <span style="font-size: 10px; font-weight: 600; color: #16a34a;">-${formatCurrency(invoice.additionalDiscountAmount)}</span>
                    </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                      <span style="font-size: 12px; color: #64748b;">Pajak (${invoice.taxRate}%)</span>
                      <span style="font-size: 12px; font-weight: 600; color: #1e293b;">${formatCurrency(invoice.taxAmount)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; margin-top: 6px; border-top: 2px solid ${accentColor};">
                      <span style="font-size: 16px; font-weight: 800; color: ${accentColor};">TOTAL</span>
                      <span style="font-size: 16px; font-weight: 800; color: ${accentColor};">${formatCurrency(invoice.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Terms & Signature Row -->
              ${invoice.termsAndConditions || invoice.signatureUrl || invoice.signatoryName ? `
              <div style="display: flex; gap: 48px; margin-top: 4mm;">
                <div style="flex: 1;">
                  ${invoice.termsAndConditions ? `
                  <h3 style="font-size: 9px; font-weight: 700; color: ${accentColor}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2mm;">Syarat & Ketentuan:</h3>
                  <div style="padding: 2mm; border: 1px solid #e2e8f0; border-radius: 3px; background: #f8fafc; font-size: 8px; color: #475569; white-space: pre-line; min-height: 56px;">${invoice.termsAndConditions}</div>
                  ` : ''}
                </div>
                <div style="flex: 1; display: flex; justify-content: flex-end; align-items: flex-end;">
                  ${invoice.signatureUrl || invoice.signatoryName ? `
                  <div style="text-align: center;">
                    ${signatureDataUrl ? `<div style="margin-bottom: 1mm; padding-bottom: 1mm; border-bottom: 1px solid #94a3b8;"><img src="${signatureDataUrl}" alt="Tanda tangan" style="height: 56px; object-fit: contain; margin: 0 auto;" /></div>` : ''}
                    ${invoice.signatoryName ? `<p style="font-weight: 700; font-size: 10px; color: #1e293b;">${invoice.signatoryName}</p>` : ''}
                    ${invoice.signatoryTitle ? `<p style="font-size: 9px; color: #64748b;">${invoice.signatoryTitle}</p>` : ''}
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}

              <!-- Simple Footer -->
              <div style="margin-top: auto; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end;">
                <p style="font-size: 9px; color: #94a3b8;">Invoice ini dikirim oleh <strong style="color: ${accentColor};">${invoice.companyName}</strong></p>
                <p style="font-size: 8px; color: #cbd5e1;">NotaBener</p>
              </div>
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

      // Wait for fonts and rendering
      await document.fonts.ready
      await new Promise(resolve => setTimeout(resolve, 100))

      // Capture with html2canvas
      const canvas = await html2canvas.default(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
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
          window.location.href = errorData.upgradeUrl || '/dashboard/checkout'
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
              fontFamily: "var(--font-inter), 'Inter', 'Arial', sans-serif",
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
          style={{ fontFamily: "var(--font-inter), 'Inter', 'Arial', sans-serif" }}
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
            onClick={async () => { await document.fonts.ready; handlePrint() }}
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
                  disabled={sendingWhatsApp}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-white font-bold rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(145deg, #25D366, #128C7E)',
                  }}
                >
                  {sendingWhatsApp ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
                  <span className="hidden sm:inline">{sendingWhatsApp ? 'Mengirim...' : 'Kirim via WhatsApp'}</span>
                  <span className="sm:hidden">{sendingWhatsApp ? '...' : 'WhatsApp'}</span>
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
                  disabled={sendingWhatsApp}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-white font-bold rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(145deg, #25D366, #128C7E)',
                  }}
                >
                  {sendingWhatsApp ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
                  <span className="hidden sm:inline">{sendingWhatsApp ? 'Mengirim...' : 'Kirim via WhatsApp'}</span>
                  <span className="sm:hidden">{sendingWhatsApp ? '...' : 'WhatsApp'}</span>
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
                  disabled={sendingWhatsApp}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-white font-bold rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(145deg, #25D366, #128C7E)',
                  }}
                >
                  {sendingWhatsApp ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
                  <span className="hidden sm:inline">{sendingWhatsApp ? 'Mengirim...' : 'Kirim via WhatsApp'}</span>
                  <span className="sm:hidden">{sendingWhatsApp ? '...' : 'WhatsApp'}</span>
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
                  disabled={sendingWhatsApp}
                  className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition-colors w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(145deg, #25D366, #128C7E)',
                  }}
                >
                  {sendingWhatsApp ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
                  {sendingWhatsApp ? 'Mengirim...' : 'Kirim via WhatsApp'}
                </button>
              </div>
            )}
            </div>
          </div>

          {/* Invoice Card - A4 Full Page */}
          <div ref={printRef} id="invoice-card" className="bg-white shadow-2xl relative overflow-hidden animate-fade-in-up animation-delay-100" style={{ height: '297mm' }}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '5mm 16mm' }}>
                {/* Header: Logo left, INVOICE + status right */}
                <div className="flex justify-between items-start" style={{ marginBottom: '6mm' }}>
                  {/* Left: Logo */}
                  <div className="flex items-center gap-3">
                    {getEffectiveBranding().logoUrl ? (
                      <div
                        className="flex items-center justify-center border rounded overflow-hidden"
                        style={{
                          width: '28mm',
                          height: '18mm',
                          borderColor: '#e2e8f0',
                          backgroundColor: '#f8fafc',
                        }}
                      >
                        <img
                          src={getEffectiveBranding().logoUrl!}
                          alt="Logo"
                          className="max-w-full max-h-full object-contain p-1"
                        />
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-center rounded"
                        style={{
                          width: '12mm',
                          height: '12mm',
                          backgroundColor: getEffectiveBranding().accentColor,
                        }}
                      >
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Right: INVOICE title + number + status badge */}
                  <div className="text-right">
                    <h1
                      style={{
                        fontSize: '42px',
                        fontWeight: 800,
                        color: getEffectiveBranding().accentColor,
                        lineHeight: 1,
                        marginBottom: '2mm',
                        letterSpacing: '-0.5px',
                      }}
                    >
                      INVOICE
                    </h1>
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        fontFamily: 'monospace',
                        marginBottom: '3mm',
                      }}
                    >
                      {invoice.invoiceNumber}
                    </p>
                    {/* Status Badge */}
                    {(() => {
                      const badges: Record<string, { text: string; bg: string; color: string }> = {
                        DRAFT: { text: 'DRAFT', bg: '#94a3b8', color: '#ffffff' },
                        SENT: { text: 'TERKIRIM', bg: '#22c55e', color: '#ffffff' },
                        PAID: { text: 'LUNAS', bg: '#22c55e', color: '#ffffff' },
                        OVERDUE: { text: 'JATUH TEMPO', bg: '#ef4444', color: '#ffffff' },
                        CANCELED: { text: 'BATAL', bg: '#94a3b8', color: '#ffffff' },
                      }
                      const badge = badges[invoice.status] || badges.DRAFT
                      return (
                        <span
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.color,
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '4px 12px',
                            borderRadius: '4px',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {badge.text}
                        </span>
                      )
                    })()}
                  </div>
                </div>

                {/* Date Fields */}
                <div
                  className="flex gap-6"
                  style={{ marginBottom: '5mm', paddingBottom: '5mm', borderBottom: '1px solid #e2e8f0' }}
                >
                  <div>
                    <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Tanggal
                    </span>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b', marginTop: '1mm' }}>
                      {formatDate(invoice.date)}
                    </p>
                  </div>
                  {invoice.dueDate && (
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Jatuh Tempo
                      </span>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b', marginTop: '1mm' }}>
                        {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                  )}
                </div>

                {/* DARI & KEPADA - Side by Side */}
                <div
                  className="grid grid-cols-2 gap-6"
                  style={{ marginBottom: '5mm', paddingBottom: '5mm', borderBottom: '1px solid #e2e8f0' }}
                >
                  {/* DARI */}
                  <div>
                    <h3
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: getEffectiveBranding().accentColor,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '3mm',
                      }}
                    >
                      Dari:
                    </h3>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '1mm' }}>
                        {invoice.companyName}
                      </p>
                      <p style={{ fontSize: '11px', color: '#475569', marginBottom: '0.5mm' }}>{invoice.companyEmail}</p>
                      {invoice.companyPhone && (
                        <p style={{ fontSize: '11px', color: '#475569', marginBottom: '0.5mm' }}>{invoice.companyPhone}</p>
                      )}
                      {invoice.companyAddress && (
                        <p style={{ fontSize: '11px', color: '#475569', whiteSpace: 'pre-line' }}>{invoice.companyAddress}</p>
                      )}
                    </div>
                  </div>

                  {/* KEPADA */}
                  <div style={{ textAlign: 'right' }}>
                    <h3
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: getEffectiveBranding().accentColor,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '3mm',
                      }}
                    >
                      Kepada:
                    </h3>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '1mm' }}>
                        {invoice.clientName}
                      </p>
                      <p style={{ fontSize: '11px', color: '#475569', marginBottom: '0.5mm' }}>{invoice.clientEmail}</p>
                      {invoice.clientPhone && (
                        <p style={{ fontSize: '11px', color: '#475569', marginBottom: '0.5mm' }}>{invoice.clientPhone}</p>
                      )}
                      {invoice.clientAddress && (
                        <p style={{ fontSize: '11px', color: '#475569', whiteSpace: 'pre-line' }}>{invoice.clientAddress}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div style={{ marginBottom: '5mm' }}>
                  <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${getEffectiveBranding().accentColor}` }}>
                        <th
                          className="text-left"
                          style={{ padding: '3mm 2mm', fontWeight: 700, fontSize: '10px', color: getEffectiveBranding().accentColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        >
                          Deskripsi
                        </th>
                        <th
                          className="text-center"
                          style={{ padding: '3mm 2mm', fontWeight: 700, fontSize: '10px', color: getEffectiveBranding().accentColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        >
                          Qty
                        </th>
                        <th
                          className="text-right"
                          style={{ padding: '3mm 2mm', fontWeight: 700, fontSize: '10px', color: getEffectiveBranding().accentColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        >
                          Harga
                        </th>
                        <th
                          className="text-right"
                          style={{ padding: '3mm 2mm', fontWeight: 700, fontSize: '10px', color: getEffectiveBranding().accentColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        >
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(invoice.items || []).map((item, index) => (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom: '1px solid #e2e8f0',
                            backgroundColor: index % 2 === 0 ? 'transparent' : '#f8fafc',
                          }}
                        >
                          <td style={{ padding: '2.5mm 2mm', fontSize: '11px', color: '#334155' }}>
                            {item.description || '-'}
                          </td>
                          <td style={{ padding: '2.5mm 2mm', fontSize: '11px', color: '#334155', textAlign: 'center' }}>
                            {item.quantity}
                          </td>
                          <td style={{ padding: '2.5mm 2mm', fontSize: '11px', color: '#334155', textAlign: 'right' }}>
                            {formatCurrency(item.price)}
                          </td>
                          <td style={{ padding: '2.5mm 2mm', fontSize: '11px', color: '#1e293b', textAlign: 'right', fontWeight: 600 }}>
                            {formatCurrency(item.quantity * item.price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals + Notes Row */}
                <div className="grid grid-cols-2 gap-8">
                  {/* Notes - Left Side */}
                  <div>
                    {invoice.notes && (
                      <>
                        <h3
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: getEffectiveBranding().accentColor,
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '2mm',
                          }}
                        >
                          Catatan:
                        </h3>
                        <div
                          style={{
                            padding: '3mm',
                            border: '1px solid #e2e8f0',
                            borderRadius: '3px',
                            backgroundColor: '#f8fafc',
                            minHeight: '18mm',
                            fontSize: '10px',
                            color: '#475569',
                            whiteSpace: 'pre-line',
                          }}
                        >
                          {invoice.notes}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Totals - Right Side */}
                  <div className="flex justify-end">
                    <div style={{ width: '100%', maxWidth: '65mm' }}>
                      <div className="flex justify-between" style={{ padding: '1.5mm 0' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Subtotal</span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b' }}>
                          {formatCurrency(invoice.subtotal)}
                        </span>
                      </div>
                      {invoice.discountAmount && invoice.discountAmount > 0 && (
                        <div className="flex justify-between" style={{ padding: '1mm 0' }}>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>Diskon {invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}</span>
                          <span style={{ fontSize: '10px', fontWeight: 600, color: '#16a34a' }}>-{formatCurrency(invoice.discountAmount)}</span>
                        </div>
                      )}
                      {invoice.additionalDiscountAmount && invoice.additionalDiscountAmount > 0 && (
                        <div className="flex justify-between" style={{ padding: '1mm 0' }}>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>Diskon Tambahan {invoice.additionalDiscountType === 'percentage' ? `(${invoice.additionalDiscountValue}%)` : ''}</span>
                          <span style={{ fontSize: '10px', fontWeight: 600, color: '#16a34a' }}>-{formatCurrency(invoice.additionalDiscountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between" style={{ padding: '1.5mm 0' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Pajak ({invoice.taxRate}%)</span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b' }}>
                          {formatCurrency(invoice.taxAmount)}
                        </span>
                      </div>
                      <div
                        className="flex justify-between"
                        style={{ paddingTop: '3mm', marginTop: '2mm', borderTop: `2px solid ${getEffectiveBranding().accentColor}` }}
                      >
                        <span style={{ fontSize: '16px', fontWeight: 800, color: getEffectiveBranding().accentColor }}>
                          TOTAL
                        </span>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: getEffectiveBranding().accentColor }}>
                          {formatCurrency(invoice.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms & Signature Row */}
                {(invoice.termsAndConditions || invoice.signatureUrl || invoice.signatoryName) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      {invoice.termsAndConditions && (
                        <>
                          <h3
                            className="font-bold uppercase tracking-wider mb-1"
                            style={{ color: getEffectiveBranding().accentColor, fontSize: '9px' }}
                          >
                            Syarat & Ketentuan:
                          </h3>
                          <div
                            className="p-2 rounded whitespace-pre-line"
                            style={{
                              color: '#475569',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#f8fafc',
                              fontSize: '8px',
                              minHeight: '56px',
                            }}
                          >
                            {invoice.termsAndConditions}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex justify-end items-end">
                      {(invoice.signatureUrl || invoice.signatoryName) && (
                        <div className="text-center">
                          {invoice.signatureUrl && (
                            <div style={{ marginBottom: '1mm', paddingBottom: '1mm', borderBottom: '1px solid #94a3b8' }}>
                              <img src={invoice.signatureUrl} alt="Tanda tangan" className="h-14 object-contain mx-auto" />
                            </div>
                          )}
                          {invoice.signatoryName && <p style={{ fontWeight: 700, fontSize: '10px', color: '#1e293b' }}>{invoice.signatoryName}</p>}
                          {invoice.signatoryTitle && <p style={{ fontSize: '9px', color: '#64748b' }}>{invoice.signatoryTitle}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Simple Footer */}
                <div style={{ marginTop: 'auto', paddingTop: '4mm', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <p style={{ fontSize: '9px', color: '#94a3b8' }}>Invoice ini dikirim oleh <span style={{ fontWeight: 600, color: getEffectiveBranding().accentColor }}>{invoice.companyName}</span></p>
                  <p style={{ fontSize: '8px', color: '#cbd5e1' }}>NotaBener</p>
                </div>
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
                  disabled={sendingWhatsApp}
                  className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(145deg, #25D366, #128C7E)',
                  }}
                >
                  {sendingWhatsApp ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
                  {sendingWhatsApp ? 'Mengirim...' : 'Kirim via WhatsApp'}
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
                  disabled={sendingWhatsApp}
                  className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(145deg, #25D366, #128C7E)',
                  }}
                >
                  {sendingWhatsApp ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
                  {sendingWhatsApp ? 'Mengirim...' : 'Kirim via WhatsApp'}
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
                  disabled={sendingWhatsApp}
                  className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(145deg, #25D366, #128C7E)',
                  }}
                >
                  {sendingWhatsApp ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
                  {sendingWhatsApp ? 'Mengirim...' : 'Kirim via WhatsApp'}
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
