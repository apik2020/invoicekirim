import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, startOfYear, subMonths, format } from 'date-fns'

export interface AnalyticsMetrics {
  // Revenue
  totalRevenue: number
  revenueThisMonth: number
  revenueLastMonth: number
  revenueGrowth: number

  // MRR/ARR
  mrr: number
  arr: number

  // Invoices
  totalInvoices: number
  invoicesSent: number
  invoicesPaid: number
  invoicesOverdue: number
  invoicesDraft: number

  // Conversion
  conversionRate: number
  averageInvoiceValue: number

  // Clients
  totalClients: number
  newClientsThisMonth: number
  activeClients: number

  // Payments
  totalPayments: number
  paymentsThisMonth: number

  // Customer metrics
  customerLifetimeValue: number
  averagePaymentTime: number
}

export interface RevenueByMonth {
  month: string
  revenue: number
  invoices: number
}

export interface InvoiceStatusBreakdown {
  status: string
  count: number
  percentage: number
}

/**
 * Get comprehensive analytics for a user or team
 */
export async function getAnalytics(params: {
  userId?: string
  teamId?: string
  startDate?: Date
  endDate?: Date
}): Promise<AnalyticsMetrics> {
  const { userId, teamId, startDate, endDate } = params

  const whereClause: { userId?: string; teamId?: string } = {}
  if (userId) whereClause.userId = userId
  if (teamId) whereClause.teamId = teamId

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const lastMonthEnd = endOfMonth(subMonths(now, 1))

  // Get invoice stats
  const invoices = await prisma.invoices.findMany({
    where: whereClause,
    select: {
      total: true,
      status: true,
      createdAt: true,
      paidAt: true,
    },
  })

  // Get payment stats
  const payments = await prisma.payments.findMany({
    where: {
      ...whereClause,
      status: 'COMPLETED',
    },
    select: {
      amount: true,
      createdAt: true,
    },
  })

  // Get client stats
  const clients = await prisma.clients.findMany({
    where: whereClause,
    select: {
      id: true,
      createdAt: true,
      invoices: {
        select: { id: true },
        where: { status: 'PAID' },
      },
    },
  })

  // Calculate revenue
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)

  const revenueThisMonth = payments
    .filter((p) => p.createdAt >= monthStart && p.createdAt <= monthEnd)
    .reduce((sum, p) => sum + p.amount, 0)

  const revenueLastMonth = payments
    .filter((p) => p.createdAt >= lastMonthStart && p.createdAt <= lastMonthEnd)
    .reduce((sum, p) => sum + p.amount, 0)

  const revenueGrowth = revenueLastMonth > 0
    ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
    : revenueThisMonth > 0 ? 100 : 0

  // Calculate invoice stats
  const totalInvoices = invoices.length
  const invoicesSent = invoices.filter((i) => i.status !== 'DRAFT').length
  const invoicesPaid = invoices.filter((i) => i.status === 'PAID').length
  const invoicesOverdue = invoices.filter((i) => i.status === 'OVERDUE').length
  const invoicesDraft = invoices.filter((i) => i.status === 'DRAFT').length

  // Calculate conversion rate
  const conversionRate = invoicesSent > 0
    ? (invoicesPaid / invoicesSent) * 100
    : 0

  // Calculate average invoice value
  const paidInvoices = invoices.filter((i) => i.status === 'PAID')
  const averageInvoiceValue = paidInvoices.length > 0
    ? paidInvoices.reduce((sum, i) => sum + i.total, 0) / paidInvoices.length
    : 0

  // Calculate client stats
  const totalClients = clients.length
  const newClientsThisMonth = clients.filter(
    (c) => c.createdAt >= monthStart && c.createdAt <= monthEnd
  ).length
  const activeClients = clients.filter((c) => c.invoices.length > 0).length

  // Calculate payment stats
  const totalPayments = payments.length
  const paymentsThisMonth = payments.filter(
    (p) => p.createdAt >= monthStart && p.createdAt <= monthEnd
  ).length

  // Calculate MRR (simplified - based on monthly average)
  const yearStart = startOfYear(now)
  const paymentsThisYear = payments.filter((p) => p.createdAt >= yearStart)
  const monthlyAverage = paymentsThisYear.length > 0
    ? paymentsThisYear.reduce((sum, p) => sum + p.amount, 0) / (now.getMonth() + 1)
    : 0

  // Calculate customer lifetime value
  const clientRevenues = await prisma.invoices.groupBy({
    by: ['clientId'],
    where: {
      ...whereClause,
      status: 'PAID',
      clientId: { not: null },
    },
    _sum: { total: true },
  })

  const customerLifetimeValue = clientRevenues.length > 0
    ? clientRevenues.reduce((sum, c) => sum + (c._sum.total || 0), 0) / clientRevenues.length
    : 0

  // Calculate average payment time (days between invoice sent and paid)
  const paidInvoicesWithDates = await prisma.invoices.findMany({
    where: {
      ...whereClause,
      status: 'PAID',
      paidAt: { not: null },
    },
    select: {
      createdAt: true,
      paidAt: true,
    },
  })

  const averagePaymentTime = paidInvoicesWithDates.length > 0
    ? paidInvoicesWithDates.reduce((sum, i) => {
        const days = i.paidAt
          ? Math.floor((i.paidAt.getTime() - i.createdAt.getTime()) / (1000 * 60 * 60 * 24))
          : 0
        return sum + days
      }, 0) / paidInvoicesWithDates.length
    : 0

  return {
    totalRevenue,
    revenueThisMonth,
    revenueLastMonth,
    revenueGrowth,
    mrr: monthlyAverage,
    arr: monthlyAverage * 12,
    totalInvoices,
    invoicesSent,
    invoicesPaid,
    invoicesOverdue,
    invoicesDraft,
    conversionRate,
    averageInvoiceValue,
    totalClients,
    newClientsThisMonth,
    activeClients,
    totalPayments,
    paymentsThisMonth,
    customerLifetimeValue,
    averagePaymentTime,
  }
}

