'use client'

import { useRef, useEffect, useState } from 'react'
import { Printer } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────

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

type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELED'

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
  status?: InvoiceStatus
  showPrintButton?: boolean
}

// ─── Constants ───────────────────────────────────────────────────────────

const FONT_STACK = "'Inter', system-ui, -apple-system, sans-serif"

const ACCENT = '#0F766E' // teal — section labels, borders

const STATUS_COLORS: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT:    { label: 'DRAFT',       bg: '#94a3b8', color: '#ffffff' },
  SENT:     { label: 'TERKIRIM',    bg: '#22c55e', color: '#ffffff' },
  PAID:     { label: 'LUNAS',       bg: '#22c55e', color: '#ffffff' },
  OVERDUE:  { label: 'JATUH TEMPO', bg: '#ef4444', color: '#ffffff' },
  CANCELED: { label: 'BATAL',       bg: '#94a3b8', color: '#ffffff' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────

const toRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)

const toLocaleDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

// ─── Sub-components ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.DRAFT
  return (
    <span
      style={{
        backgroundColor: s.bg,
        color: s.color,
        fontSize: '10px',
        fontWeight: 700,
        padding: '4px 12px',
        borderRadius: '4px',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
      }}
    >
      {s.label}
    </span>
  )
}

function ContactBlock({
  label,
  contact,
  align = 'left',
}: {
  label: string
  contact: ContactInfo
  align?: 'left' | 'right'
}) {
  const base = { textAlign: align } as const
  return (
    <div style={base}>
      <h3
        style={{
          fontSize: '9px',
          fontWeight: 700,
          color: ACCENT,
          textTransform: 'uppercase' as const,
          letterSpacing: '1px',
          marginBottom: '2mm',
        }}
      >
        {label}
      </h3>
      <p style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', lineHeight: 1.4 }}>{contact.name}</p>
      <p style={{ fontSize: '10px', color: '#475569', lineHeight: 1.4 }}>{contact.email}</p>
      {contact.phone && <p style={{ fontSize: '10px', color: '#475569', lineHeight: 1.4 }}>{contact.phone}</p>}
      {contact.address && (
        <p style={{ fontSize: '10px', color: '#475569', lineHeight: 1.4, whiteSpace: 'pre-line' as const }}>
          {contact.address}
        </p>
      )}
    </div>
  )
}

