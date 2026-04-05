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

// Define compact styles with Times-Roman font
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Times-Roman',
    fontSize: 10,
    paddingTop: 25,
    paddingBottom: 25,
    paddingHorizontal: 35,
    backgroundColor: '#FFFFFF',
  },
  // Header section
  header: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#0A637D',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  brandSection: {
    flex: 1,
  },
  brandName: {
    fontSize: 18,
    fontFamily: 'Times-Bold',
    color: '#0A637D',
  },
  brandTagline: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  invoiceTitle: {
    fontSize: 24,
    fontFamily: 'Times-Bold',
    color: '#0A637D',
    textAlign: 'right',
  },
  invoiceNumber: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 2,
  },
  // Status badge
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 3,
    marginTop: 8,
  },
  statusText: {
    fontSize: 8,
    fontFamily: 'Times-Bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  // Two column layout for parties
  partiesSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 12,
  },
  partyColumn: {
    flex: 1,
    maxWidth: '48%',
  },
  partyLabel: {
    fontSize: 8,
    fontFamily: 'Times-Bold',
    color: '#0A637D',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  partyBox: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#0A637D',
  },
  partyName: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    color: '#1e293b',
    marginBottom: 3,
  },
  partyDetail: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.4,
  },
  // Invoice details row
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
    gap: 20,
  },
  detailItem: {
    alignItems: 'flex-end',
  },
  detailLabel: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    color: '#1e293b',
  },
  // Items table
  table: {
    marginTop: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0A637D',
    padding: 6,
    borderRadius: 3,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Times-Bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  colDescription: {
    flex: 4,
  },
  colQty: {
    flex: 1,
    textAlign: 'center',
  },
  colPrice: {
    flex: 2,
    textAlign: 'right',
  },
  colTotal: {
    flex: 2,
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
  },
  tableCell: {
    fontSize: 9,
    color: '#334155',
  },
  // Totals section
  totalsSection: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsBox: {
    width: 200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
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
    borderTopWidth: 1.5,
    borderTopColor: '#0A637D',
  },
  grandTotalLabel: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    color: '#0A637D',
  },
  grandTotalValue: {
    fontSize: 12,
    fontFamily: 'Times-Bold',
    color: '#0A637D',
  },
  // Payment info section
  paymentSection: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f0fdfa',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  paymentTitle: {
    fontSize: 8,
    fontFamily: 'Times-Bold',
    color: '#10b981',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  paymentText: {
    fontSize: 9,
    color: '#334155',
  },
  // Notes section
  notesSection: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#fffbeb',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  notesTitle: {
    fontSize: 8,
    fontFamily: 'Times-Bold',
    color: '#b45309',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  notesText: {
    fontSize: 9,
    color: '#78350f',
    lineHeight: 1.4,
  },
  // Terms section
  termsSection: {
    marginTop: 8,
  },
  termsTitle: {
    fontSize: 8,
    fontFamily: 'Times-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  termsText: {
    fontSize: 8,
    color: '#64748b',
    lineHeight: 1.4,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 35,
    right: 35,
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
  },
})

// Status colors
const statusColors: Record<string, string> = {
  DRAFT: '#64748b',
  SENT: '#3b82f6',
  PENDING: '#f59e0b',
  PAID: '#10b981',
  OVERDUE: '#ef4444',
  CANCELLED: '#94a3b8',
  CANCELED: '#94a3b8', // alias for CANCELLED
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
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export const InvoicePDF = ({ invoice }: InvoicePDFProps) => {
  const statusLabel: Record<string, string> = {
    DRAFT: 'Draf',
    SENT: 'Terkirim',
    PENDING: 'Menunggu',
    PAID: 'Lunas',
    OVERDUE: 'Terlambat',
    CANCELLED: 'Dibatalkan',
    CANCELED: 'Dibatalkan', // alias
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandSection}>
              <Text style={styles.brandName}>{invoice.companyName || 'NotaBener'}</Text>
              <Text style={styles.brandTagline}>Platform Invoice Profesional</Text>
              {invoice.companyEmail && (
                <Text style={[styles.brandTagline, { marginTop: 4 }]}>
                  {invoice.companyEmail}
                </Text>
              )}
              {invoice.companyPhone && (
                <Text style={styles.brandTagline}>{invoice.companyPhone}</Text>
              )}
              {invoice.companyAddress && (
                <Text style={styles.brandTagline}>{invoice.companyAddress}</Text>
              )}
            </View>
            <View>
              <Text style={styles.invoiceTitle}>INVOICE</Text>
              <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusColors[invoice.status] || '#64748b' }]}>
            <Text style={styles.statusText}>{statusLabel[invoice.status] || invoice.status}</Text>
          </View>
        </View>

        {/* Invoice Details */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Tanggal</Text>
            <Text style={styles.detailValue}>{formatDate(invoice.date)}</Text>
          </View>
          {invoice.dueDate && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Jatuh Tempo</Text>
              <Text style={styles.detailValue}>{formatDate(invoice.dueDate)}</Text>
            </View>
          )}
        </View>

        {/* Parties Section */}
        <View style={styles.partiesSection}>
          <View style={styles.partyColumn}>
            <Text style={styles.partyLabel}>Tagih Kepada</Text>
            <View style={styles.partyBox}>
              <Text style={styles.partyName}>{invoice.clientName}</Text>
              {invoice.clientEmail && (
                <Text style={styles.partyDetail}>{invoice.clientEmail}</Text>
              )}
              {invoice.clientPhone && (
                <Text style={styles.partyDetail}>{invoice.clientPhone}</Text>
              )}
              {invoice.clientAddress && (
                <Text style={styles.partyDetail}>{invoice.clientAddress}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>Deskripsi</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>Harga</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>

          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colDescription]}>{item.description}</Text>
              <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.price)}</Text>
              <Text style={[styles.tableCell, styles.colTotal]}>
                {formatCurrency(item.quantity * item.price)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
            </View>

            {invoice.discountAmount && invoice.discountAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Diskon {invoice.discountType === 'PERCENTAGE' ? `(${invoice.discountValue}%)` : ''}
                </Text>
                <Text style={[styles.totalValue, { color: '#10b981' }]}>
                  -{formatCurrency(invoice.discountAmount)}
                </Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Pajak ({invoice.taxRate}%)</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.taxAmount)}</Text>
            </View>

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Info */}
        {invoice.paymentMethod && (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>Informasi Pembayaran</Text>
            <Text style={styles.paymentText}>Metode: {invoice.paymentMethod}</Text>
            {invoice.paymentNotes && (
              <Text style={styles.paymentText}>{invoice.paymentNotes}</Text>
            )}
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Catatan</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Terms */}
        {invoice.termsAndConditions && (
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Syarat & Ketentuan</Text>
            <Text style={styles.termsText}>{invoice.termsAndConditions}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Invoice ini dibuat menggunakan NotaBener - Platform Invoice Profesional Indonesia
          </Text>
        </View>
      </Page>
    </Document>
  )
}

// Hook to generate PDF blob
export const useInvoicePDF = (invoice: InvoiceWithItems) => {
  return { InvoicePDF }
}
