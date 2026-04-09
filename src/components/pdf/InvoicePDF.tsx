import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import { invoices, invoice_items } from '@prisma/client'

interface InvoiceWithItems extends Omit<invoices, 'invoice_items'> {
  items: invoice_items[]
}

interface InvoicePDFProps {
  invoice: InvoiceWithItems
}

const ACCENT_COLOR = '#0F766E'
const ACCENT_DARK = '#0a5e56'
const PRIMARY_COLOR = '#F97316'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    backgroundColor: '#FFFFFF',
  },
  // Top accent bar
  topBar: {
    height: 6,
    backgroundColor: ACCENT_COLOR,
  },
  // Content area with side bars
  contentWrapper: {
    position: 'relative',
    paddingHorizontal: 40,
    paddingVertical: 30,
  },
  // Header row
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  logoBox: {
    width: 80,
    height: 55,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 3,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFallback: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: ACCENT_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFallbackText: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 16,
  },
  invoiceTitleRight: {
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT_COLOR,
    lineHeight: 1,
  },
  invoiceNumber: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  // Date fields
  dateRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dateField: {
    // container for label + value
  },
  dateLabel: {
    fontSize: 9,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    marginTop: 3,
  },
  // DARI & KEPADA section
  dariKepadaRow: {
    flexDirection: 'row',
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dariKepadaCol: {
    flex: 1,
  },
  dariKepadaColRight: {
    flex: 1,
    paddingLeft: 20,
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT_COLOR,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    marginBottom: 3,
  },
  infoText: {
    fontSize: 9,
    color: '#475569',
    marginBottom: 2,
  },
  // Items table
  table: {
    marginBottom: 14,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: ACCENT_COLOR,
    paddingVertical: 8,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT_COLOR,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 9,
    color: '#334155',
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 2, textAlign: 'right' },
  colTotal: { flex: 2, textAlign: 'right' },
  // Totals + Notes row
  totalsNotesRow: {
    flexDirection: 'row',
    gap: 20,
  },
  notesSection: {
    flex: 1,
  },
  notesBox: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 3,
    backgroundColor: '#f8fafc',
    minHeight: 60,
  },
  notesText: {
    fontSize: 8,
    color: '#475569',
    lineHeight: 1.4,
  },
  totalsSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  totalsBox: {
    width: 180,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 9,
    color: '#64748b',
  },
  totalValue: {
    fontSize: 9,
    color: '#1e293b',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: ACCENT_COLOR,
  },
  grandTotalLabel: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT_COLOR,
  },
  grandTotalValue: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT_COLOR,
  },
  // Footer bar
  footerBar: {
    backgroundColor: ACCENT_DARK,
    paddingHorizontal: 40,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.9)',
  },
  footerAccent: {
    width: 50,
    height: 18,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 2,
  },
})

// Status colors
const statusColors: Record<string, string> = {
  DRAFT: '#94a3b8',
  SENT: '#22c55e',
  PENDING: '#f59e0b',
  PAID: '#22c55e',
  OVERDUE: '#ef4444',
  CANCELLED: '#94a3b8',
  CANCELED: '#94a3b8',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'DRAFT',
  SENT: 'TERKIRIM',
  PENDING: 'MENUNGGU',
  PAID: 'LUNAS',
  OVERDUE: 'JATUH TEMPO',
  CANCELLED: 'BATAL',
  CANCELED: 'BATAL',
}

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

// Format date
const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export const InvoicePDF = ({ invoice }: InvoicePDFProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top Accent Bar */}
        <View style={styles.topBar} />

        {/* Content */}
        <View style={styles.contentWrapper}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            {/* Logo */}
            <View style={styles.logoFallback}>
              <Text style={styles.logoFallbackText}>
                {invoice.companyName?.charAt(0)?.toUpperCase() || 'N'}
              </Text>
            </View>

            {/* INVOICE title + number + status */}
            <View style={styles.invoiceTitleRight}>
              <Text style={styles.invoiceTitle}>INVOICE</Text>
              <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColors[invoice.status] || '#94a3b8' }]}>
                <Text style={styles.statusText}>{statusLabels[invoice.status] || invoice.status}</Text>
              </View>
            </View>
          </View>

          {/* Date Fields */}
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>Tanggal</Text>
              <Text style={styles.dateValue}>{formatDate(invoice.date)}</Text>
            </View>
            {invoice.dueDate && (
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>Jatuh Tempo</Text>
                <Text style={styles.dateValue}>{formatDate(invoice.dueDate)}</Text>
              </View>
            )}
          </View>

          {/* DARI & KEPADA Side by Side */}
          <View style={styles.dariKepadaRow}>
            <View style={styles.dariKepadaCol}>
              <Text style={styles.sectionTitle}>Dari:</Text>
              <Text style={styles.infoName}>{invoice.companyName}</Text>
              {invoice.companyEmail && <Text style={styles.infoText}>{invoice.companyEmail}</Text>}
              {invoice.companyPhone && <Text style={styles.infoText}>{invoice.companyPhone}</Text>}
              {invoice.companyAddress && <Text style={styles.infoText}>{invoice.companyAddress}</Text>}
            </View>
            <View style={styles.dariKepadaColRight}>
              <Text style={styles.sectionTitle}>Kepada:</Text>
              <Text style={styles.infoName}>{invoice.clientName}</Text>
              {invoice.clientEmail && <Text style={styles.infoText}>{invoice.clientEmail}</Text>}
              {invoice.clientPhone && <Text style={styles.infoText}>{invoice.clientPhone}</Text>}
              {invoice.clientAddress && <Text style={styles.infoText}>{invoice.clientAddress}</Text>}
            </View>
          </View>

          {/* Items Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colDesc]}>Deskripsi</Text>
              <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, styles.colPrice]}>Harga</Text>
              <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
            </View>

            {invoice.items.map((item, index) => (
              <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.tableCell, styles.colDesc]}>{item.description}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.price)}</Text>
                <Text style={[styles.tableCell, styles.colTotal, { fontFamily: 'Helvetica-Bold', color: '#1e293b' }]}>
                  {formatCurrency(item.quantity * item.price)}
                </Text>
              </View>
            ))}
          </View>

          {/* Totals + Notes Row */}
          <View style={styles.totalsNotesRow}>
            {/* Notes Left */}
            <View style={styles.notesSection}>
              {invoice.notes && (
                <>
                  <Text style={styles.sectionTitle}>Catatan:</Text>
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>{invoice.notes}</Text>
                  </View>
                </>
              )}
            </View>

            {/* Totals Right */}
            <View style={styles.totalsSection}>
              <View style={styles.totalsBox}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
                </View>

                {invoice.discountAmount && invoice.discountAmount > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Diskon</Text>
                    <Text style={[styles.totalValue, { color: '#16a34a' }]}>
                      -{formatCurrency(invoice.discountAmount)}
                    </Text>
                  </View>
                )}

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Pajak ({invoice.taxRate}%)</Text>
                  <Text style={styles.totalValue}>{formatCurrency(invoice.taxAmount)}</Text>
                </View>

                <View style={styles.grandTotalRow}>
                  <Text style={styles.grandTotalLabel}>TOTAL</Text>
                  <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Footer Bar */}
        <View style={styles.footerBar}>
          <Text style={styles.footerText}>
            Invoice ini dikirim oleh: {invoice.companyName || 'NotaBener'}
          </Text>
          <View style={styles.footerAccent} />
        </View>
      </Page>
    </Document>
  )
}

// Hook to generate PDF blob
export const useInvoicePDF = (invoice: InvoiceWithItems) => {
  return { InvoicePDF }
}
