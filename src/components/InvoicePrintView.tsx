'use client'

import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Printer } from 'lucide-react'

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
}

export function InvoicePrintView({ invoice }: InvoicePrintViewProps) {
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
    const stamps: Record<string, { text: string; color: string; bgColor: string }> = {
      DRAFT: {
        text: 'DRAFT',
        color: 'border-gray-400 text-gray-500',
        bgColor: 'bg-gray-50',
      },
      SENT: {
        text: 'TERKIRIM',
        color: 'border-blue-500 text-blue-600',
        bgColor: 'bg-blue-50',
      },
      PAID: {
        text: 'LUNAS',
        color: 'border-green-500 text-green-600',
        bgColor: 'bg-green-50',
      },
      OVERDUE: {
        text: 'JATUH TEMPO',
        color: 'border-red-500 text-red-600',
        bgColor: 'bg-red-50',
      },
      CANCELED: {
        text: 'BATAL',
        color: 'border-gray-400 text-gray-500',
        bgColor: 'bg-gray-50',
      },
    }

    const stamp = stamps[status] || stamps.DRAFT

    return (
      <div className="relative">
        <div
          className={`inline-flex items-center justify-center px-6 py-3 border-4 ${stamp.color} ${stamp.bgColor} rounded-lg transform -rotate-12 shadow-sm`}
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          <span className="text-xl font-black tracking-widest uppercase">
            {stamp.text}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Invoice Card - Printable Content */}
        <div ref={printRef} className="bg-white rounded-2xl shadow-2xl overflow-hidden relative">
          {/* Status Stamp */}
          <div className="absolute top-6 right-6 z-10">
            {getStatusStamp(invoice.status)}
          </div>

          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white p-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2">INVOICE</h1>
                <p className="text-orange-100">{invoice.invoiceNumber}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Invoice Info */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-orange-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Tanggal</p>
                <p className="font-bold text-gray-900">{formatDate(invoice.date)}</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Jatuh Tempo</p>
                <p className="font-bold text-gray-900">{formatDate(invoice.dueDate)}</p>
              </div>
            </div>

            {/* From & To - Conditional rendering */}
            <div className={`grid ${settings.showClientInfo ? 'md:grid-cols-2' : ''} gap-8 mb-8`}>
              <div>
                <h3 className="text-sm font-bold text-gray-600 uppercase mb-3">Dari</h3>
                <p className="font-bold text-gray-900 text-lg">{invoice.companyName}</p>
                <p className="text-gray-600">{invoice.companyEmail}</p>
                {invoice.companyPhone && <p className="text-gray-600">{invoice.companyPhone}</p>}
                {invoice.companyAddress && <p className="text-gray-600">{invoice.companyAddress}</p>}
              </div>
              {settings.showClientInfo && (
                <div>
                  <h3 className="text-sm font-bold text-gray-600 uppercase mb-3">Kepada</h3>
                  <p className="font-bold text-gray-900 text-lg">{invoice.clientName}</p>
                  <p className="text-gray-600">{invoice.clientEmail}</p>
                  {invoice.clientPhone && <p className="text-gray-600">{invoice.clientPhone}</p>}
                  {invoice.clientAddress && <p className="text-gray-600">{invoice.clientAddress}</p>}
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 text-sm font-bold text-gray-600">Deskripsi</th>
                    <th className="text-center py-3 text-sm font-bold text-gray-600">Qty</th>
                    <th className="text-right py-3 text-sm font-bold text-gray-600">Harga</th>
                    <th className="text-right py-3 text-sm font-bold text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-3 text-gray-900">{item.description}</td>
                      <td className="py-3 text-center text-gray-900">{item.quantity}</td>
                      <td className="py-3 text-right text-gray-900">{formatCurrency(item.price)}</td>
                      <td className="py-3 text-right font-bold text-gray-900">
                        {formatCurrency(item.quantity * item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals - Conditional rendering */}
            <div className="flex justify-end">
              <div className="w-72">
                <div className="flex justify-between py-2 text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {settings.showDiscount && invoice.discountAmount && invoice.discountAmount > 0 && (
                  <div className="flex justify-between py-2 text-green-600">
                    <span>Diskon {invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}</span>
                    <span className="font-bold">-{formatCurrency(invoice.discountAmount)}</span>
                  </div>
                )}
                {settings.showAdditionalDiscount && invoice.additionalDiscountAmount && invoice.additionalDiscountAmount > 0 && (
                  <div className="flex justify-between py-2 text-green-600">
                    <span>Diskon Tambahan {invoice.additionalDiscountType === 'percentage' ? `(${invoice.additionalDiscountValue}%)` : ''}</span>
                    <span className="font-bold">-{formatCurrency(invoice.additionalDiscountAmount)}</span>
                  </div>
                )}
                {settings.showTax && (
                  <div className="flex justify-between py-2 text-gray-600">
                    <span>Pajak ({invoice.taxRate}%)</span>
                    <span className="font-bold">{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 border-t-2 border-gray-200 text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-bold text-gray-600 uppercase mb-2">Catatan</h3>
                <p className="text-gray-600 whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}

            {/* Terms and Conditions */}
            {invoice.termsAndConditions && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-bold text-gray-600 uppercase mb-2">Syarat & Ketentuan</h3>
                <p className="text-gray-600 whitespace-pre-line">{invoice.termsAndConditions}</p>
              </div>
            )}

            {/* Signature Section */}
            {settings.showSignature && (invoice.signatureUrl || invoice.signatoryName) && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-bold text-gray-600 uppercase mb-4">Tanda Tangan</h3>
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
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 text-center">
            <p className="text-sm text-gray-600">
              Invoice ini dikirim secara otomatis oleh InvoiceKirim
            </p>
          </div>
        </div>

        {/* Print Button - Outside printable area */}
        <div className="mt-6 text-center">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all shadow-lg"
          >
            <Printer className="w-5 h-5" />
            Cetak Invoice
          </button>
        </div>
      </div>
    </div>
  )
}
