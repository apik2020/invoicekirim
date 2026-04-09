'use client'

import { useRef, useMemo } from 'react'
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

// Convert hex to RGB for rgba usage
function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
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

  // Derived colors
  const accentDark = useMemo(() => {
    // Darken the accent color for the footer bar
    const hex = accentColor.replace('#', '')
    const num = parseInt(hex, 16)
    const r = Math.max(((num >> 16) & 0xff) - 20, 0)
    const g = Math.max(((num >> 8) & 0xff) - 20, 0)
    const b = Math.max((num & 0x0000ff) - 20, 0)
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
  }, [accentColor])

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
      className="min-h-screen py-6 px-4 sm:py-10 sm:px-4"
      style={{
        fontFamily,
        background: '#FAFAF9',
      }}
    >
      <div className="max-w-[850px] mx-auto">
        {/* Invoice Card */}
        <div
          ref={printRef}
          className="bg-white shadow-xl relative overflow-hidden"
          style={{ fontFamily }}
        >
          {/* Top Accent Bar */}
          <div
            className="h-2 w-full"
            style={{ backgroundColor: accentColor }}
          />

          {/* Content Area with Side Accents */}
          <div className="relative">
            {/* Left Orange Accent Bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-2"
              style={{ backgroundColor: primaryColor }}
            />
            {/* Right Orange Accent Bar */}
            <div
              className="absolute right-0 top-0 bottom-0 w-2"
              style={{ backgroundColor: primaryColor }}
            />

            <div className="px-8 sm:px-12 py-8 sm:py-10">
              {/* Header: Logo left, INVOICE + status right */}
              <div className="flex justify-between items-start mb-6">
                {/* Left: Logo */}
                <div className="flex items-center gap-3">
                  {logoUrl ? (
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
                        alt="Company Logo"
                        className="max-w-full max-h-full object-contain p-2"
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
                      fontFamily,
                    }}
                  >
                    INVOICE
                  </h1>
                  <p
                    className="font-mono text-sm mb-3"
                    style={{ color: '#64748b' }}
                  >
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

              {/* DARI & KEPADA - Side by Side */}
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
                {settings.showClientInfo && (
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
                )}
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
                  {invoice.termsAndConditions && (
                    <div className="mt-4">
                      <h3
                        className="font-bold text-xs uppercase tracking-wider mb-2"
                        style={{ color: accentColor }}
                      >
                        Syarat & Ketentuan:
                      </h3>
                      <p className="text-xs whitespace-pre-line" style={{ color: '#64748b' }}>
                        {invoice.termsAndConditions}
                      </p>
                    </div>
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
                    {settings.showDiscount && invoice.discountAmount && invoice.discountAmount > 0 && (
                      <div className="flex justify-between py-2">
                        <span className="text-sm" style={{ color: '#64748b' }}>
                          Diskon {invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}
                        </span>
                        <span className="text-sm font-semibold" style={{ color: '#16a34a' }}>
                          -{formatCurrency(invoice.discountAmount)}
                        </span>
                      </div>
                    )}
                    {settings.showAdditionalDiscount && invoice.additionalDiscountAmount && invoice.additionalDiscountAmount > 0 && (
                      <div className="flex justify-between py-2">
                        <span className="text-sm" style={{ color: '#64748b' }}>
                          Diskon Tambahan {invoice.additionalDiscountType === 'percentage' ? `(${invoice.additionalDiscountValue}%)` : ''}
                        </span>
                        <span className="text-sm font-semibold" style={{ color: '#16a34a' }}>
                          -{formatCurrency(invoice.additionalDiscountAmount)}
                        </span>
                      </div>
                    )}
                    {settings.showTax && (
                      <div className="flex justify-between py-2">
                        <span className="text-sm" style={{ color: '#64748b' }}>
                          Pajak ({invoice.taxRate}%)
                        </span>
                        <span className="text-sm font-semibold" style={{ color: '#1e293b' }}>
                          {formatCurrency(invoice.taxAmount)}
                        </span>
                      </div>
                    )}
                    <div
                      className="flex justify-between py-3 mt-2"
                      style={{ borderTop: `2px solid ${accentColor}` }}
                    >
                      <span
                        className="text-lg font-extrabold"
                        style={{ color: accentColor }}
                      >
                        TOTAL
                      </span>
                      <span
                        className="text-lg font-extrabold"
                        style={{ color: accentColor }}
                      >
                        {formatCurrency(invoice.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature Section */}
              {settings.showSignature && (invoice.signatureUrl || invoice.signatoryName) && (
                <div className="flex justify-end mb-6">
                  <div className="text-center">
                    {invoice.signatureUrl && (
                      <div className="mb-2 pb-2" style={{ borderBottom: '1px solid #94a3b8' }}>
                        <img
                          src={invoice.signatureUrl}
                          alt="Tanda tangan"
                          className="h-16 object-contain mx-auto"
                        />
                      </div>
                    )}
                    {invoice.signatoryName && (
                      <p className="font-bold text-sm" style={{ color: '#1e293b' }}>{invoice.signatoryName}</p>
                    )}
                    {invoice.signatoryTitle && (
                      <p className="text-xs" style={{ color: '#64748b' }}>{invoice.signatoryTitle}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Bar */}
          <div
            className="px-8 sm:px-12 py-4 flex items-center justify-between"
            style={{ backgroundColor: accentDark }}
          >
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Invoice ini dikirim oleh: <strong>{invoice.companyName}</strong>
            </p>
            <div
              className="w-16 h-6 rounded-sm"
              style={{ backgroundColor: primaryColor }}
            />
          </div>
        </div>

        {/* Print Button - Outside printable area */}
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
    </div>
  )
}
