'use client'

import { useRef, useEffect, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Printer, FileText } from 'lucide-react'
import type { BrandingSettings } from '@/lib/branding'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  price: number
}

interface InvoiceSettings {
  showClientInfo?: boolean
  showDiscount?: boolean
  showAdditionalDiscount?: boolean
  showTax?: boolean
  showSignature?: boolean
}

interface Invoice {
  id: string
  invoiceNumber: string
  date: Date
  dueDate: Date | null
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
  status: string
  settings?: InvoiceSettings | null
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

interface InvoicePrintViewProps {
  invoice: Invoice
  branding?: BrandingSettings | null
}

// Font family mapping
const FONT_FAMILIES: Record<string, string> = {
  inter: "'Inter', system-ui, sans-serif",
  roboto: "'Roboto', system-ui, sans-serif",
  poppins: "'Poppins', system-ui, sans-serif",
  opensans: "'Open Sans', system-ui, sans-serif",
  lato: "'Lato', system-ui, sans-serif",
  montserrat: "'Montserrat', system-ui, sans-serif",
  playfair: "'Playfair Display', Georgia, serif",
  merriweather: "'Merriweather', Georgia, serif",
}

export function InvoicePrintView({ invoice, branding }: InvoicePrintViewProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [fontsLoaded, setFontsLoaded] = useState(false)

  // Inject Google Fonts stylesheet so fonts are available during print
  useEffect(() => {
    const fonts = ['Inter', 'Roboto', 'Poppins', 'Open+Sans', 'Lato', 'Montserrat', 'Playfair+Display', 'Merriweather']
    const weights = '300;400;500;600;700;800'
    const linkId = 'invoice-google-fonts'
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = `https://fonts.googleapis.com/css2?family=${fonts.map(f => `${f}:wght@${weights}`).join('&family=')}&display=swap`
      document.head.appendChild(link)
    }
    // Wait for fonts to be ready
    document.fonts.ready.then(() => setFontsLoaded(true))
  }, [])

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${invoice.invoiceNumber}`,
  })

  // Get settings with defaults
  const settings: InvoiceSettings = {
    showClientInfo: invoice.settings?.showClientInfo ?? true,
    showDiscount: invoice.settings?.showDiscount ?? false,
    showAdditionalDiscount: invoice.settings?.showAdditionalDiscount ?? false,
    showTax: invoice.settings?.showTax ?? true,
    showSignature: invoice.settings?.showSignature ?? false,
  }

  // Extract branding colors with defaults
  const primaryColor = branding?.primaryColor || '#F97316'
  const accentColor = branding?.accentColor || '#0F766E'
  const logoUrl = branding?.showLogo ? branding?.logoUrl : null
  const fontFamily = FONT_FAMILIES[branding?.fontFamily || 'inter'] || FONT_FAMILIES.inter

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
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
        style={{
          backgroundColor: badge.bg,
          color: badge.color,
          fontSize: '10px',
          fontWeight: 700,
          padding: '4px 12px',
          borderRadius: '4px',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          fontFamily,
        }}
      >
        {badge.text}
      </span>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-8 px-4"
      style={{
        fontFamily,
        background: '#E5E7EB',
      }}
    >
      {/* A4 Page Container */}
      <div
        ref={printRef}
        className="bg-white shadow-2xl overflow-hidden"
        style={{
          fontFamily,
          width: '210mm',
          height: '297mm',
          maxWidth: '100%',
        }}
      >
        <div style={{ padding: '0 16mm', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header: Logo left, INVOICE + status right */}
          <div className="flex justify-between items-start" style={{ marginBottom: '7mm' }}>
            {/* Left: Logo */}
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div
                  className="flex items-center justify-center border rounded overflow-hidden"
                  style={{
                    width: '26mm',
                    height: '16mm',
                    borderColor: '#e2e8f0',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <img
                    src={logoUrl}
                    alt="Company Logo"
                    className="max-w-full max-h-full object-contain p-1"
                  />
                </div>
              ) : (
                <div
                  className="flex items-center justify-center rounded"
                  style={{
                    width: '11mm',
                    height: '11mm',
                    backgroundColor: accentColor,
                  }}
                >
                  <FileText className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            {/* Right: INVOICE title + number + status */}
            <div className="text-right">
              <h1
                style={{
                  fontSize: '38px',
                  fontWeight: 800,
                  color: accentColor,
                  fontFamily,
                  lineHeight: 1,
                  marginBottom: '2mm',
                  letterSpacing: '-0.5px',
                }}
              >
                INVOICE
              </h1>
              <p
                style={{
                  fontSize: '11px',
                  color: '#64748b',
                  fontFamily: 'monospace',
                  marginBottom: '3mm',
                }}
              >
                {invoice.invoiceNumber}
              </p>
              {getStatusBadge(invoice.status)}
            </div>
          </div>

          {/* Date Fields */}
          <div
            className="flex gap-6"
            style={{ marginBottom: '5mm', paddingBottom: '5mm', borderBottom: '1px solid #e2e8f0' }}
          >
            <div>
              <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Tanggal
              </span>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b', marginTop: '1mm' }}>
                {formatDate(invoice.date)}
              </p>
            </div>
            {invoice.dueDate && (
              <div>
                <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Jatuh Tempo
                </span>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b', marginTop: '1mm' }}>
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
                  fontSize: '9px',
                  fontWeight: 700,
                  color: accentColor,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '2mm',
                }}
              >
                Dari:
              </h3>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', marginBottom: '0.5mm' }}>
                  {invoice.companyName}
                </p>
                <p style={{ fontSize: '10px', color: '#475569', marginBottom: '0.5mm' }}>{invoice.companyEmail}</p>
                {invoice.companyPhone && (
                  <p style={{ fontSize: '10px', color: '#475569', marginBottom: '0.5mm' }}>{invoice.companyPhone}</p>
                )}
                {invoice.companyAddress && (
                  <p style={{ fontSize: '10px', color: '#475569', whiteSpace: 'pre-line' }}>{invoice.companyAddress}</p>
                )}
              </div>
            </div>

            {/* KEPADA */}
            {settings.showClientInfo && (
              <div>
                <h3
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: accentColor,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '2mm',
                  }}
                >
                  Kepada:
                </h3>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', marginBottom: '0.5mm' }}>
                    {invoice.clientName}
                  </p>
                  <p style={{ fontSize: '10px', color: '#475569', marginBottom: '0.5mm' }}>{invoice.clientEmail}</p>
                  {invoice.clientPhone && (
                    <p style={{ fontSize: '10px', color: '#475569', marginBottom: '0.5mm' }}>{invoice.clientPhone}</p>
                  )}
                  {invoice.clientAddress && (
                    <p style={{ fontSize: '10px', color: '#475569', whiteSpace: 'pre-line' }}>{invoice.clientAddress}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: '5mm' }}>
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${accentColor}` }}>
                  <th
                    className="text-left"
                    style={{ padding: '2mm 1.5mm', fontWeight: 700, fontSize: '9px', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                  >
                    Deskripsi
                  </th>
                  <th
                    className="text-center"
                    style={{ padding: '2mm 1.5mm', fontWeight: 700, fontSize: '9px', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                  >
                    Qty
                  </th>
                  <th
                    className="text-right"
                    style={{ padding: '2mm 1.5mm', fontWeight: 700, fontSize: '9px', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                  >
                    Harga
                  </th>
                  <th
                    className="text-right"
                    style={{ padding: '2mm 1.5mm', fontWeight: 700, fontSize: '9px', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}
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
                    <td style={{ padding: '2mm 1.5mm', fontSize: '10px', color: '#334155' }}>
                      {item.description || '-'}
                    </td>
                    <td style={{ padding: '2mm 1.5mm', fontSize: '10px', color: '#334155', textAlign: 'center' }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: '2mm 1.5mm', fontSize: '10px', color: '#334155', textAlign: 'right' }}>
                      {formatCurrency(item.price)}
                    </td>
                    <td style={{ padding: '2mm 1.5mm', fontSize: '10px', color: '#1e293b', textAlign: 'right', fontWeight: 600 }}>
                      {formatCurrency(item.quantity * item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals + Notes Row - flex-grow to fill space */}
          <div className="grid grid-cols-2 gap-6 flex-1">
            {/* Notes - Left Side */}
            <div>
              {invoice.notes && (
                <>
                  <h3
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      color: accentColor,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: '2mm',
                    }}
                  >
                    Catatan:
                  </h3>
                  <div
                    style={{
                      padding: '2mm',
                      border: '1px solid #e2e8f0',
                      borderRadius: '3px',
                      backgroundColor: '#f8fafc',
                      minHeight: '14mm',
                      fontSize: '9px',
                      color: '#475569',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {invoice.notes}
                  </div>
                </>
              )}
              {invoice.termsAndConditions && (
                <div style={{ marginTop: '2mm' }}>
                  <h3
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      color: accentColor,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: '1mm',
                    }}
                  >
                    Syarat & Ketentuan:
                  </h3>
                  <p style={{ fontSize: '8px', color: '#64748b', whiteSpace: 'pre-line' }}>
                    {invoice.termsAndConditions}
                  </p>
                </div>
              )}
            </div>

            {/* Totals - Right Side */}
            <div className="flex justify-end">
              <div style={{ width: '100%', maxWidth: '60mm' }}>
                <div className="flex justify-between" style={{ padding: '1mm 0' }}>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Subtotal</span>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#1e293b' }}>
                    {formatCurrency(invoice.subtotal)}
                  </span>
                </div>
                {settings.showDiscount && invoice.discountAmount && invoice.discountAmount > 0 && (
                  <div className="flex justify-between" style={{ padding: '1mm 0' }}>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>
                      Diskon {invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#16a34a' }}>
                      -{formatCurrency(invoice.discountAmount)}
                    </span>
                  </div>
                )}
                {settings.showAdditionalDiscount && invoice.additionalDiscountAmount && invoice.additionalDiscountAmount > 0 && (
                  <div className="flex justify-between" style={{ padding: '1mm 0' }}>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>
                      Diskon Tambahan {invoice.additionalDiscountType === 'percentage' ? `(${invoice.additionalDiscountValue}%)` : ''}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#16a34a' }}>
                      -{formatCurrency(invoice.additionalDiscountAmount)}
                    </span>
                  </div>
                )}
                {settings.showTax && (
                  <div className="flex justify-between" style={{ padding: '1mm 0' }}>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>
                      Pajak ({invoice.taxRate}%)
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#1e293b' }}>
                      {formatCurrency(invoice.taxAmount)}
                    </span>
                  </div>
                )}
                <div
                  className="flex justify-between"
                  style={{ paddingTop: '2mm', marginTop: '1mm', borderTop: `2px solid ${accentColor}` }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 800, color: accentColor }}>
                    TOTAL
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: accentColor }}>
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          {settings.showSignature && (invoice.signatureUrl || invoice.signatoryName) && (
            <div className="flex justify-end" style={{ marginTop: '4mm' }}>
              <div className="text-center">
                {invoice.signatureUrl && (
                  <div style={{ marginBottom: '1mm', paddingBottom: '1mm', borderBottom: '1px solid #94a3b8' }}>
                    <img
                      src={invoice.signatureUrl}
                      alt="Tanda tangan"
                      className="h-14 object-contain mx-auto"
                    />
                  </div>
                )}
                {invoice.signatoryName && (
                  <p style={{ fontWeight: 700, fontSize: '10px', color: '#1e293b' }}>{invoice.signatoryName}</p>
                )}
                {invoice.signatoryTitle && (
                  <p style={{ fontSize: '9px', color: '#64748b' }}>{invoice.signatoryTitle}</p>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div
            className="flex justify-between items-end"
            style={{ marginTop: 'auto', paddingTop: '4mm', borderTop: '1px solid #e2e8f0' }}
          >
            <p style={{ fontSize: '9px', color: '#94a3b8' }}>
              Invoice ini dikirim oleh <span style={{ fontWeight: 600, color: accentColor }}>{invoice.companyName}</span>
            </p>
            <p style={{ fontSize: '8px', color: '#cbd5e1' }}>
              NotaBener
            </p>
          </div>
        </div>
      </div>

      {/* Print Button */}
      <div className="mt-6 text-center print:hidden">
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition-all shadow-lg text-white hover:opacity-90"
          style={{ backgroundColor: accentColor }}
        >
          <Printer className="w-5 h-5" />
          Cetak Invoice
        </button>
      </div>
    </div>
  )
}
