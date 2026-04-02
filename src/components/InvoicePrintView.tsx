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

// Helper to darken/lighten a color
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '')
  const num = parseInt(hex, 16)

  let r = (num >> 16) + amount
  let g = ((num >> 8) & 0x00ff) + amount
  let b = (num & 0x0000ff) + amount

  r = Math.min(Math.max(r, 0), 255)
  g = Math.min(Math.max(g, 0), 255)
  b = Math.min(Math.max(b, 0), 255)

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
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
  const accentColor = branding?.accentColor || '#276874'
  const logoUrl = branding?.showLogo ? branding?.logoUrl : null
  const fontFamily = FONT_FAMILIES[branding?.fontFamily || 'inter'] || FONT_FAMILIES.inter

  // Derived colors
  const primaryDark = useMemo(() => adjustColor(primaryColor, -30), [primaryColor])
  const primaryLight = useMemo(() => hexToRgba(primaryColor, 0.1), [primaryColor])
  const primaryLighter = useMemo(() => hexToRgba(primaryColor, 0.05), [primaryColor])

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
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getStatusStamp = (status: string) => {
    const stamps: Record<string, { text: string; borderColor: string; textColor: string; bgColor: string }> = {
      DRAFT: {
        text: 'DRAFT',
        borderColor: '#9ca3af',
        textColor: '#6b7280',
        bgColor: '#f9fafb',
      },
      SENT: {
        text: 'TERKIRIM',
        borderColor: primaryColor,
        textColor: primaryDark,
        bgColor: primaryLight,
      },
      PAID: {
        text: 'LUNAS',
        borderColor: '#22c55e',
        textColor: '#16a34a',
        bgColor: '#f0fdf4',
      },
      OVERDUE: {
        text: 'JATUH TEMPO',
        borderColor: '#ef4444',
        textColor: '#dc2626',
        bgColor: '#fef2f2',
      },
      CANCELED: {
        text: 'BATAL',
        borderColor: '#9ca3af',
        textColor: '#6b7280',
        bgColor: '#f9fafb',
      },
    }

    const stamp = stamps[status] || stamps.DRAFT

    return (
      <div className="relative">
        <div
          className="inline-flex items-center justify-center px-6 py-3 border-4 rounded-lg transform -rotate-12 shadow-sm"
          style={{
            fontFamily: fontFamily,
            borderColor: stamp.borderColor,
            color: stamp.textColor,
            backgroundColor: stamp.bgColor,
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
    <div
      className="min-h-screen py-10 px-4"
      style={{
        fontFamily: fontFamily,
        background: '#FAFAF9',
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Invoice Card - Printable Content */}
        <div
          ref={printRef}
          className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 relative"
          style={{ fontFamily: fontFamily }}
        >
          {/* Status Stamp */}
          <div className="absolute top-6 right-6 sm:top-8 sm:right-8 md:top-10 md:right-10 z-10 print:hidden">
            {getStatusStamp(invoice.status)}
          </div>

          {/* Header */}
          <div className="flex justify-between items-start mb-8 pb-8 border-b border-gray-200">
            <div>
              <div className="flex items-center gap-3 mb-4">
                {logoUrl ? (
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: primaryLighter }}
                  >
                    <img
                      src={logoUrl}
                      alt="Company Logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="font-bold text-xl text-gray-900">
                    {invoice.companyName}
                  </h1>
                  <p className="text-sm text-gray-500">{invoice.companyEmail}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Title */}
          <div className="mb-8">
            <h2
              className="text-3xl font-extrabold tracking-tight mb-2"
              style={{ color: accentColor }}
            >
              INVOICE
            </h2>
            <p className="text-gray-500 font-mono">{invoice.invoiceNumber}</p>
          </div>

          {/* Bill To */}
          {settings.showClientInfo && (
            <div className="mb-8">
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide text-gray-500">
                Kepada:
              </h3>
              <div
                className="rounded-xl p-6"
                style={{ backgroundColor: primaryLighter }}
              >
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
          )}

          {/* From Section */}
          <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide text-gray-500">
              Dari:
            </h3>
            <div
              className="rounded-xl p-6"
              style={{ backgroundColor: primaryLighter }}
            >
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
              <span className="text-gray-500 text-sm">Tanggal</span>
              <p className="font-semibold text-gray-900 mt-1">
                {formatDate(invoice.date)}
              </p>
            </div>
            {invoice.dueDate && (
              <div>
                <span className="text-gray-500 text-sm">Jatuh Tempo</span>
                <p className="font-semibold text-gray-900 mt-1">
                  {formatDate(invoice.dueDate)}
                </p>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide text-gray-500">
              Item Invoice
            </h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: primaryLighter }}>
                    <th className="text-left py-4 px-4 sm:px-6 font-bold text-gray-900 text-sm">
                      Deskripsi
                    </th>
                    <th className="text-center py-4 px-4 sm:px-6 font-bold text-gray-900 text-sm">
                      Qty
                    </th>
                    <th className="text-right py-4 px-4 sm:px-6 font-bold text-gray-900 text-sm">
                      Harga
                    </th>
                    <th className="text-right py-4 px-4 sm:px-6 font-bold text-gray-900 text-sm">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-4 px-4 sm:px-6 text-gray-900">
                        {item.description || '-'}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right text-gray-900">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right font-semibold text-gray-900">
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
              {settings.showDiscount && invoice.discountAmount && invoice.discountAmount > 0 && (
                <div className="flex justify-between py-3 text-green-600">
                  <span>Diskon {invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}</span>
                  <span className="font-semibold">-{formatCurrency(invoice.discountAmount)}</span>
                </div>
              )}
              {settings.showAdditionalDiscount && invoice.additionalDiscountAmount && invoice.additionalDiscountAmount > 0 && (
                <div className="flex justify-between py-3 text-green-600">
                  <span>Diskon Tambahan {invoice.additionalDiscountType === 'percentage' ? `(${invoice.additionalDiscountValue}%)` : ''}</span>
                  <span className="font-semibold">-{formatCurrency(invoice.additionalDiscountAmount)}</span>
                </div>
              )}
              {settings.showTax && (
                <div className="flex justify-between py-3 text-gray-600">
                  <span>Pajak ({invoice.taxRate}%)</span>
                  <span className="font-semibold">
                    {formatCurrency(invoice.taxAmount)}
                  </span>
                </div>
              )}
              <div
                className="flex justify-between py-4 border-t-2 text-2xl font-extrabold mt-4"
                style={{ borderColor: primaryLight, color: primaryColor }}
              >
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t border-gray-200 pt-8">
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide text-gray-500">
                Catatan
              </h3>
              <p className="text-gray-600 whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}

          {/* Terms and Conditions */}
          {invoice.termsAndConditions && (
            <div className="border-t border-gray-200 pt-8 mt-8">
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide text-gray-500">
                Syarat & Ketentuan
              </h3>
              <p className="text-gray-600 whitespace-pre-line">{invoice.termsAndConditions}</p>
            </div>
          )}

          {/* Signature Section */}
          {settings.showSignature && (invoice.signatureUrl || invoice.signatoryName) && (
            <div className="border-t border-gray-200 pt-8 mt-8">
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide text-gray-500">
                Tanda Tangan
              </h3>
              <div className="flex flex-col items-end">
                {invoice.signatureUrl && (
                  <div className="mb-2 border-b-2 border-gray-400 pb-2">
                    <img
                      src={invoice.signatureUrl}
                      alt="Tanda tangan"
                      className="h-16 object-contain"
                    />
                  </div>
                )}
                {invoice.signatoryName && (
                  <p className="font-bold text-gray-900">{invoice.signatoryName}</p>
                )}
                {invoice.signatoryTitle && (
                  <p className="text-sm text-gray-600">{invoice.signatoryTitle}</p>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              {logoUrl
                ? `Invoice ini dikirim oleh ${invoice.companyName}`
                : 'Invoice dibuat dengan NotaBener - Platform Invoice untuk UMKM Indonesia'}
            </p>
          </div>
        </div>

        {/* Print Button - Outside printable area */}
        <div className="mt-6 text-center print:hidden">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-all shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
              color: 'white',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `linear-gradient(135deg, ${primaryDark} 0%, ${adjustColor(primaryDark, -20)} 100%)`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`
            }}
          >
            <Printer className="w-5 h-5" />
            Cetak Invoice
          </button>
        </div>
      </div>
    </div>
  )
}