function InvoiceSummary({
  subtotal,
  tax,
  taxPercent,
  total,
}: {
  subtotal: number
  tax: number
  taxPercent: number
  total: number
}) {
  return (
    <div style={{ width: '100%', maxWidth: '60mm' }}>
      {/* Subtotal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1mm 0' }}>
        <span style={{ fontSize: '10px', color: '#64748b' }}>Subtotal</span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#1e293b' }}>{toRupiah(subtotal)}</span>
      </div>
      {/* Tax */}
      {taxPercent > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1mm 0' }}>
          <span style={{ fontSize: '10px', color: '#64748b' }}>Pajak ({taxPercent}%)</span>
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#1e293b' }}>{toRupiah(tax)}</span>
        </div>
      )}
      {/* Total */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: '2mm',
          marginTop: '1mm',
          borderTop: `2px solid ${ACCENT}`,
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 800, color: ACCENT }}>TOTAL</span>
        <span style={{ fontSize: '14px', fontWeight: 800, color: ACCENT }}>{toRupiah(total)}</span>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────

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
    const id = 'invoice-google-fonts'
    if (!document.getElementById(id)) {
      const link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
      document.head.appendChild(link)
    }
    document.fonts.ready.then(() => setFontsLoaded(true))
  }, [])

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  const tax = subtotal * (taxPercent / 100)
  const total = subtotal + tax

  // Compact mode for many items
  const isCompact = items.length > 8

  return (
    <div
      className="flex flex-col items-center py-8 px-4 print:py-0 print:px-0"
      style={{ background: '#E5E7EB', fontFamily: FONT_STACK }}
    >
      {/* ── A4 Page ──────────────────────────────────────────────────── */}
      <div
        ref={printRef}
        className="bg-white print:shadow-none"
        style={{
          width: '210mm',
          height: '297mm',
          maxWidth: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            padding: '0 16mm',
            fontFamily: FONT_STACK,
          }}
        >
          {/* ── Header ──────────────────────────────────────────────── */}
          <div
            className="flex justify-between items-start"
            style={{ marginTop: '6mm', marginBottom: '5mm', breakInside: 'avoid' }}
          >
            {/* Logo */}
            <div className="flex items-center">
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
                  <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain p-1" />
                </div>
              ) : (
                <div
                  className="flex items-center justify-center rounded"
                  style={{ width: '11mm', height: '11mm', backgroundColor: ACCENT }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
              )}
            </div>

            {/* Title + number + badge */}
            <div className="text-right">
              <h1 style={{ fontSize: '38px', fontWeight: 800, color: '#1e293b', lineHeight: 1, letterSpacing: '-0.5px' }}>
                INVOICE
              </h1>
              <p style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginTop: '2mm', marginBottom: '3mm' }}>
                {invoiceNumber}
              </p>
              <StatusBadge status={status} />
            </div>
          </div>

          {/* ── Date Fields ─────────────────────────────────────────── */}
          <div
            className="flex gap-6"
            style={{
              marginBottom: '4mm',
              paddingBottom: '4mm',
              borderBottom: '1px solid #e2e8f0',
              breakInside: 'avoid',
            }}
          >
            <div>
              <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Tanggal
              </span>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b', marginTop: '1mm' }}>
                {toLocaleDate(date)}
              </p>
            </div>
            {dueDate && (
              <div>
                <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Jatuh Tempo
                </span>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b', marginTop: '1mm' }}>
                  {toLocaleDate(dueDate)}
                </p>
              </div>
            )}
          </div>

          {/* ── DARI / KEPADA ────────────────────────────────────────── */}
          <div
            className="grid grid-cols-2 gap-6"
            style={{
              marginBottom: '4mm',
              paddingBottom: '4mm',
              borderBottom: '1px solid #e2e8f0',
              breakInside: 'avoid',
            }}
          >
            <ContactBlock label="Dari:" contact={from} align="left" />
            <ContactBlock label="Kepada:" contact={to} align="right" />
          </div>

          {/* ── Items Table ──────────────────────────────────────────── */}
          <div style={{ marginBottom: '4mm', breakInside: 'avoid' }}>
            <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: '10px', lineHeight: 1.4 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${ACCENT}` }}>
                  <th style={{ padding: '2mm 1.5mm', fontWeight: 700, fontSize: '9px', color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>
                    Deskripsi
                  </th>
                  <th style={{ padding: '2mm 1.5mm', fontWeight: 700, fontSize: '9px', color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
                    Qty
                  </th>
                  <th style={{ padding: '2mm 1.5mm', fontWeight: 700, fontSize: '9px', color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>
                    Harga
                  </th>
                  <th style={{ padding: '2mm 1.5mm', fontWeight: 700, fontSize: '9px', color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 10).map((item, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      backgroundColor: i % 2 === 1 ? '#f8fafc' : 'transparent',
                    }}
                  >
                    <td style={{ padding: isCompact ? '1.5mm 1.5mm' : '2mm 1.5mm', color: '#334155' }}>
                      {item.description || '-'}
                    </td>
                    <td style={{ padding: isCompact ? '1.5mm 1.5mm' : '2mm 1.5mm', color: '#334155', textAlign: 'center' }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: isCompact ? '1.5mm 1.5mm' : '2mm 1.5mm', color: '#334155', textAlign: 'right' }}>
                      {toRupiah(item.price)}
                    </td>
                    <td style={{ padding: isCompact ? '1.5mm 1.5mm' : '2mm 1.5mm', color: '#1e293b', textAlign: 'right', fontWeight: 600 }}>
                      {toRupiah(item.quantity * item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Notes + Totals ───────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-6 flex-1" style={{ breakInside: 'avoid' }}>
            {/* Notes */}
            <div>
              {notes && (
                <>
                  <h3
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      color: ACCENT,
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
                      minHeight: '12mm',
                      fontSize: '9px',
                      color: '#475569',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {notes}
                  </div>
                </>
              )}
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <InvoiceSummary subtotal={subtotal} tax={tax} taxPercent={taxPercent} total={total} />
            </div>
          </div>

          {/* ── Footer ──────────────────────────────────────────────── */}
          <div
            className="flex justify-between items-end"
            style={{
              marginTop: 'auto',
              paddingTop: '4mm',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <p style={{ fontSize: '9px', color: '#94a3b8' }}>
              Invoice ini dikirim oleh <span style={{ fontWeight: 600, color: ACCENT }}>{companyName}</span>
            </p>
            <p style={{ fontSize: '8px', color: '#cbd5e1' }}>NotaBener</p>
          </div>
        </div>
      </div>

      {/* ── Print Button ──────────────────────────────────────────────── */}
      {showPrintButton && (
        <div className="mt-6 text-center print:hidden">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition-all shadow-lg text-white hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
          >
            <Printer className="w-5 h-5" />
            Print Invoice
          </button>
        </div>
      )}
    </div>
  )
}
