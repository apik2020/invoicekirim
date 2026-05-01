import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import { invoices, invoice_items } from '@prisma/client'

interface InvoiceWithItems extends Omit<invoices, 'invoice_items'> {
  items: invoice_items[]
}

interface InvoicePDFProps {
  invoice: InvoiceWithItems
  layoutType?: 'professional' | 'modern' | 'minimalist'
}

// ── Shared helpers ──────────────────────────────────────────────

const statusColors: Record<string, string> = {
  DRAFT: '#94a3b8', SENT: '#22c55e', PENDING: '#f59e0b',
  PAID: '#22c55e', OVERDUE: '#ef4444', CANCELLED: '#94a3b8', CANCELED: '#94a3b8',
}
const statusLabels: Record<string, string> = {
  DRAFT: 'DRAFT', SENT: 'TERKIRIM', PENDING: 'MENUNGGU',
  PAID: 'LUNAS', OVERDUE: 'JATUH TEMPO', CANCELLED: 'BATAL', CANCELED: 'BATAL',
}
const fmtCur = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
const fmtDate = (d: Date | string) => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d))

// ═══════════════════════════════════════════════════════════════
// PROFESSIONAL LAYOUT (existing)
// ═══════════════════════════════════════════════════════════════
const P_ACCENT = '#0F766E'

const proStyles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 8.5, paddingTop: 15, paddingBottom: 10, paddingHorizontal: 35, backgroundColor: '#FFFFFF' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 11 },
  logoFallback: { width: 40, height: 40, borderRadius: 4, backgroundColor: P_ACCENT, alignItems: 'center', justifyContent: 'center' },
  logoFallbackText: { color: '#ffffff', fontFamily: 'Helvetica-Bold', fontSize: 14 },
  invoiceTitleRight: { alignItems: 'flex-end' },
  invoiceTitle: { fontSize: 32, fontFamily: 'Helvetica-Bold', color: P_ACCENT, lineHeight: 1 },
  invoiceNumber: { fontSize: 9, color: '#64748b', marginTop: 3, marginBottom: 6 },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 3 },
  statusText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#ffffff', textTransform: 'uppercase' },
  dateRow: { flexDirection: 'row', gap: 20, marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  dateLabel: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1e293b', marginTop: 2 },
  dariKepadaRow: { flexDirection: 'row', marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  dariKepadaCol: { flex: 1 },
  dariKepadaColRight: { flex: 1, paddingLeft: 20, borderLeftWidth: 1, borderLeftColor: '#e2e8f0' },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: P_ACCENT, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  infoName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1e293b', marginBottom: 2 },
  infoText: { fontSize: 8, color: '#475569', marginBottom: 1.5 },
  table: { marginBottom: 10 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: P_ACCENT, paddingVertical: 5 },
  tableHeaderCell: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: P_ACCENT, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  tableRowAlt: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  tableCell: { fontSize: 8.5, color: '#334155' },
  colDesc: { flex: 3 }, colQty: { flex: 1, textAlign: 'center' }, colPrice: { flex: 2, textAlign: 'right' }, colTotal: { flex: 2, textAlign: 'right' },
  totalsNotesRow: { flexDirection: 'row', gap: 20 },
  notesSection: { flex: 1 },
  notesBox: { padding: 10, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 3, backgroundColor: '#f8fafc', minHeight: 50 },
  notesText: { fontSize: 7.5, color: '#475569', lineHeight: 1.4 },
  totalsSection: { flex: 1, alignItems: 'flex-end' },
  totalsBox: { width: 170 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { fontSize: 8.5, color: '#64748b' },
  totalValue: { fontSize: 8.5, color: '#1e293b' },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, marginTop: 3, borderTopWidth: 2, borderTopColor: P_ACCENT },
  grandTotalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: P_ACCENT },
  grandTotalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: P_ACCENT },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, marginTop: 10, borderTopWidth: 0.5, borderTopColor: '#e2e8f0' },
  footerText: { fontSize: 7.5, color: '#94a3b8' },
  footerCompanyName: { fontSize: 7.5, color: P_ACCENT, fontFamily: 'Helvetica-Bold' },
  footerRight: { fontSize: 7.5, color: '#cbd5e1', fontFamily: 'Helvetica-Bold' },
})

