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

// Compact styles matching the reference design
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Times-Roman',
    fontSize: 9,
    paddingTop: 25,
    paddingBottom: 20,
    paddingHorizontal: 30,
    backgroundColor: '#FFFFFF',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0A637D',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 35,
    height: 35,
    backgroundColor: '#0A637D',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoText: {
    color: '#ffffff',
    fontFamily: 'Times-Bold',
    fontSize: 10,
  },
  companyName: {
    fontSize: 14,
    fontFamily: 'Times-Bold',
    color: '#0A637D',
  },
  invoiceTitle: {
    fontSize: 22,
    fontFamily: 'Times-Bold',
    color: '#0A637D',
  },
  // Invoice Details Row
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 9,
    color: '#64748b',
    marginRight: 5,
  },
  detailValue: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    color: '#1e293b',
  },
  // Bill To Section
  billToSection: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  billToColumn: {
    flex: 1,
    paddingRight: 10,
  },
  billToColumnRight: {
    flex: 1,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
  },
  billToTitle: {
    fontSize: 9,
    fontFamily: 'Times-Bold',
    color: '#0A637D',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  billToText: {
    fontSize: 9,
    color: '#334155',
    marginBottom: 2,
  },
  billToName: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    color: '#1e293b',
    marginBottom: 3,
  },
  // Items Table
  table: {
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0A637D',
    padding: 6,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Times-Bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
  },
  tableCell: {
    fontSize: 8,
    color: '#334155',
  },
  colProduct: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 2, textAlign: 'right' },
  colDiscount: { flex: 1, textAlign: 'right' },
  colTax: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 2, textAlign: 'right' },
  // Totals
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  totalsBox: {
    width: 180,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
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
    paddingVertical: 4,
    marginTop: 3,
    borderTopWidth: 1,
    borderTopColor: '#0A637D',
  },
  grandTotalLabel: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    color: '#0A637D',
  },
  grandTotalValue: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    color: '#0A637D',
  },
  // Bottom Section
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  termsSection: {
    flex: 1,
    paddingRight: 15,
  },
  termsTitle: {
    fontSize: 8,
    fontFamily: 'Times-Bold',
    color: '#0A637D',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  termsText: {
    fontSize: 7,
    color: '#64748b',
    lineHeight: 1.3,
  },
  // Footer with signature
  footerSection: {
    width: 120,
    alignItems: 'flex-end',
  },
  footerDate: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 8,
  },
  signatureLine: {
    width: 100,
    height: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 8,
    fontFamily: 'Times-Bold',
    color: '#1e293b',
    textAlign: 'center',
  },
  // Status badge
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 7,
    fontFamily: 'Times-Bold',
    color: '#ffffff',
    textTransform: 'uppercase',
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
  CANCELED: '#94a3b8',
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
    day: 'numeric',
    month: 'short',
    year: 'numeric',
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
    CANCELED: 'Dibatalkan',
  }

  // Calculate discount per item (if any)
  const getItemDiscount = (item: invoice_items) => {
    // Assuming no item-level discount for now
    return 0
  }

  // Calculate tax per item
  const getItemTax = (item: invoice_items) => {
    const taxRate = item.taxRate || invoice.taxRate || 11
    return (item.price * item.quantity * taxRate) / 100
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>[nB]</Text>
            </View>
            <Text style={styles.companyName}>{invoice.companyName || 'NotaBener'}</Text>
          </View>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
        </View>

        {/* Invoice Details Row */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Reference:</Text>
            <Text style={styles.detailValue}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(invoice.date)}</Text>
          </View>
          {invoice.dueDate && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Due Date:</Text>
              <Text style={styles.detailValue}>{formatDate(invoice.dueDate)}</Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: statusColors[invoice.status] || '#64748b' }]}>
            <Text style={styles.statusText}>{statusLabel[invoice.status] || invoice.status}</Text>
          </View>
        </View>

        {/* Bill To Section - Two Columns */}
        <View style={styles.billToSection}>
          <View style={styles.billToColumn}>
            <Text style={styles.billToTitle}>Our Information</Text>
            <Text style={styles.billToName}>{invoice.companyName}</Text>
            {invoice.companyEmail && <Text style={styles.billToText}>{invoice.companyEmail}</Text>}
            {invoice.companyPhone && <Text style={styles.billToText}>{invoice.companyPhone}</Text>}
            {invoice.companyAddress && <Text style={styles.billToText}>{invoice.companyAddress}</Text>}
          </View>
          <View style={styles.billToColumnRight}>
            <Text style={styles.billToTitle}>Billing For</Text>
            <Text style={styles.billToName}>{invoice.clientName}</Text>
            {invoice.clientEmail && <Text style={styles.billToText}>{invoice.clientEmail}</Text>}
            {invoice.clientPhone && <Text style={styles.billToText}>{invoice.clientPhone}</Text>}
            {invoice.clientAddress && <Text style={styles.billToText}>{invoice.clientAddress}</Text>}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colProduct]}>Product</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCell, styles.colDiscount]}>Disc</Text>
            <Text style={[styles.tableHeaderCell, styles.colTax]}>Tax</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>

          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colProduct]}>{item.description}</Text>
              <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.price)}</Text>
              <Text style={[styles.tableCell, styles.colDiscount]}>-</Text>
              <Text style={[styles.tableCell, styles.colTax]}>{invoice.taxRate}%</Text>
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
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={[styles.totalValue, { color: '#10b981' }]}>
                  -{formatCurrency(invoice.discountAmount)}
                </Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({invoice.taxRate}%)</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.taxAmount)}</Text>
            </View>

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* Bottom Section - Terms & Signature */}
        <View style={styles.bottomSection}>
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Terms and Condition</Text>
            {invoice.paymentMethod && (
              <Text style={styles.termsText}>
                Payment Method: {invoice.paymentMethod}
              </Text>
            )}
            {invoice.paymentNotes && (
              <Text style={styles.termsText}>{invoice.paymentNotes}</Text>
            )}
            {invoice.notes && (
              <Text style={styles.termsText}>{invoice.notes}</Text>
            )}
            {invoice.termsAndConditions && (
              <Text style={styles.termsText}>{invoice.termsAndConditions}</Text>
            )}
            {!invoice.paymentMethod && !invoice.paymentNotes && !invoice.notes && !invoice.termsAndConditions && (
              <Text style={styles.termsText}>
                Pembayaran dapat dilakukan melalui transfer bank.{'\n'}
                Harap sebutkan nomor invoice pada saat pembayaran.
              </Text>
            )}
          </View>

          <View style={styles.footerSection}>
            <Text style={styles.footerDate}>{formatDate(new Date())}</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{invoice.signatoryName || invoice.companyName}</Text>
            {invoice.signatoryTitle && (
              <Text style={[styles.footerDate, { fontFamily: 'Times-Roman' }]}>{invoice.signatoryTitle}</Text>
            )}
          </View>
        </View>
      </Page>
    </Document>
  )
}

// Hook to generate PDF blob
export const useInvoicePDF = (invoice: InvoiceWithItems) => {
  return { InvoicePDF }
}
