'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useReactToPrint } from 'react-to-print'
import { FileText, Download, Printer, Loader2, CreditCard, CheckCircle, MessageCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  price: number
}

interface Branding {
  logoUrl: string | null
  primaryColor: string
  showLogo: boolean
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
  branding?: Branding | null
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
  const [token, setToken] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: invoice ? `Invoice-${invoice.invoiceNumber}` : 'Invoice',
  })

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const { token: tokenValue } = await params
        setToken(tokenValue)
        const res = await fetch(`/api/client/invoices/${tokenValue}`)

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

      // Get branding colors
      const pdfPrimaryColor = invoice.branding?.primaryColor || '#F97316'
      const pdfShowLogo = invoice.branding?.showLogo ?? true
      const pdfLogoUrl = invoice.branding?.logoUrl
      const pdfAccentColor = '#0F766E'

      // Build invoice HTML matching the new reference design
      const buildInvoiceHTML = () => {
        const items = invoice.items.map((item, index) => `
          <tr style="border-bottom: 1px solid #E2E8F0; background-color: ${index % 2 !== 0 ? '#f8fafc' : 'transparent'};">
            <td style="padding: 12px 8px; color: #334155; font-size: 13px;">${item.description || '-'}</td>
            <td style="padding: 12px 8px; text-align: center; color: #334155; font-size: 13px;">${item.quantity}</td>
            <td style="padding: 12px 8px; text-align: right; color: #334155; font-size: 13px;">${formatCurrency(item.price)}</td>
            <td style="padding: 12px 8px; text-align: right; color: #1e293b; font-size: 13px; font-weight: 600;">${formatCurrency(item.quantity * item.price)}</td>
          </tr>
        `).join('')

        const logoHtml = pdfShowLogo && pdfLogoUrl
          ? `<div style="width: 100px; height: 70px; border: 1px solid #e2e8f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; background: #f8fafc; overflow: hidden;"><img src="${pdfLogoUrl}" alt="Logo" style="max-width: 100%; max-height: 100%; object-fit: contain; padding: 4px;" /></div>`
          : `<div style="width: 48px; height: 48px; border-radius: 6px; display: flex; align-items: center; justify-content: center; background-color: ${pdfAccentColor};"><span style="color: white; font-weight: bold; font-size: 18px;">${invoice.companyName?.charAt(0)?.toUpperCase() || 'I'}</span></div>`

        const statusBadge = invoice.status === 'PAID'
          ? `<span style="background: #22c55e; color: white; font-size: 10px; font-weight: 700; padding: 4px 12px; border-radius: 4px; text-transform: uppercase;">LUNAS</span>`
          : invoice.status === 'SENT'
          ? `<span style="background: #22c55e; color: white; font-size: 10px; font-weight: 700; padding: 4px 12px; border-radius: 4px; text-transform: uppercase;">TERKIRIM</span>`
          : invoice.status === 'OVERDUE'
          ? `<span style="background: #ef4444; color: white; font-size: 10px; font-weight: 700; padding: 4px 12px; border-radius: 4px; text-transform: uppercase;">JATUH TEMPO</span>`
          : `<span style="background: #94a3b8; color: white; font-size: 10px; font-weight: 700; padding: 4px 12px; border-radius: 4px; text-transform: uppercase;">${invoice.status}</span>`

        return `
          <div style="font-family: system-ui, -apple-system, sans-serif; width: 794px; min-height: 1123px; margin: 0 auto; background: #FFFFFF; color: #333333;">
            <!-- Top Accent Bar -->
            <div style="height: 20px; background-color: ${pdfAccentColor};"></div>

            <div style="position: relative; min-height: 1060px; padding: 45px 53px;">
              <!-- Left/Right Orange Accent Bars -->
              <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 12px; background-color: ${pdfPrimaryColor};"></div>
              <div style="position: absolute; right: 0; top: 0; bottom: 0; width: 12px; background-color: ${pdfPrimaryColor};"></div>

              <!-- Header: Logo left, INVOICE + status right -->
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                <div>${logoHtml}</div>
                <div style="text-align: right;">
                  <h1 style="font-size: 42px; font-weight: 800; color: ${pdfAccentColor}; margin: 0; line-height: 1;">INVOICE</h1>
                  <p style="font-size: 13px; color: #64748b; margin: 4px 0 12px 0; font-family: monospace;">${invoice.invoiceNumber}</p>
                  ${statusBadge}
                </div>
              </div>

              <!-- Date Fields -->
              <div style="display: flex; gap: 24px; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e2e8f0;">
                <div>
                  <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Tanggal</span>
                  <p style="font-size: 13px; font-weight: 600; color: #1e293b; margin: 4px 0 0 0;">${formatDate(invoice.date)}</p>
                </div>
                ${invoice.dueDate ? `
                <div>
                  <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Jatuh Tempo</span>
                  <p style="font-size: 13px; font-weight: 600; color: #1e293b; margin: 4px 0 0 0;">${formatDate(invoice.dueDate)}</p>
                </div>
                ` : ''}
              </div>

              <!-- DARI & KEPADA Side by Side -->
              <div style="display: flex; gap: 48px; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e2e8f0;">
                <div style="flex: 1;">
                  <h3 style="font-size: 11px; font-weight: 700; color: ${pdfAccentColor}; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">Dari:</h3>
                  <p style="font-size: 13px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0;">${invoice.companyName}</p>
                  <p style="font-size: 13px; color: #475569; margin: 0 0 2px 0;">${invoice.companyEmail}</p>
                  ${invoice.companyPhone ? `<p style="font-size: 13px; color: #475569; margin: 0 0 2px 0;">${invoice.companyPhone}</p>` : ''}
                  ${invoice.companyAddress ? `<p style="font-size: 13px; color: #475569; margin: 0;">${invoice.companyAddress}</p>` : ''}
                </div>
                <div style="flex: 1;">
                  <h3 style="font-size: 11px; font-weight: 700; color: ${pdfAccentColor}; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">Kepada:</h3>
                  <p style="font-size: 13px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0;">${invoice.clientName}</p>
                  <p style="font-size: 13px; color: #475569; margin: 0 0 2px 0;">${invoice.clientEmail}</p>
                  ${invoice.clientPhone ? `<p style="font-size: 13px; color: #475569; margin: 0 0 2px 0;">${invoice.clientPhone}</p>` : ''}
                  ${invoice.clientAddress ? `<p style="font-size: 13px; color: #475569; margin: 0;">${invoice.clientAddress}</p>` : ''}
                </div>
              </div>

              <!-- Items Table -->
              <div style="margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="border-bottom: 2px solid ${pdfAccentColor};">
                      <th style="padding: 12px 8px; text-align: left; font-weight: 700; color: ${pdfAccentColor}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Deskripsi</th>
                      <th style="padding: 12px 8px; text-align: center; font-weight: 700; color: ${pdfAccentColor}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                      <th style="padding: 12px 8px; text-align: right; font-weight: 700; color: ${pdfAccentColor}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Harga</th>
                      <th style="padding: 12px 8px; text-align: right; font-weight: 700; color: ${pdfAccentColor}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
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
                  <h3 style="font-size: 11px; font-weight: 700; color: ${pdfAccentColor}; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Catatan:</h3>
                  <div style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 4px; background: #f8fafc; font-size: 13px; color: #475569; white-space: pre-line; min-height: 80px;">${invoice.notes}</div>
                  ` : ''}
                </div>

                <!-- Totals Right -->
                <div style="flex: 1; display: flex; justify-content: flex-end;">
                  <div style="width: 100%; max-width: 280px;">
                    <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                      <span style="font-size: 13px; color: #64748b;">Subtotal</span>
                      <span style="font-size: 13px; font-weight: 600; color: #1e293b;">${formatCurrency(invoice.subtotal)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                      <span style="font-size: 13px; color: #64748b;">Pajak (${invoice.taxRate}%)</span>
                      <span style="font-size: 13px; font-weight: 600; color: #1e293b;">${formatCurrency(invoice.taxAmount)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 12px 0; margin-top: 8px; border-top: 2px solid ${pdfAccentColor};">
                      <span style="font-size: 18px; font-weight: 800; color: ${pdfAccentColor};">TOTAL</span>
                      <span style="font-size: 18px; font-weight: 800; color: ${pdfAccentColor};">${formatCurrency(invoice.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Bar -->
            <div style="background-color: #0a5e56; padding: 16px 53px; display: flex; align-items: center; justify-content: space-between;">
              <p style="font-size: 12px; color: rgba(255,255,255,0.9); margin: 0;">
                Invoice ini dikirim oleh: <strong>${invoice.companyName}</strong>
              </p>
              <div style="width: 60px; height: 24px; background-color: ${pdfPrimaryColor}; border-radius: 2px;"></div>
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

  // Generate PDF as Blob for sharing
  const generatePDFBlob = async (): Promise<Blob | null> => {
    if (!invoice) return null

    try {
      const html2canvas = await import('html2canvas')
      const { jsPDF } = await import('jspdf')

      // Get branding colors
      const pdfPrimaryColor = invoice.branding?.primaryColor || '#F97316'
      const pdfShowLogo = invoice.branding?.showLogo ?? true
      const pdfLogoUrl = invoice.branding?.logoUrl
      const pdfAccentColor = '#0F766E'

      // Build invoice HTML matching the new reference design
      const buildInvoiceHTML = () => {
        const items = invoice.items.map((item, index) => `
          <tr style="border-bottom: 1px solid #E2E8F0; background-color: ${index % 2 !== 0 ? '#f8fafc' : 'transparent'};">
            <td style="padding: 12px 8px; color: #334155; font-size: 13px;">${item.description || '-'}</td>
            <td style="padding: 12px 8px; text-align: center; color: #334155; font-size: 13px;">${item.quantity}</td>
            <td style="padding: 12px 8px; text-align: right; color: #334155; font-size: 13px;">${formatCurrency(item.price)}</td>
            <td style="padding: 12px 8px; text-align: right; color: #1e293b; font-size: 13px; font-weight: 600;">${formatCurrency(item.quantity * item.price)}</td>
          </tr>
        `).join('')

        const logoHtml = pdfShowLogo && pdfLogoUrl
          ? `<div style="width: 100px; height: 70px; border: 1px solid #e2e8f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; background: #f8fafc; overflow: hidden;"><img src="${pdfLogoUrl}" alt="Logo" style="max-width: 100%; max-height: 100%; object-fit: contain; padding: 4px;" /></div>`
          : `<div style="width: 48px; height: 48px; border-radius: 6px; display: flex; align-items: center; justify-content: center; background-color: ${pdfAccentColor};"><span style="color: white; font-weight: bold; font-size: 18px;">${invoice.companyName?.charAt(0)?.toUpperCase() || 'I'}</span></div>`

        const statusBadge = invoice.status === 'PAID'
          ? `<span style="background: #22c55e; color: white; font-size: 10px; font-weight: 700; padding: 4px 12px; border-radius: 4px; text-transform: uppercase;">LUNAS</span>`
          : invoice.status === 'SENT'
          ? `<span style="background: #22c55e; color: white; font-size: 10px; font-weight: 700; padding: 4px 12px; border-radius: 4px; text-transform: uppercase;">TERKIRIM</span>`
          : invoice.status === 'OVERDUE'
          ? `<span style="background: #ef4444; color: white; font-size: 10px; font-weight: 700; padding: 4px 12px; border-radius: 4px; text-transform: uppercase;">JATUH TEMPO</span>`
          : `<span style="background: #94a3b8; color: white; font-size: 10px; font-weight: 700; padding: 4px 12px; border-radius: 4px; text-transform: uppercase;">${invoice.status}</span>`

        return `
          <div style="font-family: system-ui, -apple-system, sans-serif; width: 794px; min-height: 1123px; margin: 0 auto; background: #FFFFFF; color: #333333;">
            <!-- Top Accent Bar -->
            <div style="height: 20px; background-color: ${pdfAccentColor};"></div>

            <div style="position: relative; min-height: 1060px; padding: 45px 53px;">
              <!-- Left/Right Orange Accent Bars -->
              <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 12px; background-color: ${pdfPrimaryColor};"></div>
              <div style="position: absolute; right: 0; top: 0; bottom: 0; width: 12px; background-color: ${pdfPrimaryColor};"></div>

              <!-- Header: Logo left, INVOICE + status right -->
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                <div>${logoHtml}</div>
                <div style="text-align: right;">
                  <h1 style="font-size: 42px; font-weight: 800; color: ${pdfAccentColor}; margin: 0; line-height: 1;">INVOICE</h1>
                  <p style="font-size: 13px; color: #64748b; margin: 4px 0 12px 0; font-family: monospace;">${invoice.invoiceNumber}</p>
                  ${statusBadge}
                </div>
              </div>

              <!-- Date Fields -->
              <div style="display: flex; gap: 24px; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e2e8f0;">
                <div>
                  <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Tanggal</span>
                  <p style="font-size: 13px; font-weight: 600; color: #1e293b; margin: 4px 0 0 0;">${formatDate(invoice.date)}</p>
                </div>
                ${invoice.dueDate ? `
                <div>
                  <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Jatuh Tempo</span>
                  <p style="font-size: 13px; font-weight: 600; color: #1e293b; margin: 4px 0 0 0;">${formatDate(invoice.dueDate)}</p>
                </div>
                ` : ''}
              </div>

              <!-- DARI & KEPADA Side by Side -->
              <div style="display: flex; gap: 48px; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e2e8f0;">
                <div style="flex: 1;">
                  <h3 style="font-size: 11px; font-weight: 700; color: ${pdfAccentColor}; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">Dari:</h3>
                  <p style="font-size: 13px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0;">${invoice.companyName}</p>
                  <p style="font-size: 13px; color: #475569; margin: 0 0 2px 0;">${invoice.companyEmail}</p>
                  ${invoice.companyPhone ? `<p style="font-size: 13px; color: #475569; margin: 0 0 2px 0;">${invoice.companyPhone}</p>` : ''}
                  ${invoice.companyAddress ? `<p style="font-size: 13px; color: #475569; margin: 0;">${invoice.companyAddress}</p>` : ''}
                </div>
                <div style="flex: 1;">
                  <h3 style="font-size: 11px; font-weight: 700; color: ${pdfAccentColor}; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">Kepada:</h3>
                  <p style="font-size: 13px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0;">${invoice.clientName}</p>
                  <p style="font-size: 13px; color: #475569; margin: 0 0 2px 0;">${invoice.clientEmail}</p>
                  ${invoice.clientPhone ? `<p style="font-size: 13px; color: #475569; margin: 0 0 2px 0;">${invoice.clientPhone}</p>` : ''}
                  ${invoice.clientAddress ? `<p style="font-size: 13px; color: #475569; margin: 0;">${invoice.clientAddress}</p>` : ''}
                </div>
              </div>

              <!-- Items Table -->
              <div style="margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="border-bottom: 2px solid ${pdfAccentColor};">
                      <th style="padding: 12px 8px; text-align: left; font-weight: 700; color: ${pdfAccentColor}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Deskripsi</th>
                      <th style="padding: 12px 8px; text-align: center; font-weight: 700; color: ${pdfAccentColor}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                      <th style="padding: 12px 8px; text-align: right; font-weight: 700; color: ${pdfAccentColor}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Harga</th>
                      <th style="padding: 12px 8px; text-align: right; font-weight: 700; color: ${pdfAccentColor}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
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
                  <h3 style="font-size: 11px; font-weight: 700; color: ${pdfAccentColor}; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Catatan:</h3>
                  <div style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 4px; background: #f8fafc; font-size: 13px; color: #475569; white-space: pre-line; min-height: 80px;">${invoice.notes}</div>
                  ` : ''}
                </div>

                <!-- Totals Right -->
                <div style="flex: 1; display: flex; justify-content: flex-end;">
                  <div style="width: 100%; max-width: 280px;">
                    <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                      <span style="font-size: 13px; color: #64748b;">Subtotal</span>
                      <span style="font-size: 13px; font-weight: 600; color: #1e293b;">${formatCurrency(invoice.subtotal)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                      <span style="font-size: 13px; color: #64748b;">Pajak (${invoice.taxRate}%)</span>
                      <span style="font-size: 13px; font-weight: 600; color: #1e293b;">${formatCurrency(invoice.taxAmount)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 12px 0; margin-top: 8px; border-top: 2px solid ${pdfAccentColor};">
                      <span style="font-size: 18px; font-weight: 800; color: ${pdfAccentColor};">TOTAL</span>
                      <span style="font-size: 18px; font-weight: 800; color: ${pdfAccentColor};">${formatCurrency(invoice.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Bar -->
            <div style="background-color: #0a5e56; padding: 16px 53px; display: flex; align-items: center; justify-content: space-between;">
              <p style="font-size: 12px; color: rgba(255,255,255,0.9); margin: 0;">
                Invoice ini dikirim oleh: <strong>${invoice.companyName}</strong>
              </p>
              <div style="width: 60px; height: 24px; background-color: ${pdfPrimaryColor}; border-radius: 2px;"></div>
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

      // Return as blob
      const pdfBlob = pdf.output('blob')
      return pdfBlob
    } catch (err) {
      console.error('Error generating PDF blob:', err)
      return null
    }
  }

  // Handle WhatsApp share with invoice link
  const handleWhatsApp = () => {
    if (!invoice || !token) return

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const invoiceUrl = `${baseUrl}/invoice/${token}`

    const message = `*INVOICE - ${invoice.invoiceNumber}*

Dari: ${invoice.companyName}
Kepada: ${invoice.clientName}

Total: ${formatCurrency(invoice.total)}
${invoice.dueDate ? `Jatuh Tempo: ${formatDate(invoice.dueDate)}` : ''}

📄 Lihat Invoice: ${invoiceUrl}

Terima kasih!`

    const encoded = encodeURIComponent(message)

    // Try to get phone number if available
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

  if (loading) {
    return (
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gray-900 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat invoice...</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Invoice Tidak Ditemukan
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'Invoice tidak ditemukan atau link sudah tidak valid.'}
          </p>
          <p className="text-sm text-gray-600">
            Silakan hubungi pengirim invoice untuk mendapatkan link yang valid.
          </p>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; bg: string; color: string }> = {
      DRAFT: { text: 'DRAFT', bg: '#94a3b8', color: '#ffffff' },
      SENT: { text: 'TERKIRIM', bg: '#22c55e', color: '#ffffff' },
      PAID: { text: 'LUNAS', bg: '#22c55e', color: '#ffffff' },
      OVERDUE: { text: 'JATUH TEMPO', bg: '#ef4444', color: '#ffffff' },
      CANCELED: { text: 'BATAL', bg: '#94a3b8', color: '#ffffff' },
    }
    const badge = badges[status] || badges.DRAFT
    return (
      <span
        className="inline-block text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded"
        style={{ backgroundColor: badge.bg, color: badge.color }}
      >
        {badge.text}
      </span>
    )
  }

  const isPaid = invoice.status === 'PAID'

  // Get branding colors with fallback
  const primaryColor = invoice.branding?.primaryColor || '#F97316'
  const accentColor = '#0F766E'
  const showLogo = invoice.branding?.showLogo ?? true
  const logoUrl = invoice.branding?.logoUrl

  return (
    <div className="min-h-screen bg-fresh-bg">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50" style={{ borderColor: accentColor + '40' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-charcoal flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-lg">NotaBener</h1>
                <p className="text-xs text-gray-600">Client Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={generatingPDF}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 rounded-xl btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingPDF ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                onClick={handleWhatsApp}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl"
                style={{
                  background: 'linear-gradient(145deg, #25D366, #128C7E)',
                }}
              >
                <MessageCircle size={16} />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 rounded-xl btn-secondary"
              >
                <Printer size={16} />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Invoice Content */}
      <div className="flex flex-col items-center px-4 py-8">
        <div style={{ width: '210mm', maxWidth: '100%' }}>
          {/* Status Banner */}
          {isPaid ? (
            <div className="mb-6 p-4 rounded-xl bg-green-50 border-2 border-green-200 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-green-800">
                  Invoice Ini Sudah Lunas
                </p>
                {invoice.paidAt && (
                  <p className="text-sm text-green-600">
                  Dibayar pada {formatDate(invoice.paidAt)}
                </p>
                )}
              </div>
            </div>
          ) : invoice.status === 'OVERDUE' ? (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border-2 border-red-200">
              <p className="font-bold text-red-800">
                Invoice Sudah Jatuh Tempo
              </p>
              <p className="text-sm text-red-600 mt-1">
                Mohon segera lakukan pembayaran.
              </p>
            </div>
          ) : null}

          {/* Invoice Card - A4 Full Page */}
          <div ref={printRef} id="invoice-card" className="bg-white shadow-2xl relative overflow-hidden" style={{ minHeight: '297mm' }}>
            {/* Top Accent Bar */}
            <div className="w-full" style={{ backgroundColor: accentColor, height: '6mm' }} />

            {/* Content Area with Side Accents */}
            <div className="relative" style={{ minHeight: '285mm' }}>
              {/* Left Orange Accent Bar */}
              <div className="absolute left-0 top-0 bottom-0" style={{ backgroundColor: primaryColor, width: '4mm' }} />
              {/* Right Orange Accent Bar */}
              <div className="absolute right-0 top-0 bottom-0" style={{ backgroundColor: primaryColor, width: '4mm' }} />

              <div style={{ padding: '12mm 14mm' }}>
                {/* Header: Logo left, INVOICE + status right */}
                <div className="flex justify-between items-start mb-6">
                  {/* Left: Logo */}
                  <div className="flex items-center gap-3">
                    {showLogo && logoUrl ? (
                      <div
                        className="flex items-center justify-center border rounded overflow-hidden"
                        style={{
                          width: '100px',
                          height: '70px',
                          borderColor: '#e2e8f0',
                          backgroundColor: '#f8fafc',
                        }}
                      >
                        <img
                          src={logoUrl}
                          alt={invoice.companyName}
                          className="max-w-full max-h-full object-contain p-2"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-center rounded"
                        style={{
                          width: '48px',
                          height: '48px',
                          backgroundColor: accentColor,
                        }}
                      >
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Right: INVOICE title + number + status */}
                  <div className="text-right">
                    <h1
                      className="font-extrabold tracking-tight leading-none mb-1"
                      style={{
                        fontSize: '42px',
                        color: accentColor,
                      }}
                    >
                      INVOICE
                    </h1>
                    <p className="font-mono text-sm mb-3" style={{ color: '#64748b' }}>
                      {invoice.invoiceNumber}
                    </p>
                    {getStatusBadge(invoice.status)}
                  </div>
                </div>

                {/* Date Fields */}
                <div className="flex flex-wrap gap-6 mb-6 pb-6" style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <div>
                    <span className="text-xs uppercase tracking-wide" style={{ color: '#94a3b8' }}>
                      Tanggal
                    </span>
                    <p className="font-semibold text-sm mt-1" style={{ color: '#1e293b' }}>
                      {formatDate(invoice.date)}
                    </p>
                  </div>
                  {invoice.dueDate && (
                    <div>
                      <span className="text-xs uppercase tracking-wide" style={{ color: '#94a3b8' }}>
                        Jatuh Tempo
                      </span>
                      <p className="font-semibold text-sm mt-1" style={{ color: '#1e293b' }}>
                        {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                  )}
                </div>

                {/* DARI & KEPADA Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6" style={{ borderBottom: '1px solid #e2e8f0' }}>
                  {/* DARI */}
                  <div>
                    <h3
                      className="font-bold text-xs uppercase tracking-wider mb-3"
                      style={{ color: accentColor }}
                    >
                      Dari:
                    </h3>
                    <div>
                      <p className="font-bold text-sm" style={{ color: '#1e293b' }}>
                        {invoice.companyName}
                      </p>
                      <p className="text-sm" style={{ color: '#475569' }}>{invoice.companyEmail}</p>
                      {invoice.companyPhone && (
                        <p className="text-sm" style={{ color: '#475569' }}>{invoice.companyPhone}</p>
                      )}
                      {invoice.companyAddress && (
                        <p className="text-sm whitespace-pre-line" style={{ color: '#475569' }}>{invoice.companyAddress}</p>
                      )}
                    </div>
                  </div>

                  {/* KEPADA */}
                  <div>
                    <h3
                      className="font-bold text-xs uppercase tracking-wider mb-3"
                      style={{ color: accentColor }}
                    >
                      Kepada:
                    </h3>
                    <div>
                      <p className="font-bold text-sm" style={{ color: '#1e293b' }}>
                        {invoice.clientName}
                      </p>
                      <p className="text-sm" style={{ color: '#475569' }}>{invoice.clientEmail}</p>
                      {invoice.clientPhone && (
                        <p className="text-sm" style={{ color: '#475569' }}>{invoice.clientPhone}</p>
                      )}
                      {invoice.clientAddress && (
                        <p className="text-sm whitespace-pre-line" style={{ color: '#475569' }}>{invoice.clientAddress}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-6">
                  <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${accentColor}` }}>
                        <th
                          className="text-left py-3 px-2 font-bold text-xs uppercase tracking-wider"
                          style={{ color: accentColor }}
                        >
                          Deskripsi
                        </th>
                        <th
                          className="text-center py-3 px-2 font-bold text-xs uppercase tracking-wider"
                          style={{ color: accentColor }}
                        >
                          Qty
                        </th>
                        <th
                          className="text-right py-3 px-2 font-bold text-xs uppercase tracking-wider"
                          style={{ color: accentColor }}
                        >
                          Harga
                        </th>
                        <th
                          className="text-right py-3 px-2 font-bold text-xs uppercase tracking-wider"
                          style={{ color: accentColor }}
                        >
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, index) => (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom: '1px solid #e2e8f0',
                            backgroundColor: index % 2 === 0 ? 'transparent' : '#f8fafc',
                          }}
                        >
                          <td className="py-3 px-2 text-sm" style={{ color: '#334155' }}>
                            {item.description || '-'}
                          </td>
                          <td className="py-3 px-2 text-center text-sm" style={{ color: '#334155' }}>
                            {item.quantity}
                          </td>
                          <td className="py-3 px-2 text-right text-sm" style={{ color: '#334155' }}>
                            {formatCurrency(item.price)}
                          </td>
                          <td className="py-3 px-2 text-right text-sm font-semibold" style={{ color: '#1e293b' }}>
                            {formatCurrency(item.quantity * item.price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals + Notes Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                  {/* Notes - Left Side */}
                  <div>
                    {invoice.notes && (
                      <>
                        <h3
                          className="font-bold text-xs uppercase tracking-wider mb-2"
                          style={{ color: accentColor }}
                        >
                          Catatan:
                        </h3>
                        <div
                          className="p-4 rounded text-sm whitespace-pre-line"
                          style={{
                            color: '#475569',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#f8fafc',
                            minHeight: '80px',
                          }}
                        >
                          {invoice.notes}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Totals - Right Side */}
                  <div className="flex justify-end">
                    <div className="w-full max-w-[280px]">
                      <div className="flex justify-between py-2">
                        <span className="text-sm" style={{ color: '#64748b' }}>Subtotal</span>
                        <span className="text-sm font-semibold" style={{ color: '#1e293b' }}>
                          {formatCurrency(invoice.subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-sm" style={{ color: '#64748b' }}>Pajak ({invoice.taxRate}%)</span>
                        <span className="text-sm font-semibold" style={{ color: '#1e293b' }}>
                          {formatCurrency(invoice.taxAmount)}
                        </span>
                      </div>
                      <div
                        className="flex justify-between py-3 mt-2"
                        style={{ borderTop: `2px solid ${accentColor}` }}
                      >
                        <span className="text-lg font-extrabold" style={{ color: accentColor }}>
                          TOTAL
                        </span>
                        <span className="text-lg font-extrabold" style={{ color: accentColor }}>
                          {formatCurrency(invoice.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                {!isPaid && (
                  <div className="p-5 rounded-lg border" style={{ borderColor: '#e2e8f0', backgroundColor: '#f8fafc' }}>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accentColor }}>
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-sm mb-2" style={{ color: '#1e293b' }}>
                          Informasi Pembayaran
                        </h3>
                        <p className="text-sm mb-3" style={{ color: '#64748b' }}>
                          Silakan hubungi {invoice.companyName} untuk informasi pembayaran.
                        </p>
                        <div className="flex flex-wrap gap-2 text-sm">
                          {invoice.companyEmail && (
                            <a
                              href={`mailto:${invoice.companyEmail}?subject=Pembayaran%20Invoice%20${invoice.invoiceNumber}`}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
                              style={{ color: '#1e293b' }}
                            >
                              Email
                            </a>
                          )}
                          {invoice.companyPhone && (
                            <a
                              href={`tel:${invoice.companyPhone}`}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
                              style={{ color: '#1e293b' }}
                            >
                              {invoice.companyPhone}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Bar */}
            <div
              className="flex items-center justify-between"
              style={{ backgroundColor: '#0a5e56', padding: '4mm 14mm' }}
            >
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Invoice ini dikirim oleh: <strong>{invoice.companyName}</strong>
              </p>
              <div className="w-16 h-6 rounded-sm" style={{ backgroundColor: primaryColor }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
