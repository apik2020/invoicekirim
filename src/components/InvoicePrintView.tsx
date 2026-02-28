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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Invoice Card - Printable Content */}
        <div ref={printRef} className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white p-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2">INVOICE</h1>
                <p className="text-orange-100">{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-orange-100 text-sm">Status</p>
                <span className={`inline-block px-4 py-2 rounded-xl font-bold text-sm mt-1 ${
                  invoice.status === 'PAID'
                    ? 'bg-green-500 text-white'
                    : invoice.status === 'SENT'
                    ? 'bg-yellow-500 text-white'
                    : invoice.status === 'OVERDUE'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-500 text-white'
                }`}>
                  {invoice.status === 'PAID' ? 'LUNAS' : invoice.status === 'SENT' ? 'TERKIRIM' : invoice.status === 'OVERDUE' ? 'TERLAMBAT' : 'DRAFT'}
                </span>
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

            {/* From & To */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-bold text-gray-600 uppercase mb-3">Dari</h3>
                <p className="font-bold text-gray-900 text-lg">{invoice.companyName}</p>
                <p className="text-gray-600">{invoice.companyEmail}</p>
                {invoice.companyPhone && <p className="text-gray-600">{invoice.companyPhone}</p>}
                {invoice.companyAddress && <p className="text-gray-600">{invoice.companyAddress}</p>}
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-600 uppercase mb-3">Kepada</h3>
                <p className="font-bold text-gray-900 text-lg">{invoice.clientName}</p>
                <p className="text-gray-600">{invoice.clientEmail}</p>
                {invoice.clientPhone && <p className="text-gray-600">{invoice.clientPhone}</p>}
                {invoice.clientAddress && <p className="text-gray-600">{invoice.clientAddress}</p>}
              </div>
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

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-72">
                <div className="flex justify-between py-2 text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between py-2 text-gray-600">
                  <span>Pajak ({invoice.taxRate}%)</span>
                  <span className="font-bold">{formatCurrency(invoice.taxAmount)}</span>
                </div>
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
