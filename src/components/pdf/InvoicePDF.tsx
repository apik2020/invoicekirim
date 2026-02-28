import {
  Document,
  Page,
  Text,
  View,
  Image,
  Font,
  StyleSheet,
  PDFViewer,
  PDFDownloadLink,
} from '@react-pdf/renderer'
import { Invoice, InvoiceItem } from '@prisma/client'

// Register font (optional - using default fonts for now)
// For production, you might want to use custom fonts

interface InvoiceWithItems extends Omit<Invoice, 'items'> {
  items: InvoiceItem[]
}

interface InvoicePDFProps {
  invoice: InvoiceWithItems
}

// Define styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 40,
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 30,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
    borderRadius: 8,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  companyTagline: {
    fontSize: 10,
    color: '#64748b',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0891b2',
    marginBottom: 20,
  },
  invoiceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  infoColumn: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  cardLabel: {
    fontSize: 10,
    color: '#64748b',
    width: 80,
  },
  cardValue: {
    fontSize: 11,
    color: '#1e293b',
    flex: 1,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0891b2',
    borderRadius: 6,
    padding: 10,
    marginBottom: 5,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 10,
  },
  tableCell: {
    fontSize: 10,
    color: '#334155',
  },
  colDescription: {
    flex: 3,
  },
  colQuantity: {
    flex: 1,
    textAlign: 'center',
  },
  colPrice: {
    flex: 1,
    textAlign: 'right',
  },
  colTotal: {
    flex: 1,
    textAlign: 'right',
  },
  totals: {
    marginLeft: 'auto',
    width: 200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  totalRowGrand: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#0891b2',
  },
  totalLabelGrand: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  totalValueGrand: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0891b2',
  },
  notes: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#78350f',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 15,
  },
  footerText: {
    fontSize: 9,
    color: '#64748b',
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
})

// Status colors
const statusColors: Record<string, string> = {
  DRAFT: '#64748b',
  SENT: '#3b82f6',
  PAID: '#10b981',
  OVERDUE: '#ef4444',
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
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export const InvoicePDF = ({ invoice }: InvoicePDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          {/* Logo [iK] */}
          <View style={[styles.logo, { backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>[iK]</Text>
          </View>
          <View>
            <Text style={styles.companyName}>InvoiceKirim</Text>
            <Text style={styles.companyTagline}>Platform Invoice untuk Freelancer</Text>
          </View>
        </View>

        <Text style={styles.title}>INVOICE</Text>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusColors[invoice.status] || '#64748b' }]}>
          <Text style={[styles.statusText, { color: '#ffffff' }]}>
            {invoice.status === 'DRAFT' && 'Draf'}
            {invoice.status === 'SENT' && 'Terkirim'}
            {invoice.status === 'PAID' && 'Lunas'}
            {invoice.status === 'OVERDUE' && 'Terlambat'}
            {invoice.status === 'CANCELED' && 'Dibatalkan'}
          </Text>
        </View>

        {/* Invoice Info */}
        <View style={styles.invoiceInfo}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Nomor Invoice</Text>
            <Text style={styles.infoValue}>{invoice.invoiceNumber}</Text>

            <Text style={styles.infoLabel}>Tanggal</Text>
            <Text style={styles.infoValue}>{formatDate(invoice.date)}</Text>

            {invoice.dueDate && (
              <>
                <Text style={styles.infoLabel}>Jatuh Tempo</Text>
                <Text style={styles.infoValue}>{formatDate(invoice.dueDate)}</Text>
              </>
            )}
          </View>

          <View style={[styles.infoColumn, { alignItems: 'flex-end' }]}>
            <Text style={styles.infoLabel}>Kepada</Text>
            <Text style={styles.infoValue}>{invoice.clientName}</Text>
            {invoice.clientEmail && (
              <Text style={[styles.infoValue, { fontWeight: 'normal', fontSize: 10 }]}>
                {invoice.clientEmail}
              </Text>
            )}
            {invoice.clientPhone && (
              <Text style={[styles.infoValue, { fontWeight: 'normal', fontSize: 10 }]}>
                {invoice.clientPhone}
              </Text>
            )}
            {invoice.clientAddress && (
              <Text style={[styles.infoValue, { fontWeight: 'normal', fontSize: 10 }]}>
                {invoice.clientAddress}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* From Section */}
      <Text style={styles.sectionTitle}>Dari</Text>
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Nama</Text>
          <Text style={styles.cardValue}>{invoice.companyName || '-'}</Text>
        </View>
        {invoice.companyEmail && (
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Email</Text>
            <Text style={styles.cardValue}>{invoice.companyEmail}</Text>
          </View>
        )}
        {invoice.companyPhone && (
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Telepon</Text>
            <Text style={styles.cardValue}>{invoice.companyPhone}</Text>
          </View>
        )}
        {invoice.companyAddress && (
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Alamat</Text>
            <Text style={styles.cardValue}>{invoice.companyAddress}</Text>
          </View>
        )}
      </View>

      {/* Items Table */}
      <Text style={styles.sectionTitle}>Item</Text>
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDescription]}>Deskripsi</Text>
          <Text style={[styles.tableHeaderText, styles.colQuantity]}>Qty</Text>
          <Text style={[styles.tableHeaderText, styles.colPrice]}>Harga</Text>
          <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
        </View>

        {/* Table Rows */}
        {invoice.items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colDescription]}>{item.description}</Text>
            <Text style={[styles.tableCell, styles.colQuantity]}>{item.quantity}</Text>
            <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.price)}</Text>
            <Text style={[styles.tableCell, styles.colTotal]}>
              {formatCurrency(item.quantity * item.price)}
            </Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Pajak ({invoice.taxRate}%)</Text>
          <Text style={styles.totalValue}>{formatCurrency(invoice.taxAmount)}</Text>
        </View>

        <View style={[styles.totalRow, styles.totalRowGrand]}>
          <Text style={styles.totalLabelGrand}>Total</Text>
          <Text style={styles.totalValueGrand}>{formatCurrency(invoice.total)}</Text>
        </View>
      </View>

      {/* Notes */}
      {invoice.notes && (
        <View style={styles.notes}>
          <Text style={styles.notesTitle}>CATATAN</Text>
          <Text style={styles.notesText}>{invoice.notes}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Invoice dibuat dengan InvoiceKirim - Platform Invoice untuk Freelancer Indonesia
        </Text>
        <Text style={[styles.footerText, { marginTop: 5 }]}>
          {formatDate(new Date())}
        </Text>
      </View>
    </Page>
  </Document>
)

// Hook to generate PDF blob
export const useInvoicePDF = (invoice: InvoiceWithItems) => {
  return { InvoicePDF }
}
