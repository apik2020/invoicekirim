'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { FileText, Download, Printer, Loader2, CreditCard, CheckCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

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
}

export default function ClientInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatingPDF, setGeneratingPDF] = useState(false)

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const { token } = await params
        const res = await fetch(`/api/client/invoices/${token}`)

        if (!res.ok) {
          if (res.status === 404) {
            setError('Invoice tidak ditemukan atau link sudah tidak valid.')
          } else if (res.status === 403) {
            setError('Invoice belum tersedia untuk dilihat.')
          } else {
            setError('Gagal mengambil invoice.')
          }
          return
        }

        const data = await res.json()
        setInvoice(data)
      } catch (err) {
        console.error('Error fetching invoice:', err)
        setError('Terjadi kesalahan saat memuat invoice.')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoice()
  }, [params])

  const handleDownloadPDF = async () => {
    if (!invoice) return

    setGeneratingPDF(true)
    try {
      const html2canvas = await import('html2canvas')
      const { jsPDF } = await import('jspdf')

      // Build simple HTML string with inline hex colors only
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
    } catch (err) {
      console.error('Download PDF error:', err)
      alert('Gagal download PDF: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setGeneratingPDF(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-dark animate-spin mx-auto mb-4" />
          <p className="text-slate">Memuat invoice...</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
          <FileText className="w-16 h-16 text-slate mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-dark mb-2">
            Invoice Tidak Ditemukan
          </h2>
          <p className="text-slate mb-6">
            {error || 'Invoice tidak ditemukan atau link sudah tidak valid.'}
          </p>
          <p className="text-sm text-slate">
            Silakan hubungi pengirim invoice untuk mendapatkan link yang valid.
          </p>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-slate-light-700',
      SENT: 'bg-teal-100 text-teal-700',
      PAID: 'bg-green-light-100 text-teal-light-700',
      OVERDUE: 'bg-red-100 text-red-700',
      CANCELED: 'bg-gray-100 text-slate-light-700 line-through',
    }

    const labels: Record<string, string> = {
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

  const isPaid = invoice.status === 'PAID'

  return (
    <div className="min-h-screen bg-gray">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-charcoal flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-dark text-lg">InvoiceKirim</h1>
                <p className="text-xs text-slate">Client Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={generatingPDF}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate rounded-xl btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingPDF ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate rounded-xl btn-secondary"
              >
                <Printer size={16} />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Invoice Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Status Banner */}
          {isPaid ? (
            <div className="mb-6 p-4 rounded-xl bg-green-light-50 border-2 border-green-200 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-teal-light-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-teal-light-800">
                  Invoice Ini Sudah Lunas
                </p>
                {invoice.paidAt && (
                  <p className="text-sm text-teal-light-600">
                  Dibayar pada {formatDate(invoice.paidAt)}
                </p>
                )}
              </div>
            </div>
          ) : invoice.status === 'OVERDUE' ? (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border-2 border-red-200">
              <p className="font-bold text-red-800">
                ⚠️ Invoice Sudah Jatuh Tempo
              </p>
              <p className="text-sm text-red-600 mt-1">
                Mohon segera lakukan pembayaran.
              </p>
            </div>
          ) : null}

          {/* Invoice Card */}
          <div id="invoice-card" className="bg-white p-8 md:p-12 rounded-3xl shadow-lg">
            {/* Invoice Header */}
            <div className="flex flex-col md:flex-row justify-between items-start mb-10 pb-8 border-b border-slate">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-14 h-14 rounded-xl bg-charcoal flex items-center justify-center">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-2xl text-dark tracking-tight">
                      {invoice.companyName}
                    </h1>
                    <p className="text-sm text-slate">{invoice.companyEmail}</p>
                  </div>
                </div>
              </div>
              <div className="text-left md:text-right mt-4 md:mt-0">
                {getStatusBadge(invoice.status)}
              </div>
            </div>

            {/* Invoice Title */}
            <div className="mb-10">
              <h2 className="text-4xl font-extrabold text-dark tracking-tight mb-2">
                INVOICE
              </h2>
              <p className="text-slate font-mono">{invoice.invoiceNumber}</p>
            </div>

            {/* Bill To */}
            <div className="mb-10">
              <h3 className="font-bold text-dark mb-4 text-sm uppercase tracking-wide text-slate">
                Kepada:
              </h3>
              <div className="bg-gray rounded-xl p-6">
                <p className="font-bold text-dark text-xl mb-2">
                  {invoice.clientName}
                </p>
                <p className="text-slate">{invoice.clientEmail}</p>
                {invoice.clientPhone && (
                  <p className="text-slate">{invoice.clientPhone}</p>
                )}
                {invoice.clientAddress && (
                  <p className="text-slate">{invoice.clientAddress}</p>
                )}
              </div>
            </div>

            {/* Invoice Info */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
              <div>
                <span className="text-slate text-sm">Tanggal</span>
                <p className="font-semibold text-dark mt-1">
                  {formatDate(invoice.date)}
                </p>
              </div>
              {invoice.dueDate && (
                <div>
                  <span className="text-slate text-sm">Jatuh Tempo</span>
                  <p className="font-semibold text-dark mt-1">
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="mb-10">
              <h3 className="font-bold text-dark mb-4 text-sm uppercase tracking-wide text-slate">
                Item Invoice
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate">
                      <th className="text-left py-4 font-bold text-dark">
                        Deskripsi
                      </th>
                      <th className="text-center py-4 font-bold text-dark">
                        Qty
                      </th>
                      <th className="text-right py-4 font-bold text-dark">
                        Harga
                      </th>
                      <th className="text-right py-4 font-bold text-dark">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-b border-slate">
                        <td className="py-4 text-dark">
                          {item.description || '-'}
                        </td>
                        <td className="py-4 text-center text-dark">
                          {item.quantity}
                        </td>
                        <td className="py-4 text-right text-dark">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="py-4 text-right font-semibold text-dark">
                          {formatCurrency(item.quantity * item.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-10">
              <div className="w-full md:w-80">
                <div className="flex justify-between py-3 text-slate">
                  <span>Subtotal</span>
                  <span className="font-semibold">
                    {formatCurrency(invoice.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between py-3 text-slate">
                  <span>Pajak ({invoice.taxRate}%)</span>
                  <span className="font-semibold">
                    {formatCurrency(invoice.taxAmount)}
                  </span>
                </div>
                <div className="flex justify-between py-4 border-t-2 border-slate text-2xl font-extrabold text-dark mt-4">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="border-t border-slate pt-8">
                <h3 className="font-bold text-dark mb-3 text-sm uppercase tracking-wide text-slate">
                  Catatan
                </h3>
                <p className="text-slate whitespace-pre-line">
                  {invoice.notes}
                </p>
              </div>
            )}

            {/* Payment Info */}
            {!isPaid && (
              <div className="mt-10 p-6 rounded-xl bg-gray border-2 border-slate">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-charcoal flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-dark mb-2">
                      Informasi Pembayaran
                    </h3>
                    <p className="text-slate text-sm mb-4">
                      Silakan hubungi {invoice.companyName} untuk informasi pembayaran.
                    </p>
                    <div className="flex flex-wrap gap-2 text-sm">
                      {invoice.companyEmail && (
                        <a
                          href={`mailto:${invoice.companyEmail}?subject=Pembayaran%20Invoice%20${invoice.invoiceNumber}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl font-medium text-dark hover:bg-gray transition-colors shadow-sm"
                        >
                          📧 Email
                        </a>
                      )}
                      {invoice.companyPhone && (
                        <a
                          href={`tel:${invoice.companyPhone}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl font-medium text-dark hover:bg-gray transition-colors shadow-sm"
                        >
                          📞 {invoice.companyPhone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-slate text-center">
              <p className="text-sm text-slate">
                Invoice dibuat dengan{' '}
                <a
                  href="https://invoicekirim.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-dark font-medium hover:underline"
                >
                  InvoiceKirim
                </a>
              </p>
              <p className="text-xs text-slate mt-2">
                &copy; {new Date().getFullYear()} InvoiceKirim. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