function ProfessionalLayout({ invoice }: { invoice: InvoiceWithItems }) {
  return (
    <Page size="A4" style={proStyles.page}>
      <View style={proStyles.headerRow}>
        <View style={proStyles.logoFallback}>
          <Text style={proStyles.logoFallbackText}>{invoice.companyName?.charAt(0)?.toUpperCase() || 'N'}</Text>
        </View>
        <View style={proStyles.invoiceTitleRight}>
          <Text style={proStyles.invoiceTitle}>INVOICE</Text>
          <Text style={proStyles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          <View style={[proStyles.statusBadge, { backgroundColor: statusColors[invoice.status] || '#94a3b8' }]}>
            <Text style={proStyles.statusText}>{statusLabels[invoice.status] || invoice.status}</Text>
          </View>
        </View>
      </View>

      <View style={proStyles.dateRow}>
        <View><Text style={proStyles.dateLabel}>Tanggal</Text><Text style={proStyles.dateValue}>{fmtDate(invoice.date)}</Text></View>
        {invoice.dueDate && <View><Text style={proStyles.dateLabel}>Jatuh Tempo</Text><Text style={proStyles.dateValue}>{fmtDate(invoice.dueDate)}</Text></View>}
      </View>

      <View style={proStyles.dariKepadaRow}>
        <View style={proStyles.dariKepadaCol}>
          <Text style={proStyles.sectionTitle}>Dari:</Text>
          <Text style={proStyles.infoName}>{invoice.companyName}</Text>
          {invoice.companyEmail && <Text style={proStyles.infoText}>{invoice.companyEmail}</Text>}
          {invoice.companyPhone && <Text style={proStyles.infoText}>{invoice.companyPhone}</Text>}
          {invoice.companyAddress && <Text style={proStyles.infoText}>{invoice.companyAddress}</Text>}
        </View>
        <View style={proStyles.dariKepadaColRight}>
          <Text style={proStyles.sectionTitle}>Kepada:</Text>
          <Text style={proStyles.infoName}>{invoice.clientName}</Text>
          {invoice.clientEmail && <Text style={proStyles.infoText}>{invoice.clientEmail}</Text>}
          {invoice.clientPhone && <Text style={proStyles.infoText}>{invoice.clientPhone}</Text>}
          {invoice.clientAddress && <Text style={proStyles.infoText}>{invoice.clientAddress}</Text>}
        </View>
      </View>

      <View style={proStyles.table}>
        <View style={proStyles.tableHeader}>
          <Text style={[proStyles.tableHeaderCell, proStyles.colDesc]}>Deskripsi</Text>
          <Text style={[proStyles.tableHeaderCell, proStyles.colQty]}>Qty</Text>
          <Text style={[proStyles.tableHeaderCell, proStyles.colPrice]}>Harga</Text>
          <Text style={[proStyles.tableHeaderCell, proStyles.colTotal]}>Total</Text>
        </View>
        {invoice.items.map((item, i) => (
          <View key={i} style={i % 2 === 0 ? proStyles.tableRow : proStyles.tableRowAlt}>
            <Text style={[proStyles.tableCell, proStyles.colDesc]}>{item.description}</Text>
            <Text style={[proStyles.tableCell, proStyles.colQty]}>{item.quantity}</Text>
            <Text style={[proStyles.tableCell, proStyles.colPrice]}>{fmtCur(item.price)}</Text>
            <Text style={[proStyles.tableCell, proStyles.colTotal, { fontFamily: 'Helvetica-Bold', color: '#1e293b' }]}>{fmtCur(item.quantity * item.price)}</Text>
          </View>
        ))}
      </View>

      <View style={proStyles.totalsNotesRow}>
        <View style={proStyles.notesSection}>
          {invoice.notes && <><Text style={proStyles.sectionTitle}>Catatan:</Text><View style={proStyles.notesBox}><Text style={proStyles.notesText}>{invoice.notes}</Text></View></>}
        </View>
        <View style={proStyles.totalsSection}>
          <View style={proStyles.totalsBox}>
            <View style={proStyles.totalRow}><Text style={proStyles.totalLabel}>Subtotal</Text><Text style={proStyles.totalValue}>{fmtCur(invoice.subtotal)}</Text></View>
            {invoice.discountAmount && invoice.discountAmount > 0 && <View style={proStyles.totalRow}><Text style={proStyles.totalLabel}>Diskon {invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}</Text><Text style={[proStyles.totalValue, { color: '#16a34a' }]}>-{fmtCur(invoice.discountAmount)}</Text></View>}
            {invoice.additionalDiscountAmount && invoice.additionalDiscountAmount > 0 && <View style={proStyles.totalRow}><Text style={proStyles.totalLabel}>Diskon Tambahan {invoice.additionalDiscountType === 'percentage' ? `(${invoice.additionalDiscountValue}%)` : ''}</Text><Text style={[proStyles.totalValue, { color: '#16a34a' }]}>-{fmtCur(invoice.additionalDiscountAmount)}</Text></View>}
            <View style={proStyles.totalRow}><Text style={proStyles.totalLabel}>Pajak ({invoice.taxRate}%)</Text><Text style={proStyles.totalValue}>{fmtCur(invoice.taxAmount)}</Text></View>
            <View style={proStyles.grandTotalRow}><Text style={proStyles.grandTotalLabel}>TOTAL</Text><Text style={proStyles.grandTotalValue}>{fmtCur(invoice.total)}</Text></View>
          </View>
        </View>
      </View>

      {(invoice.termsAndConditions || invoice.signatureUrl || invoice.signatoryName) && (
        <View style={proStyles.totalsNotesRow}>
          <View style={proStyles.notesSection}>
            {invoice.termsAndConditions && <><Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: P_ACCENT, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Syarat &amp; Ketentuan:</Text><View style={proStyles.notesBox}><Text style={{ fontSize: 7, color: '#475569', lineHeight: 1.4 }}>{invoice.termsAndConditions}</Text></View></>}
          </View>
          <View style={[proStyles.totalsSection, { justifyContent: 'flex-end' }]}>
            {(invoice.signatureUrl || invoice.signatoryName) && (
              <View style={{ alignItems: 'center', marginTop: 10 }}>
                {invoice.signatureUrl && <View style={{ borderBottomWidth: 1, borderBottomColor: '#94a3b8', paddingBottom: 4, marginBottom: 4 }}><Image src={invoice.signatureUrl} style={{ height: 40 }} /></View>}
                {invoice.signatoryName && <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#1e293b' }}>{invoice.signatoryName}</Text>}
                {invoice.signatoryTitle && <Text style={{ fontSize: 8, color: '#64748b' }}>{invoice.signatoryTitle}</Text>}
              </View>
            )}
          </View>
        </View>
      )}

      <View style={proStyles.footer} fixed>
        <View style={{ flexDirection: 'row' }}><Text style={proStyles.footerText}>Invoice ini dikirim oleh </Text><Text style={proStyles.footerCompanyName}>{invoice.companyName || 'NotaBener'}</Text></View>
        <Text style={proStyles.footerRight}>NotaBener</Text>
      </View>
    </Page>
  )
}

// ═══════════════════════════════════════════════════════════════
// MODERN LAYOUT
// ═══════════════════════════════════════════════════════════════
const M_ACCENT = '#8B5CF6'

const modStyles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 8.5, paddingTop: 0, paddingBottom: 10, paddingHorizontal: 35, backgroundColor: '#FFFFFF' },
  headerBand: { backgroundColor: M_ACCENT, paddingHorizontal: 35, paddingVertical: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: -35 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerLogoCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ffffff30', alignItems: 'center', justifyContent: 'center' },
  headerLogoText: { color: '#ffffff', fontFamily: 'Helvetica-Bold', fontSize: 16 },
  headerCompany: { color: '#ffffff', fontFamily: 'Helvetica-Bold', fontSize: 12 },
  headerRight: { alignItems: 'flex-end' },
  headerTitle: { color: '#ffffff', fontFamily: 'Helvetica-Bold', fontSize: 28, lineHeight: 1 },
  headerNumber: { color: '#ffffff99', fontSize: 9, marginTop: 3 },
  headerStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 5, backgroundColor: '#ffffff30' },
  headerStatusText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#ffffff', textTransform: 'uppercase' },
  body: { paddingTop: 14 },
  dateRow: { flexDirection: 'row', gap: 20, marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  dateLabel: { fontSize: 7.5, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1e293b', marginTop: 2 },
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  infoCard: { flex: 1, padding: 10, borderRadius: 4, backgroundColor: '#faf5ff', borderWidth: 1, borderColor: '#ede9fe' },
  infoCardTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: M_ACCENT, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 },
  infoName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1e293b', marginBottom: 2 },
  infoText: { fontSize: 8, color: '#475569', marginBottom: 1.5 },
  table: { marginBottom: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: M_ACCENT, paddingVertical: 6, paddingHorizontal: 4, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  tableHeaderCell: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#ffffff', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  tableRowAlt: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', backgroundColor: '#faf5ff' },
  tableCell: { fontSize: 8.5, color: '#334155' },
  colDesc: { flex: 3 }, colQty: { flex: 1, textAlign: 'center' }, colPrice: { flex: 2, textAlign: 'right' }, colTotal: { flex: 2, textAlign: 'right' },
  totalsCard: { padding: 12, borderRadius: 4, backgroundColor: '#faf5ff', borderWidth: 1, borderColor: '#ede9fe', marginBottom: 10 },
  totalsInner: { width: '100%', alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', width: 180, paddingVertical: 2 },
  totalLabel: { fontSize: 8.5, color: '#64748b' },
  totalValue: { fontSize: 8.5, color: '#1e293b' },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', width: 180, paddingVertical: 4, marginTop: 3, borderTopWidth: 2, borderTopColor: M_ACCENT },
  grandTotalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: M_ACCENT },
  grandTotalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: M_ACCENT },
  notesText: { fontSize: 7.5, color: '#475569', lineHeight: 1.4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, marginTop: 'auto', borderTopWidth: 0.5, borderTopColor: '#e2e8f0' },
  footerText: { fontSize: 7.5, color: '#94a3b8' },
  footerCompanyName: { fontSize: 7.5, color: M_ACCENT, fontFamily: 'Helvetica-Bold' },
  footerRight: { fontSize: 7.5, color: '#cbd5e1', fontFamily: 'Helvetica-Bold' },
})

