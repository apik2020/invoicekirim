'use client'

import { useRef, useEffect, useState } from 'react'
import { Printer } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────
type ContactInfo = {
  name: string
  email: string
  phone?: string
  address?: string
}

type InvoiceItem = {
  description: string
  quantity: number
  price: number
}

type InvoiceProps = {
  from: ContactInfo
  to: ContactInfo
  invoiceNumber: string
  date: string
  dueDate: string
  items: InvoiceItem[]
  taxPercent: number
  notes?: string
  companyName: string
  logoUrl?: string
  status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELED'
  /** Show the print button (default: true) */
  showPrintButton?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT:    { label: 'DRAFT',         bg: 'bg-gray-400',   text: 'text-white' },
  SENT:     { label: 'TERKIRIM',      bg: 'bg-green-500',  text: 'text-white' },
  PAID:     { label: 'LUNAS',         bg: 'bg-green-500',  text: 'text-white' },
  OVERDUE:  { label: 'JATUH TEMPO',   bg: 'bg-red-500',    text: 'text-white' },
  CANCELED: { label: 'BATAL',         bg: 'bg-gray-400',   text: 'text-white' },
}

// ─── Component ───────────────────────────────────────────────────────
export function Invoice({
  from,
  to,
  invoiceNumber,
  date,
  dueDate,
  items,
  taxPercent,
  notes,
  companyName,
  logoUrl,
  status = 'SENT',
  showPrintButton = true,
}: InvoiceProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [fontsLoaded, setFontsLoaded] = useState(false)

  // Load Google Fonts for print preview
  useEffect(() => {
    const linkId = 'invoice-google-fonts'
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
      document.head.appendChild(link)
    }
    document.fonts.ready.then(() => setFontsLoaded(true))
  }, [])

  // ─── Calculations ────────────────────────────────────────────────────
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  const tax = subtotal * (taxPercent / 100)
  const total = subtotal + tax
  const badge = STATUS_MAP[status] || STATUS_MAP.DRAFT

  // Compress spacing when many items
  const isCompact = items.length > 8

  return (
    <div className="flex flex-col items-center py-8 px-4 bg-gray-200 print:bg-white print:p-0">
      {/* ── A4 Container ─────────────────────────────────────────── */}
      <div
        ref={printRef}
        className="w-[210mm] h-[297mm] mx-auto bg-white overflow-hidden print:shadow-none shadow-2xl"
        style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
      >
        <div className="flex flex-col h-full" style={{ padding: '0 16mm' }}>

          {/* ── Header: Logo + INVOICE ─────────────────────────────── */}
          <div className="flex justify-between items-start" style={{ marginTop: '6mm', marginBottom: '5mm' }}>
            {/* Logo */}
            <div className="flex items-center">
              {logoUrl ? (
                <div className="flex items-center justify-center border border-gray-200 rounded overflow-hidden bg-gray-50"
                  style={{ width: '26mm', height: '16mm' }}>
                  <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain p-1" />
                </div>
              ) : (
                <div className="flex items-center justify-center border border-gray-300 rounded font-bold text-gray-400 text-xs"
                  style={{ width: '26mm', height: '16mm' }}>
                  LOGO
                </div>
              )}
            </div>

            {/* INVOICE title + badge */}
            <div className="text-right">
              <h1 className="text-[38px] font-extrabold text-black leading-none tracking-tight">
                INVOICE
              </h1>
              <p className="text-[11px] text-gray-500 font-mono mt-[2mm] mb-[3mm]">
                {invoiceNumber}
              </p>
              <span className={`${badge.bg} ${badge.text} text-[10px] font-bold px-3 py-1 rounded tracking-wide uppercase`}>
                {badge.label}
              </span>
            </div>
          </div>

          {/* ── Date Fields ────────────────────────────────────────── */}
          <div className="flex gap-6 pb-[4mm] mb-[4mm] border-b border-gray-200">
            <div>
              <span className="text-[9px] text-gray-400 uppercase tracking-wider">Tanggal</span>
              <p className="text-[11px] font-semibold text-gray-800 mt-[1mm]">{formatDate(date)}</p>
            </div>
            {dueDate && (
              <div>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider">Jatuh Tempo</span>
                <p className="text-[11px] font-semibold text-gray-800 mt-[1mm]">{formatDate(dueDate)}</p>
              </div>
            )}
          </div>

          {/* ── DARI / KEPADA ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-6 pb-[4mm] mb-[4mm] border-b border-gray-200">
            {/* DARI */}
            <div>
              <h3 className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest mb-[2mm]">Dari:</h3>
              <p className="text-[11px] font-bold text-gray-800 leading-tight">{from.name}</p>
              <p className="text-[10px] text-gray-600 leading-tight">{from.email}</p>
              {from.phone && <p className="text-[10px] text-gray-600 leading-tight">{from.phone}</p>}
              {from.address && <p className="text-[10px] text-gray-600 leading-tight whitespace-pre-line">{from.address}</p>}
            </div>
            {/* KEPADA */}
            <div className="text-right">
              <h3 className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest mb-[2mm]">Kepada:</h3>
              <p className="text-[11px] font-bold text-gray-800 leading-tight">{to.name}</p>
              <p className="text-[10px] text-gray-600 leading-tight">{to.email}</p>
              {to.phone && <p className="text-[10px] text-gray-600 leading-tight">{to.phone}</p>}
              {to.address && <p className="text-[10px] text-gray-600 leading-tight whitespace-pre-line">{to.address}</p>}
            </div>
          </div>

          {/* ── Items Table ────────────────────────────────────────── */}
          <div className="mb-[4mm]">
            <table className="w-full text-sm leading-tight" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="border-b-2 border-yellow-400">
                  <th className="text-left py-[2mm] px-[1.5mm] text-[9px] font-bold text-yellow-600 uppercase tracking-wider">Deskripsi</th>
                  <th className="text-center py-[2mm] px-[1.5mm] text-[9px] font-bold text-yellow-600 uppercase tracking-wider">Qty</th>
                  <th className="text-right py-[2mm] px-[1.5mm] text-[9px] font-bold text-yellow-600 uppercase tracking-wider">Harga</th>
                  <th className="text-right py-[2mm] px-[1.5mm] text-[9px] font-bold text-yellow-600 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 10).map((item, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100"
                    style={{ backgroundColor: i % 2 === 1 ? '#f9fafb' : 'transparent' }}
                  >
                    <td className={`text-[10px] text-gray-700 ${isCompact ? 'py-[1.5mm]' : 'py-[2mm]'} px-[1.5mm]`}>
                      {item.description || '-'}
                    </td>
                    <td className={`text-[10px] text-gray-700 text-center ${isCompact ? 'py-[1.5mm]' : 'py-[2mm]'} px-[1.5mm]`}>
                      {item.quantity}
                    </td>
                    <td className={`text-[10px] text-gray-700 text-right ${isCompact ? 'py-[1.5mm]' : 'py-[2mm]'} px-[1.5mm]`}>
                      {formatCurrency(item.price)}
                    </td>
                    <td className={`text-[10px] text-gray-800 text-right font-semibold ${isCompact ? 'py-[1.5mm]' : 'py-[2mm]'} px-[1.5mm]`}>
                      {formatCurrency(item.quantity * item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Totals + Notes ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-6 flex-1">
            {/* Notes */}
            <div>
              {notes && (
                <>
                  <h3 className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest mb-[2mm]">Catatan:</h3>
                  <div className="border border-gray-200 rounded bg-gray-50 p-[2mm] text-[9px] text-gray-600 whitespace-pre-line"
                    style={{ minHeight: '12mm' }}>
                    {notes}
                  </div>
                </>
              )}
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full" style={{ maxWidth: '60mm' }}>
                <div className="flex justify-between py-[1mm]">
                  <span className="text-[10px] text-gray-500">Subtotal</span>
                  <span className="text-[10px] font-semibold text-gray-800">{formatCurrency(subtotal)}</span>
                </div>
                {taxPercent > 0 && (
                  <div className="flex justify-between py-[1mm]">
                    <span className="text-[10px] text-gray-500">Pajak ({taxPercent}%)</span>
                    <span className="text-[10px] font-semibold text-gray-800">{formatCurrency(tax)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-[2mm] mt-[1mm] border-t-2 border-yellow-400">
                  <span className="text-[14px] font-extrabold text-yellow-500">TOTAL</span>
                  <span className="text-[14px] font-extrabold text-yellow-500">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ─────────────────────────────────────────────── */}
          <div className="flex justify-between items-end mt-auto pt-[4mm] border-t border-gray-200">
            <p className="text-[9px] text-gray-400">
              Invoice ini dikirim oleh <span className="font-semibold text-yellow-500">{companyName}</span>
            </p>
            <p className="text-[8px] text-gray-300">NotaBener</p>
          </div>
        </div>
      </div>

      {/* ── Print Button ───────────────────────────────────────────── */}
      {showPrintButton && (
        <div className="mt-6 text-center print:hidden">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-6 py-3 font-bold text-black bg-yellow-400 rounded-lg hover:bg-yellow-500 transition-colors shadow-lg"
          >
            <Printer className="w-5 h-5" />
            Print Invoice
          </button>
        </div>
      )}
    </div>
  )
}
