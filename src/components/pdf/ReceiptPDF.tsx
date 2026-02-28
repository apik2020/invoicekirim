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

// Define styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 50,
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 30,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoBadge: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  logoText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoBadge: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  paidBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  paidText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 5,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    color: '#64748b',
  },
  value: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  amountContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  amountLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 5,
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10b981',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 20,
  },
  checkmarkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkmark: {
    width: 20,
    height: 20,
    backgroundColor: '#10b981',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkmarkLabel: {
    fontSize: 11,
    color: '#1e293b',
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 50,
    right: 50,
  },
  footerText: {
    fontSize: 9,
    color: '#94a3b8',
    textAlign: 'center',
  },
  thankYou: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginTop: 20,
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

// Get short date
const formatShortDate = (date: Date | string) => {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
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
        <View style={styles.titleContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>[iK]</Text>
          </View>
          <View style={styles.paidBadge}>
            <Text style={styles.paidText}>PEMBAYARAN BERHASIL</Text>
          </View>
          <Text style={styles.title}>Kuitansi</Text>
          <Text style={styles.subtitle}>InvoiceKirim Payment Receipt</Text>
        </View>
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
      <View style={styles.section}>
        <View style={styles.card}>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Jumlah Pembayaran</Text>
            <Text style={styles.amount}>{formatCurrency(amount)}</Text>
          </View>
        </View>
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

      {/* Confirmation */}
      <View style={styles.section}>
        <View style={styles.checkmarkContainer}>
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
          <Text style={styles.checkmarkLabel}>Pembayaran telah dikonfirmasi</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Thank You Message */}
      <Text style={styles.thankYou}>Terima kasih atas pembayaran Anda!</Text>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Kuitansi ini dibuat secara otomatis oleh InvoiceKirim
        </Text>
        <Text style={[styles.footerText, { marginTop: 5 }]}>
          Jika Anda memiliki pertanyaan, hubungi support@invoicekirim.com
        </Text>
      </View>
    </Page>
  </Document>
)