/**
 * Get revenue by month for charting
 */
export async function getRevenueByMonth(params: {
  userId?: string
  teamId?: string
  months?: number
}): Promise<RevenueByMonth[]> {
  const { userId, teamId, months = 12 } = params

  const whereClause: { userId?: string; teamId?: string } = {}
  if (userId) whereClause.userId = userId
  if (teamId) whereClause.teamId = teamId

  const now = new Date()
  const startDate = subMonths(now, months - 1)

  const payments = await prisma.payments.findMany({
    where: {
      ...whereClause,
      status: 'COMPLETED',
      createdAt: { gte: startOfMonth(startDate) },
    },
    select: {
      amount: true,
      createdAt: true,
    },
  })

  const invoices = await prisma.invoices.findMany({
    where: {
      ...whereClause,
      createdAt: { gte: startOfMonth(startDate) },
    },
    select: {
      createdAt: true,
    },
  })

  // Group by month
  const result: RevenueByMonth[] = []
  for (let i = 0; i < months; i++) {
    const monthDate = subMonths(now, months - 1 - i)
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)

    const monthPayments = payments.filter(
      (p) => p.createdAt >= monthStart && p.createdAt <= monthEnd
    )
    const monthInvoices = invoices.filter(
      (i) => i.createdAt >= monthStart && i.createdAt <= monthEnd
    )

    result.push({
      month: format(monthDate, 'MMM yyyy'),
      revenue: monthPayments.reduce((sum, p) => sum + p.amount, 0),
      invoices: monthInvoices.length,
    })
  }

  return result
}

/**
 * Get invoice status breakdown
 */
export async function getInvoiceStatusBreakdown(params: {
  userId?: string
  teamId?: string
}): Promise<InvoiceStatusBreakdown[]> {
  const { userId, teamId } = params

  const whereClause: { userId?: string; teamId?: string } = {}
  if (userId) whereClause.userId = userId
  if (teamId) whereClause.teamId = teamId

  const statusCounts = await prisma.invoices.groupBy({
    by: ['status'],
    where: whereClause,
    _count: { id: true },
  })

  const total = statusCounts.reduce((sum, s) => sum + s._count.id, 0)

  return statusCounts.map((s) => ({
    status: s.status,
    count: s._count.id,
    percentage: total > 0 ? (s._count.id / total) * 100 : 0,
  }))
}

/**
 * Export analytics data to CSV format
 */
export function formatAnalyticsCSV(metrics: AnalyticsMetrics): string {
  const rows = [
    ['Metric', 'Value'],
    ['Total Revenue', metrics.totalRevenue.toString()],
    ['Revenue This Month', metrics.revenueThisMonth.toString()],
    ['Revenue Last Month', metrics.revenueLastMonth.toString()],
    ['Revenue Growth (%)', metrics.revenueGrowth.toFixed(2)],
    ['MRR', metrics.mrr.toString()],
    ['ARR', metrics.arr.toString()],
    ['Total Invoices', metrics.totalInvoices.toString()],
    ['Invoices Sent', metrics.invoicesSent.toString()],
    ['Invoices Paid', metrics.invoicesPaid.toString()],
    ['Invoices Overdue', metrics.invoicesOverdue.toString()],
    ['Invoices Draft', metrics.invoicesDraft.toString()],
    ['Conversion Rate (%)', metrics.conversionRate.toFixed(2)],
    ['Average Invoice Value', metrics.averageInvoiceValue.toString()],
    ['Total Clients', metrics.totalClients.toString()],
    ['New Clients This Month', metrics.newClientsThisMonth.toString()],
    ['Active Clients', metrics.activeClients.toString()],
    ['Total Payments', metrics.totalPayments.toString()],
    ['Payments This Month', metrics.paymentsThisMonth.toString()],
    ['Customer Lifetime Value', metrics.customerLifetimeValue.toString()],
    ['Average Payment Time (days)', metrics.averagePaymentTime.toFixed(1)],
  ]

  return rows.map((row) => row.join(',')).join('\n')
}
