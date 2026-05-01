'use client'

import { useRef } from 'react'
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
  layoutType?: 'professional' | 'modern' | 'minimalist'
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
  layoutType?: 'professional' | 'modern' | 'minimalist'
}

// ── Shared helpers ──────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

const formatDate = (date: Date | null) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const statusLabels: Record<string, string> = {
  DRAFT: 'DRAFT', SENT: 'TERKIRIM', PENDING: 'MENUNGGU',
  PAID: 'LUNAS', OVERDUE: 'JATUH TEMPO', CANCELLED: 'BATAL', CANCELED: 'BATAL',
}

const statusBgColors: Record<string, string> = {
  DRAFT: '#94a3b8', SENT: '#22c55e', PENDING: '#f59e0b',
  PAID: '#22c55e', OVERDUE: '#ef4444', CANCELLED: '#94a3b8', CANCELED: '#94a3b8',
}

// ═══════════════════════════════════════════════════════════════
// PROFESSIONAL LAYOUT
// ═══════════════════════════════════════════════════════════════

function ProfessionalPrintLayout({ invoice, settings, accentColor, logoUrl }: {
  invoice: Invoice
  settings: InvoiceSettings
  accentColor: string
  logoUrl: string | null
}) {
  return (
    <div style={{ padding: '5mm 16mm', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="flex justify-between items-start" style={{ marginBottom: '7mm' }}>
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <div className="flex items-center justify-center border rounded overflow-hidden" style={{ width: '26mm', height: '16mm', borderColor: '#e2e8f0', backgroundColor: '#f8fafc' }}>
              <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain p-1" />
            </div>
          ) : (
            <div className="flex items-center justify-center rounded" style={{ width: '11mm', height: '11mm', backgroundColor: accentColor }}>
              <FileText className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
        <div className="text-right">
          <h1 className="font-extrabold leading-none" style={{ fontSize: '38px', color: accentColor, marginBottom: '2mm', letterSpacing: '-0.5px' }}>INVOICE</h1>
          <p className="font-mono" style={{ fontSize: '11px', color: '#64748b', marginBottom: '3mm' }}>{invoice.invoiceNumber}</p>
          <span style={{ backgroundColor: statusBgColors[invoice.status] || '#94a3b8', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '4px 12px', borderRadius: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {statusLabels[invoice.status] || invoice.status}
          </span>
        </div>
      </div>

      {/* Date Fields */}
      <div className="flex gap-6" style={{ marginBottom: '5mm', paddingBottom: '5mm', borderBottom: '1px solid #e2e8f0' }}>
        <div>
          <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tanggal</span>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b', marginTop: '1mm' }}>{formatDate(invoice.date)}</p>
        </div>
        {invoice.dueDate && (
          <div>
            <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Jatuh Tempo</span>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b', marginTop: '1mm' }}>{formatDate(invoice.dueDate)}</p>
          </div>
        )}
      </div>

      {/* DARI & KEPADA */}
      <div className="grid grid-cols-2 gap-6" style={{ marginBottom: '5mm', paddingBottom: '5mm', borderBottom: '1px solid #e2e8f0' }}>
        <div>
          <h3 style={{ fontSize: '9px', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2mm' }}>Dari:</h3>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', marginBottom: '0.5mm' }}>{invoice.companyName}</p>
          <p style={{ fontSize: '10px', color: '#475569', marginBottom: '0.5mm' }}>{invoice.companyEmail}</p>
          {invoice.companyPhone && <p style={{ fontSize: '10px', color: '#475569', marginBottom: '0.5mm' }}>{invoice.companyPhone}</p>}
          {invoice.companyAddress && <p style={{ fontSize: '10px', color: '#475569', whiteSpace: 'pre-line' }}>{invoice.companyAddress}</p>}
        </div>
        {settings.showClientInfo && (
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ fontSize: '9px', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2mm' }}>Kepada:</h3>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', marginBottom: '0.5mm' }}>{invoice.clientName}</p>
            <p style={{ fontSize: '10px', color: '#475569', marginBottom: '0.5mm' }}>{invoice.clientEmail}</p>
            {invoice.clientPhone && <p style={{ fontSize: '10px', color: '#475569', marginBottom: '0.5mm' }}>{invoice.clientPhone}</p>}
            {invoice.clientAddress && <p style={{ fontSize: '10px', color: '#475569', whiteSpace: 'pre-line' }}>{invoice.clientAddress}</p>}
          </div>
        )}
      </div>

      {/* Items Table */}
      <div style={{ marginBottom: '5mm' }}>
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${accentColor}` }}>
              <th className="text-left" style={{ padding: '2mm 1.5mm', fontWeight: 700, fontSize: '9px', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Deskripsi</th>
              <th className="text-center" style={{ padding: '2mm 1.5mm', fontWeight: 700, fontSize: '9px', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty</th>
              <th className="text-right" style={{ padding: '2mm 1.5mm', fontWeight: 700, fontSize: '9px', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Harga</th>
              <th className="text-right" style={{ padding: '2mm 1.5mm', fontWeight: 700, fontSize: '9px', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: index % 2 === 0 ? 'transparent' : '#f8fafc' }}>
                <td style={{ padding: '2mm 1.5mm', fontSize: '10px', color: '#334155' }}>{item.description || '-'}</td>
                <td style={{ padding: '2mm 1.5mm', fontSize: '10px', color: '#334155', textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ padding: '2mm 1.5mm', fontSize: '10px', color: '#334155', textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                <td style={{ padding: '2mm 1.5mm', fontSize: '10px', color: '#1e293b', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.quantity * item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals + Notes */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          {invoice.notes && (
            <>
              <h3 style={{ fontSize: '9px', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2mm' }}>Catatan:</h3>
              <div style={{ padding: '2mm', border: '1px solid #e2e8f0', borderRadius: '3px', backgroundColor: '#f8fafc', minHeight: '14mm', fontSize: '9px', color: '#475569', whiteSpace: 'pre-line' }}>{invoice.notes}</div>
            </>
          )}
        </div>
        <div className="flex justify-end">
          <div style={{ width: '100%', maxWidth: '60mm' }}>
            <div className="flex justify-between" style={{ padding: '1mm 0' }}>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Subtotal</span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#1e293b' }}>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {settings.showDiscount && invoice.discountAmount && invoice.discountAmount > 0 && (
              <div className="flex justify-between" style={{ padding: '1mm 0' }}>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Diskon {invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}</span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#16a34a' }}>-{formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}
            {settings.showAdditionalDiscount && invoice.additionalDiscountAmount && invoice.additionalDiscountAmount > 0 && (
              <div className="flex justify-between" style={{ padding: '1mm 0' }}>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Diskon Tambahan {invoice.additionalDiscountType === 'percentage' ? `(${invoice.additionalDiscountValue}%)` : ''}</span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#16a34a' }}>-{formatCurrency(invoice.additionalDiscountAmount)}</span>
              </div>
            )}
            {settings.showTax && (
              <div className="flex justify-between" style={{ padding: '1mm 0' }}>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Pajak ({invoice.taxRate}%)</span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#1e293b' }}>{formatCurrency(invoice.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between" style={{ paddingTop: '2mm', marginTop: '1mm', borderTop: `2px solid ${accentColor}` }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: accentColor }}>TOTAL</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: accentColor }}>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Signature */}
      {((invoice.termsAndConditions) || (settings.showSignature && (invoice.signatureUrl || invoice.signatoryName))) && (
        <div className="grid grid-cols-2 gap-6 flex-1" style={{ marginTop: '3mm' }}>
          <div>
            {invoice.termsAndConditions && (
              <>
                <h3 style={{ fontSize: '9px', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2mm' }}>Syarat & Ketentuan:</h3>
                <div style={{ padding: '2mm', border: '1px solid #e2e8f0', borderRadius: '3px', backgroundColor: '#f8fafc', minHeight: '14mm', fontSize: '8px', color: '#475569', whiteSpace: 'pre-line' }}>{invoice.termsAndConditions}</div>
              </>
            )}
          </div>
          <div className="flex justify-end items-end">
            {settings.showSignature && (invoice.signatureUrl || invoice.signatoryName) && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-block', textAlign: 'center' }}>
                  {invoice.signatureUrl && (
                    <div style={{ marginBottom: '1mm', paddingBottom: '1mm', borderBottom: '1px solid #94a3b8' }}>
                      <img src={invoice.signatureUrl} alt="Tanda tangan" className="h-14 object-contain mx-auto" />
                    </div>
                  )}
                  {invoice.signatoryName && <p style={{ fontWeight: 700, fontSize: '10px', color: '#1e293b' }}>{invoice.signatoryName}</p>}
                  {invoice.signatoryTitle && <p style={{ fontSize: '9px', color: '#64748b' }}>{invoice.signatoryTitle}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-end" style={{ marginTop: 'auto', paddingTop: '4mm', borderTop: '1px solid #e2e8f0' }}>
        <p style={{ fontSize: '9px', color: '#94a3b8' }}>Invoice ini dikirim oleh <span style={{ fontWeight: 600, color: accentColor }}>{invoice.companyName}</span></p>
        <p style={{ fontSize: '8px', color: '#cbd5e1' }}>NotaBener</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MODERN LAYOUT
// ═══════════════════════════════════════════════════════════════

function ModernPrintLayout({ invoice, settings }: {
  invoice: Invoice
  settings: InvoiceSettings
}) {
  const accent = '#8B5CF6'
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Gradient header band */}
      <div style={{ backgroundColor: accent, padding: '7mm 16mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>{invoice.companyName?.charAt(0)?.toUpperCase() || 'N'}</span>
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>{invoice.companyName}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '32px', lineHeight: 1, margin: 0 }}>INVOICE</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', marginTop: '2px', marginBottom: '4px' }}>{invoice.invoiceNumber}</p>
          <span style={{ backgroundColor: `${statusBgColors[invoice.status] || '#94a3b8'}66`, color: '#fff', fontSize: '9px', fontWeight: 700, padding: '3px 10px', borderRadius: '10px', textTransform: 'uppercase' }}>
            {statusLabels[invoice.status] || invoice.status}
          </span>
        </div>
      </div>

      <div style={{ padding: '5mm 16mm', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Date Fields */}
        <div className="flex gap-6" style={{ marginBottom: '5mm', paddingBottom: '4mm', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <span style={{ fontSize: '8px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tanggal</span>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b', marginTop: '1mm' }}>{formatDate(invoice.date)}</p>
          </div>
          {invoice.dueDate && (
            <div>
              <span style={{ fontSize: '8px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Jatuh Tempo</span>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b', marginTop: '1mm' }}>{formatDate(invoice.dueDate)}</p>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '5mm' }}>
          <div style={{ padding: '4mm', borderRadius: '6px', backgroundColor: '#faf5ff', border: '1px solid #ede9fe' }}>
            <h3 style={{ fontSize: '8px', fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2mm' }}>Dari:</h3>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', marginBottom: '0.5mm' }}>{invoice.companyName}</p>
            <p style={{ fontSize: '10px', color: '#475569', marginBottom: '0.5mm' }}>{invoice.companyEmail}</p>
            {invoice.companyPhone && <p style={{ fontSize: '10px', color: '#475569', marginBottom: '0.5mm' }}>{invoice.companyPhone}</p>}
            {invoice.companyAddress && <p style={{ fontSize: '10px', color: '#475569', whiteSpace: 'pre-line' }}>{invoice.companyAddress}</p>}
          </div>
          {settings.showClientInfo && (
            <div style={{ padding: '4mm', borderRadius: '6px', backgroundColor: '#faf5ff', border: '1px solid #ede9fe' }}>
              <h3 style={{ fontSize: '8px', fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2mm' }}>Kepada:</h3>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', marginBottom: '0.5mm' }}>{invoice.clientName}</p>
              <p style={{ fontSize: '10px', color: '#475569', marginBottom: '0.5mm' }}>{invoice.clientEmail}</p>
              {invoice.clientPhone && <p style={{ fontSize: '10px', color: '#475569', marginBottom: '0.5mm' }}>{invoice.clientPhone}</p>}
              {invoice.clientAddress && <p style={{ fontSize: '10px', color: '#475569', whiteSpace: 'pre-line' }}>{invoice.clientAddress}</p>}
            </div>
          )}
        </div>

        {/* Items Table */}
        <div style={{ marginBottom: '5mm' }}>
          <table className="w-full" style={{ borderCollapse: 'collapse', borderRadius: '6px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ backgroundColor: accent }}>
                <th className="text-left" style={{ padding: '3mm 2mm', fontWeight: 700, fontSize: '9px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Deskripsi</th>
                <th className="text-center" style={{ padding: '3mm 2mm', fontWeight: 700, fontSize: '9px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty</th>
                <th className="text-right" style={{ padding: '3mm 2mm', fontWeight: 700, fontSize: '9px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Harga</th>
                <th className="text-right" style={{ padding: '3mm 2mm', fontWeight: 700, fontSize: '9px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: index % 2 === 0 ? 'transparent' : '#faf5ff' }}>
                  <td style={{ padding: '2mm 2mm', fontSize: '10px', color: '#334155' }}>{item.description || '-'}</td>
                  <td style={{ padding: '2mm 2mm', fontSize: '10px', color: '#334155', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '2mm 2mm', fontSize: '10px', color: '#334155', textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                  <td style={{ padding: '2mm 2mm', fontSize: '10px', color: '#1e293b', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.quantity * item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Card */}
        <div style={{ padding: '4mm', borderRadius: '6px', backgroundColor: '#faf5ff', border: '1px solid #ede9fe', marginBottom: '5mm' }}>
          <div style={{ maxWidth: '65mm', marginLeft: 'auto' }}>
            <div className="flex justify-between" style={{ padding: '1mm 0' }}>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Subtotal</span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#1e293b' }}>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {settings.showDiscount && invoice.discountAmount && invoice.discountAmount > 0 && (
              <div className="flex justify-between" style={{ padding: '1mm 0' }}>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Diskon {invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}</span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#16a34a' }}>-{formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}
            {settings.showAdditionalDiscount && invoice.additionalDiscountAmount && invoice.additionalDiscountAmount > 0 && (
              <div className="flex justify-between" style={{ padding: '1mm 0' }}>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Diskon Tambahan {invoice.additionalDiscountType === 'percentage' ? `(${invoice.additionalDiscountValue}%)` : ''}</span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#16a34a' }}>-{formatCurrency(invoice.additionalDiscountAmount)}</span>
              </div>
            )}
            {settings.showTax && (
              <div className="flex justify-between" style={{ padding: '1mm 0' }}>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Pajak ({invoice.taxRate}%)</span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#1e293b' }}>{formatCurrency(invoice.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between" style={{ paddingTop: '2mm', marginTop: '1mm', borderTop: `2px solid ${accent}` }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: accent }}>TOTAL</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: accent }}>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div style={{ marginBottom: '3mm' }}>
            <h3 style={{ fontSize: '8px', fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2mm' }}>Catatan:</h3>
            <p style={{ fontSize: '9px', color: '#475569', whiteSpace: 'pre-line' }}>{invoice.notes}</p>
          </div>
        )}

        {/* Terms */}
        {invoice.termsAndConditions && (
          <div style={{ marginBottom: '3mm' }}>
            <h3 style={{ fontSize: '8px', fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2mm' }}>Syarat & Ketentuan:</h3>
            <p style={{ fontSize: '8px', color: '#475569', whiteSpace: 'pre-line' }}>{invoice.termsAndConditions}</p>
          </div>
        )}

        {/* Signature */}
        {settings.showSignature && (invoice.signatureUrl || invoice.signatoryName) && (
          <div style={{ textAlign: 'right', marginTop: '3mm' }}>
            <div style={{ display: 'inline-block', textAlign: 'center' }}>
              {invoice.signatureUrl && (
                <div style={{ marginBottom: '1mm', paddingBottom: '1mm', borderBottom: '1px solid #94a3b8' }}>
                  <img src={invoice.signatureUrl} alt="Tanda tangan" className="h-14 object-contain mx-auto" />
                </div>
              )}
              {invoice.signatoryName && <p style={{ fontWeight: 700, fontSize: '10px', color: '#1e293b' }}>{invoice.signatoryName}</p>}
              {invoice.signatoryTitle && <p style={{ fontSize: '9px', color: '#64748b' }}>{invoice.signatoryTitle}</p>}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-end" style={{ marginTop: 'auto', paddingTop: '4mm', borderTop: '0.5px solid #e2e8f0' }}>
          <p style={{ fontSize: '9px', color: '#94a3b8' }}>Invoice ini dikirim oleh <span style={{ fontWeight: 600, color: accent }}>{invoice.companyName}</span></p>
          <p style={{ fontSize: '8px', color: '#cbd5e1', fontWeight: 700 }}>NotaBener</p>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MINIMALIST LAYOUT
// ═══════════════════════════════════════════════════════════════

function MinimalistPrintLayout({ invoice, settings }: {
  invoice: Invoice
  settings: InvoiceSettings
}) {
  return (
    <div style={{ padding: '8mm 18mm', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header - clean, no decoration */}
      <div className="flex justify-between items-end" style={{ marginBottom: '8mm' }}>
        <div>
          <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '3px', margin: 0 }}>Invoice</h1>
          <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '1mm' }}>{invoice.invoiceNumber}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '10px', color: '#6b7280' }}>{formatDate(invoice.date)}</p>
          {invoice.dueDate && <p style={{ fontSize: '10px', color: '#6b7280' }}>Jatuh Tempo: {formatDate(invoice.dueDate)}</p>}
        </div>
      </div>

      {/* Info - simple columns */}
      <div className="grid grid-cols-2 gap-8" style={{ marginBottom: '7mm' }}>
        <div>
          <p style={{ fontSize: '7px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2mm' }}>Dari</p>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#111827', marginBottom: '0.5mm' }}>{invoice.companyName}</p>
          <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '0.5mm' }}>{invoice.companyEmail}</p>
          {invoice.companyPhone && <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '0.5mm' }}>{invoice.companyPhone}</p>}
          {invoice.companyAddress && <p style={{ fontSize: '10px', color: '#6b7280', whiteSpace: 'pre-line' }}>{invoice.companyAddress}</p>}
        </div>
        {settings.showClientInfo && (
          <div>
            <p style={{ fontSize: '7px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2mm' }}>Kepada</p>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#111827', marginBottom: '0.5mm' }}>{invoice.clientName}</p>
            <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '0.5mm' }}>{invoice.clientEmail}</p>
            {invoice.clientPhone && <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '0.5mm' }}>{invoice.clientPhone}</p>}
            {invoice.clientAddress && <p style={{ fontSize: '10px', color: '#6b7280', whiteSpace: 'pre-line' }}>{invoice.clientAddress}</p>}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: '0.5px', backgroundColor: '#e5e7eb', marginBottom: '6mm' }} />

      {/* Items Table - no decoration */}
      <div style={{ marginBottom: '6mm' }}>
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid #d1d5db' }}>
              <th className="text-left" style={{ padding: '2mm 1mm', fontWeight: 600, fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>Deskripsi</th>
              <th className="text-center" style={{ padding: '2mm 1mm', fontWeight: 600, fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>Qty</th>
              <th className="text-right" style={{ padding: '2mm 1mm', fontWeight: 600, fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>Harga</th>
              <th className="text-right" style={{ padding: '2mm 1mm', fontWeight: 600, fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} style={{ borderBottom: '0.25px solid #f3f4f6' }}>
                <td style={{ padding: '2mm 1mm', fontSize: '10px', color: '#374151' }}>{item.description || '-'}</td>
                <td style={{ padding: '2mm 1mm', fontSize: '10px', color: '#374151', textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ padding: '2mm 1mm', fontSize: '10px', color: '#374151', textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                <td style={{ padding: '2mm 1mm', fontSize: '10px', color: '#111827', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.quantity * item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Divider */}
      <div style={{ height: '0.5px', backgroundColor: '#e5e7eb', marginBottom: '5mm' }} />

      {/* Totals - left-aligned */}
      <div style={{ marginBottom: '6mm' }}>
        <div style={{ maxWidth: '65mm' }}>
          <div className="flex justify-between" style={{ padding: '1mm 0' }}>
            <span style={{ fontSize: '10px', color: '#6b7280' }}>Subtotal</span>
            <span style={{ fontSize: '10px', color: '#374151' }}>{formatCurrency(invoice.subtotal)}</span>
          </div>
          {settings.showDiscount && invoice.discountAmount && invoice.discountAmount > 0 && (
            <div className="flex justify-between" style={{ padding: '1mm 0' }}>
              <span style={{ fontSize: '10px', color: '#6b7280' }}>Diskon {invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}</span>
              <span style={{ fontSize: '10px', color: '#16a34a' }}>-{formatCurrency(invoice.discountAmount)}</span>
            </div>
          )}
          {settings.showAdditionalDiscount && invoice.additionalDiscountAmount && invoice.additionalDiscountAmount > 0 && (
            <div className="flex justify-between" style={{ padding: '1mm 0' }}>
              <span style={{ fontSize: '10px', color: '#6b7280' }}>Diskon Tambahan {invoice.additionalDiscountType === 'percentage' ? `(${invoice.additionalDiscountValue}%)` : ''}</span>
              <span style={{ fontSize: '10px', color: '#16a34a' }}>-{formatCurrency(invoice.additionalDiscountAmount)}</span>
            </div>
          )}
          {settings.showTax && (
            <div className="flex justify-between" style={{ padding: '1mm 0' }}>
              <span style={{ fontSize: '10px', color: '#6b7280' }}>Pajak ({invoice.taxRate}%)</span>
              <span style={{ fontSize: '10px', color: '#374151' }}>{formatCurrency(invoice.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between" style={{ paddingTop: '2mm', marginTop: '2mm' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>TOTAL</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div style={{ marginBottom: '3mm' }}>
          <p style={{ fontSize: '9px', color: '#6b7280', whiteSpace: 'pre-line', lineHeight: 1.5 }}>{invoice.notes}</p>
        </div>
      )}

      {/* Terms */}
      {invoice.termsAndConditions && (
        <div style={{ marginBottom: '3mm' }}>
          <p style={{ fontSize: '8px', color: '#6b7280', whiteSpace: 'pre-line', lineHeight: 1.5 }}>{invoice.termsAndConditions}</p>
        </div>
      )}

      {/* Signature */}
      {settings.showSignature && (invoice.signatureUrl || invoice.signatoryName) && (
        <div style={{ textAlign: 'right', marginTop: '3mm' }}>
          <div style={{ display: 'inline-block', textAlign: 'center' }}>
            {invoice.signatureUrl && (
              <div style={{ marginBottom: '1mm', paddingBottom: '1mm', borderBottom: '0.5px solid #d1d5db' }}>
                <img src={invoice.signatureUrl} alt="Tanda tangan" className="h-14 object-contain mx-auto" />
              </div>
            )}
            {invoice.signatoryName && <p style={{ fontWeight: 700, fontSize: '10px', color: '#111827' }}>{invoice.signatoryName}</p>}
            {invoice.signatoryTitle && <p style={{ fontSize: '9px', color: '#6b7280' }}>{invoice.signatoryTitle}</p>}
          </div>
        </div>
      )}

      {/* Footer - minimal */}
      <div className="flex justify-between items-end" style={{ marginTop: 'auto', paddingTop: '6mm' }}>
        <p style={{ fontSize: '8px', color: '#d1d5db' }}>{invoice.companyName || 'NotaBener'}</p>
        <p style={{ fontSize: '8px', color: '#d1d5db', fontWeight: 600 }}>NotaBener</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function InvoicePrintView({ invoice, branding, layoutType }: InvoicePrintViewProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${invoice.invoiceNumber}`,
  })

  const onPrint = async () => {
    await document.fonts.ready
    handlePrint()
  }

  const settings: InvoiceSettings = {
    showClientInfo: invoice.settings?.showClientInfo ?? true,
    showDiscount: invoice.settings?.showDiscount ?? false,
    showAdditionalDiscount: invoice.settings?.showAdditionalDiscount ?? false,
    showTax: invoice.settings?.showTax ?? true,
    showSignature: invoice.settings?.showSignature ?? false,
  }

  const accentColor = branding?.accentColor || '#0F766E'
  const logoUrl = branding?.showLogo ? branding?.logoUrl : null
  const layout = layoutType || invoice.settings?.layoutType || 'professional'

  const LayoutComponent = layout === 'modern' ? ModernPrintLayout
    : layout === 'minimalist' ? MinimalistPrintLayout
    : ProfessionalPrintLayout

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-8 px-4 print:p-0 print:m-0 print:min-h-0 print:h-[297mm] print:w-[210mm] font-sans"
      style={{ background: '#E5E7EB' }}
    >
      <div
        ref={printRef}
        className="bg-white shadow-2xl overflow-hidden font-sans"
        style={{ width: '210mm', height: '297mm', maxWidth: '100%' }}
      >
        {layout === 'modern' ? (
          <ModernPrintLayout invoice={invoice} settings={settings} />
        ) : layout === 'minimalist' ? (
          <MinimalistPrintLayout invoice={invoice} settings={settings} />
        ) : (
          <ProfessionalPrintLayout invoice={invoice} settings={settings} accentColor={accentColor} logoUrl={logoUrl} />
        )}
      </div>

      {/* Print Button */}
      <div className="mt-6 text-center print:hidden">
        <button
          onClick={onPrint}
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
