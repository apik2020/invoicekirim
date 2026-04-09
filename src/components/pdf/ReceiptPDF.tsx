import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

interface ReceiptPDFProps {
  receiptNumber: string
  date: Date
  amount: number
  currency: string
  paymentMethod: string
  description: string
  customerName: string
  customerEmail: string
  invoiceNumber?: string
}

// Define compact styles with Helvetica font
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 25,
    paddingBottom: 25,
    paddingHorizontal: 35,
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 15,
    alignItems: 'center',
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#0A637D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoText: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
  },
  paidBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 4,
    marginBottom: 8,
  },
  paidText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#0A637D',
  },
  subtitle: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 3,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0A637D',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#0A637D',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontSize: 9,
    color: '#64748b',
  },
  value: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
  },
  amountContainer: {
    alignItems: 'center',
    marginTop: 10,
    padding: 15,
    backgroundColor: '#f0fdfa',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  amountLabel: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 5,
  },
  amount: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#10b981',
  },
  divider: {
    height: 0.5,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  checkmarkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    width: 16,
    height: 16,
    backgroundColor: '#10b981',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  checkmarkLabel: {
    fontSize: 10,
    color: '#1e293b',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 35,
    right: 35,
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
  },
  thankYou: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0A637D',
    textAlign: 'center',
    marginTop: 10,
  },
})

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
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export const ReceiptPDF = ({
  receiptNumber,
  date,
  amount,
  currency,
  paymentMethod,
  description,
  customerName,
  customerEmail,
  invoiceNumber,
}: ReceiptPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>[nB]</Text>
        </View>
        <View style={styles.paidBadge}>
          <Text style={styles.paidText}>PEMBAYARAN BERHASIL</Text>
        </View>
        <Text style={styles.title}>Kuitansi</Text>
        <Text style={styles.subtitle}>NotaBener Payment Receipt</Text>
      </View>

      {/* Receipt Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detail Pembayaran</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Nomor Kuitansi</Text>
            <Text style={styles.value}>{receiptNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tanggal & Waktu</Text>
            <Text style={styles.value}>{formatDate(date)}</Text>
          </View>
          {invoiceNumber && (
            <View style={styles.row}>
              <Text style={styles.label}>Nomor Invoice</Text>
              <Text style={styles.value}>{invoiceNumber}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Metode Pembayaran</Text>
            <Text style={styles.value}>{paymentMethod}</Text>
          </View>
        </View>
      </View>

      {/* Amount */}
      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Jumlah Pembayaran</Text>
        <Text style={styles.amount}>{formatCurrency(amount)}</Text>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Deskripsi</Text>
        <View style={styles.card}>
          <Text style={styles.value}>{description}</Text>
        </View>
      </View>

      {/* Customer Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detail Pelanggan</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Nama</Text>
            <Text style={styles.value}>{customerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{customerEmail}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Confirmation */}
      <View style={styles.checkmarkContainer}>
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
        <Text style={styles.checkmarkLabel}>Pembayaran telah dikonfirmasi</Text>
      </View>

      {/* Thank You Message */}
      <Text style={styles.thankYou}>Terima kasih atas pembayaran Anda!</Text>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Kuitansi ini dibuat secara otomatis oleh NotaBener - Platform Invoice Profesional Indonesia
        </Text>
      </View>
    </Page>
  </Document>
)