function ModernLayout({ invoice }: { invoice: InvoiceWithItems }) {
  return (
    <Page size="A4" style={modStyles.page}>
      {/* Gradient header band */}
      <View style={modStyles.headerBand}>
        <View style={modStyles.headerLeft}>
          <View style={modStyles.headerLogoCircle}>
            <Text style={modStyles.headerLogoText}>{invoice.companyName?.charAt(0)?.toUpperCase() || 'N'}</Text>
          </View>
          <Text style={modStyles.headerCompany}>{invoice.companyName}</Text>
        </View>
        <View style={modStyles.headerRight}>
          <Text style={modStyles.headerTitle}>INVOICE</Text>
          <Text style={modStyles.headerNumber}>{invoice.invoiceNumber}</Text>
          <View style={[modStyles.headerStatus, { backgroundColor: `${statusColors[invoice.status] || '#94a3b8'}66` }]}>
            <Text style={modStyles.headerStatusText}>{statusLabels[invoice.status] || invoice.status}</Text>
          </View>
        </View>
      </View>

      <View style={modStyles.body}>
        <View style={modStyles.dateRow}>
          <View><Text style={modStyles.dateLabel}>Tanggal</Text><Text style={modStyles.dateValue}>{fmtDate(invoice.date)}</Text></View>
          {invoice.dueDate && <View><Text style={modStyles.dateLabel}>Jatuh Tempo</Text><Text style={modStyles.dateValue}>{fmtDate(invoice.dueDate)}</Text></View>}
        </View>

        <View style={modStyles.infoRow}>
          <View style={modStyles.infoCard}>
            <Text style={modStyles.infoCardTitle}>Dari:</Text>
            <Text style={modStyles.infoName}>{invoice.companyName}</Text>
            {invoice.companyEmail && <Text style={modStyles.infoText}>{invoice.companyEmail}</Text>}
            {invoice.companyPhone && <Text style={modStyles.infoText}>{invoice.companyPhone}</Text>}
            {invoice.companyAddress && <Text style={modStyles.infoText}>{invoice.companyAddress}</Text>}
          </View>
          <View style={modStyles.infoCard}>
            <Text style={modStyles.infoCardTitle}>Kepada:</Text>
            <Text style={modStyles.infoName}>{invoice.clientName}</Text>
            {invoice.clientEmail && <Text style={modStyles.infoText}>{invoice.clientEmail}</Text>}
            {invoice.clientPhone && <Text style={modStyles.infoText}>{invoice.clientPhone}</Text>}
            {invoice.clientAddress && <Text style={modStyles.infoText}>{invoice.clientAddress}</Text>}
          </View>
        </View>

        <View style={modStyles.table}>
          <View style={modStyles.tableHeader}>
            <Text style={[modStyles.tableHeaderCell, modStyles.colDesc]}>Deskripsi</Text>
            <Text style={[modStyles.tableHeaderCell, modStyles.colQty]}>Qty</Text>
            <Text style={[modStyles.tableHeaderCell, modStyles.colPrice]}>Harga</Text>
            <Text style={[modStyles.tableHeaderCell, modStyles.colTotal]}>Total</Text>
          </View>
          {invoice.items.map((item, i) => (
            <View key={i} style={i % 2 === 0 ? modStyles.tableRow : modStyles.tableRowAlt}>
              <Text style={[modStyles.tableCell, modStyles.colDesc]}>{item.description}</Text>
              <Text style={[modStyles.tableCell, modStyles.colQty]}>{item.quantity}</Text>
              <Text style={[modStyles.tableCell, modStyles.colPrice]}>{fmtCur(item.price)}</Text>
              <Text style={[modStyles.tableCell, modStyles.colTotal, { fontFamily: 'Helvetica-Bold', color: '#1e293b' }]}>{fmtCur(item.quantity * item.price)}</Text>
            </View>
          ))}
        </View>

        <View style={modStyles.totalsCard}>
          <View style={modStyles.totalsInner}>
            <View style={modStyles.totalRow}><Text style={modStyles.totalLabel}>Subtotal</Text><Text style={modStyles.totalValue}>{fmtCur(invoice.subtotal)}</Text></View>
            {invoice.discountAmount && invoice.discountAmount > 0 && <View style={modStyles.totalRow}><Text style={modStyles.totalLabel}>Diskon {invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}</Text><Text style={[modStyles.totalValue, { color: '#16a34a' }]}>-{fmtCur(invoice.discountAmount)}</Text></View>}
            {invoice.additionalDiscountAmount && invoice.additionalDiscountAmount > 0 && <View style={modStyles.totalRow}><Text style={modStyles.totalLabel}>Diskon Tambahan {invoice.additionalDiscountType === 'percentage' ? `(${invoice.additionalDiscountValue}%)` : ''}</Text><Text style={[modStyles.totalValue, { color: '#16a34a' }]}>-{fmtCur(invoice.additionalDiscountAmount)}</Text></View>}
            <View style={modStyles.totalRow}><Text style={modStyles.totalLabel}>Pajak ({invoice.taxRate}%)</Text><Text style={modStyles.totalValue}>{fmtCur(invoice.taxAmount)}</Text></View>
            <View style={modStyles.grandTotalRow}><Text style={modStyles.grandTotalLabel}>TOTAL</Text><Text style={modStyles.grandTotalValue}>{fmtCur(invoice.total)}</Text></View>
          </View>
        </View>

        {invoice.notes && <Text style={modStyles.notesText}>{invoice.notes}</Text>}
        {invoice.termsAndConditions && <Text style={[modStyles.notesText, { marginTop: 6 }]}>{invoice.termsAndConditions}</Text>}

        {(invoice.signatureUrl || invoice.signatoryName) && (
          <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
            {invoice.signatureUrl && <View style={{ borderBottomWidth: 1, borderBottomColor: '#94a3b8', paddingBottom: 4, marginBottom: 4 }}><Image src={invoice.signatureUrl} style={{ height: 40 }} /></View>}
            {invoice.signatoryName && <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#1e293b' }}>{invoice.signatoryName}</Text>}
            {invoice.signatoryTitle && <Text style={{ fontSize: 8, color: '#64748b' }}>{invoice.signatoryTitle}</Text>}
          </View>
        )}
      </View>

      <View style={modStyles.footer} fixed>
        <View style={{ flexDirection: 'row' }}><Text style={modStyles.footerText}>Invoice ini dikirim oleh </Text><Text style={modStyles.footerCompanyName}>{invoice.companyName || 'NotaBener'}</Text></View>
        <Text style={modStyles.footerRight}>NotaBener</Text>
      </View>
    </Page>
  )
}

// ═══════════════════════════════════════════════════════════════
// MINIMALIST LAYOUT
// ═══════════════════════════════════════════════════════════════
const MI_ACCENT = '#374151'

const minStyles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 8.5, paddingTop: 30, paddingBottom: 10, paddingHorizontal: 40, backgroundColor: '#FFFFFF' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  headerLeft: {},
  headerTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: MI_ACCENT, textTransform: 'uppercase', letterSpacing: 3 },
  headerNumber: { fontSize: 9, color: '#9ca3af', marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  headerDate: { fontSize: 8.5, color: '#6b7280' },
  infoRow: { flexDirection: 'row', gap: 30, marginBottom: 18 },
  infoCol: { flex: 1 },
  infoLabel: { fontSize: 7, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  infoName: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#111827', marginBottom: 2 },
  infoText: { fontSize: 8.5, color: '#6b7280', marginBottom: 1 },
  divider: { height: 0.5, backgroundColor: '#e5e7eb', marginBottom: 14 },
  table: { marginBottom: 14 },
  tableHeader: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: '#d1d5db' },
  tableHeaderCell: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 0.25, borderBottomColor: '#f3f4f6' },
  tableCell: { fontSize: 8.5, color: '#374151' },
  colDesc: { flex: 3 }, colQty: { flex: 1, textAlign: 'center' }, colPrice: { flex: 2, textAlign: 'right' }, colTotal: { flex: 2, textAlign: 'right' },
  totalsSection: { alignItems: 'flex-end', marginBottom: 14 },
  totalsBox: { width: 180 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  totalLabel: { fontSize: 8.5, color: '#6b7280' },
  totalValue: { fontSize: 8.5, color: '#374151' },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, marginTop: 4 },
  grandTotalLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#111827' },
  grandTotalValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#111827' },
  notesText: { fontSize: 7.5, color: '#6b7280', lineHeight: 1.5 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginTop: 'auto' },
  footerText: { fontSize: 7, color: '#d1d5db' },
  footerRight: { fontSize: 7, color: '#d1d5db', fontFamily: 'Helvetica-Bold' },
})

