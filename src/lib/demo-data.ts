// Mock data for the demo dashboard (Professional Plan)

export const demoInvoices = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2026-041',
    clientName: 'PT Maju Jaya Sentosa',
    date: '2026-04-28',
    dueDate: '2026-05-28',
    status: 'PAID',
    total: 15000000,
    items: [
      { name: 'Jasa Konsultasi IT', qty: 1, price: 10000000 },
      { name: 'Maintenance Server', qty: 1, price: 5000000 },
    ],
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2026-040',
    clientName: 'CV Berkah Mandiri',
    date: '2026-04-25',
    dueDate: '2026-05-25',
    status: 'SENT',
    total: 8750000,
    items: [
      { name: 'Desain Website', qty: 1, price: 8750000 },
    ],
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-2026-039',
    clientName: 'Toko Elektronik Jaya',
    date: '2026-04-22',
    dueDate: '2026-05-22',
    status: 'SENT',
    total: 3200000,
    items: [
      { name: 'Servis Laptop (5 unit)', qty: 5, price: 640000 },
    ],
  },
  {
    id: 'inv-004',
    invoiceNumber: 'INV-2026-038',
    clientName: 'Klinik Sehat Sentosa',
    date: '2026-04-18',
    dueDate: '2026-04-25',
    status: 'OVERDUE',
    total: 22500000,
    items: [
      { name: 'Sistem Informasi Klinik', qty: 1, price: 20000000 },
      { name: 'Training Staff (2 hari)', qty: 1, price: 2500000 },
    ],
  },
  {
    id: 'inv-005',
    invoiceNumber: 'INV-2026-037',
    clientName: 'Restoran Sederhana',
    date: '2026-04-15',
    dueDate: '2026-05-15',
    status: 'DRAFT',
    total: 4500000,
    items: [
      { name: 'POS System', qty: 1, price: 4500000 },
    ],
  },
  {
    id: 'inv-006',
    invoiceNumber: 'INV-2026-036',
    clientName: 'PT Maju Jaya Sentosa',
    date: '2026-04-10',
    dueDate: '2026-05-10',
    status: 'PAID',
    total: 12500000,
    items: [
      { name: 'Jasa Konsultasi IT', qty: 1, price: 7500000 },
      { name: 'Cloud Hosting (1 tahun)', qty: 1, price: 5000000 },
    ],
  },
]

export const demoClients = [
  { id: 'cl-001', name: 'PT Maju Jaya Sentosa', email: 'finance@majujaya.co.id', totalInvoices: 12, totalRevenue: 85000000 },
  { id: 'cl-002', name: 'CV Berkah Mandiri', email: 'admin@berkahmandiri.com', totalInvoices: 8, totalRevenue: 42000000 },
  { id: 'cl-003', name: 'Toko Elektronik Jaya', email: 'owner@elektronikjaya.id', totalInvoices: 5, totalRevenue: 18700000 },
  { id: 'cl-004', name: 'Klinik Sehat Sentosa', email: 'info@sehatsentosa.com', totalInvoices: 3, totalRevenue: 67500000 },
  { id: 'cl-005', name: 'Restoran Sederhana', email: 'order@restoransederhana.id', totalInvoices: 4, totalRevenue: 22000000 },
]

export const demoStats = {
  totalRevenue: 235200000,
  totalInvoices: 32,
  paidInvoices: 18,
  pendingInvoices: 8,
  overdueInvoices: 3,
  draftInvoices: 3,
  totalClients: 15,
  thisMonthRevenue: 66500000,
  lastMonthRevenue: 52000000,
  revenueGrowth: 27.9,
}

export const demoRevenueByMonth = [
  { month: 'Nov 2025', revenue: 28000000 },
  { month: 'Des 2025', revenue: 35000000 },
  { month: 'Jan 2026', revenue: 42000000 },
  { month: 'Feb 2026', revenue: 38000000 },
  { month: 'Mar 2026', revenue: 52000000 },
  { month: 'Apr 2026', revenue: 66500000 },
]

export const demoRevenueByStatus = [
  { status: 'Lunas', amount: 150000000, count: 18, color: '#22C55E' },
  { status: 'Terkirim', amount: 50000000, count: 8, color: '#3B82F6' },
  { status: 'Terlambat', amount: 22500000, count: 3, color: '#EF4444' },
  { status: 'Draft', amount: 12500000, count: 3, color: '#9CA3AF' },
]

export const demoActivityLogs = [
  {
    id: 'act-1',
    type: 'INVOICE_SENT' as const,
    message: 'Invoice INV-2026-040 dikirim ke CV Berkah Mandiri via WhatsApp',
    timestamp: '2 jam yang lalu',
  },
  {
    id: 'act-2',
    type: 'PAYMENT_RECEIVED' as const,
    message: 'Pembayaran Rp 15.000.000 diterima dari PT Maju Jaya Sentosa',
    timestamp: '5 jam yang lalu',
  },
  {
    id: 'act-3',
    type: 'INVOICE_CREATED' as const,
    message: 'Invoice INV-2026-041 berhasil dibuat',
    timestamp: '1 hari yang lalu',
  },
  {
    id: 'act-4',
    type: 'REMINDER_SENT' as const,
    message: 'Reminder dikirim ke Klinik Sehat Sentosa (INV-2026-038)',
    timestamp: '2 hari yang lalu',
  },
  {
    id: 'act-5',
    type: 'PAYMENT_RECEIVED' as const,
    message: 'Pembayaran Rp 12.500.000 diterima dari PT Maju Jaya Sentosa',
    timestamp: '3 hari yang lalu',
  },
]

export const demoUser = {
  name: 'Demo User',
  email: 'demo@notabener.id',
  businessName: 'CV Demo Bisnis',
  plan: 'Profesional',
}