function MinimalistLayout({ invoice }: { invoice: InvoiceWithItems }) {
  return (
    <Page size="A4" style={minStyles.page}>
      <View style={minStyles.headerRow}>
        <View style={minStyles.headerLeft}>
          <Text style={minStyles.headerTitle}>Invoice</Text>
          <Text style={minStyles.headerNumber}>{invoice.invoiceNumber}</Text>
        </View>
        <View style={minStyles.headerRight}>
          <Text style={minStyles.headerDate}>{fmtDate(invoice.date)}</Text>
          {invoice.dueDate && <Text style={minStyles.headerDate}>Jatuh tempo: {fmtDate(invoice.dueDate)}</Text>}
        </View>
      </View>

      <View style={minStyles.infoRow}>
        <View style={minStyles.infoCol}>
          <Text style={minStyles.infoLabel}>Dari</Text>
          <Text style={minStyles.infoName}>{invoice.companyName}</Text>
          {invoice.companyEmail && <Text style={minStyles.infoText}>{invoice.companyEmail}</Text>}
          {invoice.companyPhone && <Text style={minStyles.infoText}>{invoice.companyPhone}</Text>}
          {invoice.companyAddress && <Text style={minStyles.infoText}>{invoice.companyAddress}</Text>}
        </View>
        <View style={minStyles.infoCol}>
          <Text style={minStyles.infoLabel}>Kepada</Text>
          <Text style={minStyles.infoName}>{invoice.clientName}</Text>
          {invoice.clientEmail && <Text style={minStyles.infoText}>{invoice.clientEmail}</Text>}
          {invoice.clientPhone && <Text style={minStyles.infoText}>{invoice.clientPhone}</Text>}
          {invoice.clientAddress && <Text style={minStyles.infoText}>{invoice.clientAddress}</Text>}
        </View>
      </View>

      <View style={minStyles.divider} />

      <View style={minStyles.table}>
        <View style={minStyles.tableHeader}>
          <Text style={[minStyles.tableHeaderCell, minStyles.colDesc]}>Deskripsi</Text>
          <Text style={[minStyles.tableHeaderCell, minStyles.colQty]}>Qty</Text>
          <Text style={[minStyles.tableHeaderCell, minStyles.colPrice]}>Harga</Text>
          <Text style={[minStyles.tableHeaderCell, minStyles.colTotal]}>Total</Text>
        </View>
        {invoice.items.map((item, i) => (
          <View key={i} style={minStyles.tableRow}>
            <Text style={[minStyles.tableCell, minStyles.colDesc]}>{item.description}</Text>
            <Text style={[minStyles.tableCell, minStyles.colQty]}>{item.quantity}</Text>
            <Text style={[minStyles.tableCell, minStyles.colPrice]}>{fmtCur(item.price)}</Text>
            <Text style={[minStyles.tableCell, minStyles.colTotal, { fontFamily: 'Helvetica-Bold', color: '#111827' }]}>{fmtCur(item.quantity * item.price)}</Text>
          </View>
        ))}
      </View>

      <View style={minStyles.divider} />

      <View style={minStyles.totalsSection}>
        <View style={minStyles.totalsBox}>
          <View style={minStyles.totalRow}><Text style={minStyles.totalLabel}>Subtotal</Text><Text style={minStyles.totalValue}>{fmtCur(invoice.subtotal)}</Text></View>
          {invoice.discountAmount && invoice.discountAmount > 0 && <View style={minStyles.totalRow}><Text style={minStyles.totalLabel}>Diskon {invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}</Text><Text style={[minStyles.totalValue, { color: '#16a34a' }]}>-{fmtCur(invoice.discountAmount)}</Text></View>}
          {invoice.additionalDiscountAmount && invoice.additionalDiscountAmount > 0 && <View style={minStyles.totalRow}><Text style={minStyles.totalLabel}>Diskon Tambahan {invoice.additionalDiscountType === 'percentage' ? `(${invoice.additionalDiscountValue}%)` : ''}</Text><Text style={[minStyles.totalValue, { color: '#16a34a' }]}>-{fmtCur(invoice.additionalDiscountAmount)}</Text></View>}
          <View style={minStyles.totalRow}><Text style={minStyles.totalLabel}>Pajak ({invoice.taxRate}%)</Text><Text style={minStyles.totalValue}>{fmtCur(invoice.taxAmount)}</Text></View>
          <View style={minStyles.grandTotalRow}><Text style={minStyles.grandTotalLabel}>TOTAL</Text><Text style={minStyles.grandTotalValue}>{fmtCur(invoice.total)}</Text></View>
        </View>
      </View>

      {invoice.notes && <Text style={minStyles.notesText}>{invoice.notes}</Text>}
      {invoice.termsAndConditions && <Text style={[minStyles.notesText, { marginTop: 6 }]}>{invoice.termsAndConditions}</Text>}
      {(invoice.signatureUrl || invoice.signatoryName) && (
        <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
          {invoice.signatureUrl && <View style={{ borderBottomWidth: 0.5, borderBottomColor: '#d1d5db', paddingBottom: 4, marginBottom: 4 }}><Image src={invoice.signatureUrl} style={{ height: 40 }} /></View>}
          {invoice.signatoryName && <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#111827' }}>{invoice.signatoryName}</Text>}
          {invoice.signatoryTitle && <Text style={{ fontSize: 8, color: '#6b7280' }}>{invoice.signatoryTitle}</Text>}
        </View>
      )}

      <View style={minStyles.footer} fixed>
        <Text style={minStyles.footerText}>{invoice.companyName || 'NotaBener'}</Text>
        <Text style={minStyles.footerRight}>NotaBener</Text>
      </View>
    </Page>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export const InvoicePDF = ({ invoice, layoutType = 'professional' }: InvoicePDFProps) => {
  const LayoutComponent = layoutType === 'modern' ? ModernLayout : layoutType === 'minimalist' ? MinimalistLayout : ProfessionalLayout

  return (
    <Document>
      <LayoutComponent invoice={invoice} />
    </Document>
  )
}

export const useInvoicePDF = (invoice: InvoiceWithItems) => {
  return { InvoicePDF }
}
