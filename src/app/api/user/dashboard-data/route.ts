import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserSession } from '@/lib/session'
import { logger } from '@/lib/logger'

// Retry helper for database queries
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 500
): Promise<T> {
  let lastError: any
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      if (error?.code === 'P1001' && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
        continue
      }
      throw error
    }
  }
  throw lastError
}

// This function is no longer needed - removed in favor of getUserSession() from @/lib/session

export async function GET(_req: NextRequest) {
  try {
    // Get authenticated user session (supports both NextAuth and custom JWT sessions)
    const session = await getUserSession()

    if (!session?.id) {
      logger.dev('Dashboard API', 'No valid session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin - redirect to admin dashboard
    if (session.isAdmin) {
      logger.dev('Dashboard API', 'Admin user detected, should use admin dashboard')
      return NextResponse.json(
        { error: 'Admin users should use /admin dashboard' },
        { status: 403 }
      )
    }

    const userId = session.id
    logger.dev('Dashboard API', 'Fetching dashboard data for user:', userId)

    const [invoices, subscription, activityLogs, dueInvoices] = await Promise.all([
      withRetry(() => prisma.invoices.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { invoice_items: true },
      })),
      withRetry(() => prisma.subscriptions.findUnique({
        where: { userId },
      })),
      withRetry(() => prisma.activity_logs.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })),
      withRetry(() => prisma.invoices.findMany({
        where: {
          userId,
          dueDate: { not: null },
          status: { in: ['SENT', 'OVERDUE'] },
        },
        orderBy: { dueDate: 'asc' },
        take: 20,
      })),
    ])

    // Calculate stats from ALL invoices
    const [allInvoices, stats] = await Promise.all([
      withRetry(() => prisma.invoices.findMany({ where: { userId } })),
      withRetry(() => prisma.invoices.groupBy({
        by: ['status'],
        where: { userId },
        _count: { id: true },
      })),
    ])

    const totalInvoices = allInvoices.length
    const totalRevenue = allInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const paidInvoices = allInvoices.filter((inv) => inv.status === 'PAID').length
    const pendingInvoices = allInvoices.filter(
      (inv) => inv.status === 'SENT' || inv.status === 'DRAFT'
    ).length

    // Status counts
    const statusCounts = {
      ALL: totalInvoices,
      DRAFT: stats.find((s) => s.status === 'DRAFT')?._count.id || 0,
      SENT: stats.find((s) => s.status === 'SENT')?._count.id || 0,
      PAID: stats.find((s) => s.status === 'PAID')?._count.id || 0,
      OVERDUE: stats.find((s) => s.status === 'OVERDUE')?._count.id || 0,
      CANCELED: stats.find((s) => s.status === 'CANCELED')?._count.id || 0,
    }

    // Categorize due invoices
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const weekFromNow = new Date(today)
    weekFromNow.setDate(weekFromNow.getDate() + 7)

    const overdue: Array<{
      id: string
      invoiceNumber: string
      clientName: string
      total: number
      dueDate: Date | null
    }> = []
    const dueToday: typeof overdue = []
    const dueThisWeek: typeof overdue = []

    dueInvoices.forEach((invoice) => {
      if (!invoice.dueDate) return

      const dueDate = new Date(invoice.dueDate)
      dueDate.setHours(0, 0, 0, 0)

      if (dueDate < today) {
        overdue.push(invoice)
      } else if (dueDate.getTime() === today.getTime()) {
        dueToday.push(invoice)
      } else if (dueDate <= weekFromNow) {
        dueThisWeek.push(invoice)
      }
    })

    const overdueAmount = overdue.reduce((sum, inv) => sum + inv.total, 0)
    const dueThisWeekAmount = [...dueToday, ...dueThisWeek].reduce((sum, inv) => sum + inv.total, 0)

    // Compute analytics directly (avoid internal HTTP fetch which lacks auth)
    const analyticsMonths = 6
    const analyticsStartDate = new Date()
    analyticsStartDate.setMonth(analyticsStartDate.getMonth() - analyticsMonths)

    const [analyticsInvoices, statusBreakdown] = await Promise.all([
      withRetry(() => prisma.invoices.findMany({
        where: {
          userId,
          date: { gte: analyticsStartDate },
        },
        orderBy: { date: 'asc' },
      })),
      withRetry(() => prisma.invoices.groupBy({
        by: ['status'],
        where: { userId },
        _sum: { total: true },
        _count: { id: true },
      })),
    ])

    // Initialize all months
    const monthlyData = new Map<string, { month: string; revenue: number; paid: number; pending: number; count: number }>()
    for (let i = 0; i < analyticsMonths; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() - (analyticsMonths - 1 - i))
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyData.set(key, {
        month: date.toISOString(),
        revenue: 0,
        paid: 0,
        pending: 0,
        count: 0,
      })
    }

    // Aggregate monthly data
    analyticsInvoices.forEach((invoice) => {
      const date = new Date(invoice.date)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const data = monthlyData.get(key)
      if (data) {
        data.count += 1
        data.revenue += invoice.total
        if (invoice.status === 'PAID') {
          data.paid += invoice.total
        } else if (invoice.status === 'SENT' || invoice.status === 'OVERDUE') {
          data.pending += invoice.total
        }
      }
    })

    // Revenue by status
    const revenueByStatus = statusBreakdown.map((item) => ({
      status: item.status,
      total: item._sum.total || 0,
      count: item._count.id,
    }))

    // Summary
    const analyticsPaid = analyticsInvoices.filter((inv) => inv.status === 'PAID').reduce((sum, inv) => sum + inv.total, 0)
    const analyticsPending = analyticsInvoices.filter((inv) => inv.status === 'SENT' || inv.status === 'OVERDUE').reduce((sum, inv) => sum + inv.total, 0)

    const dataArr = Array.from(monthlyData.values()).filter((d) => d.count > 0)
    let growthRate = 0
    if (dataArr.length >= 2) {
      const lastMonth = dataArr[dataArr.length - 1].revenue
      const prevMonth = dataArr[dataArr.length - 2].revenue
      if (prevMonth > 0) {
        growthRate = ((lastMonth - prevMonth) / prevMonth) * 100
      }
    }

    const analytics = {
      revenueByMonth: Array.from(monthlyData.values()),
      revenueByStatus,
      summary: {
        totalRevenue: analyticsInvoices.reduce((sum, inv) => sum + inv.total, 0),
        paidRevenue: analyticsPaid,
        pendingRevenue: analyticsPending,
        growthRate: Math.round(growthRate * 10) / 10,
      },
    }

    return NextResponse.json({
      invoices: invoices.slice(0, 5),
      subscription,
      activityLogs,
      dueInvoices: {
        overdue,
        dueToday,
        dueThisWeek,
        summary: {
          overdueCount: overdue.length,
          overdueAmount,
          dueThisWeekCount: dueToday.length + dueThisWeek.length,
          dueThisWeekAmount,
        },
      },
      stats: {
        totalInvoices,
        totalRevenue,
        paidInvoices,
        pendingInvoices,
        statusCounts,
      },
      analytics,
    })
  } catch (error) {
    logger.apiError('/api/user/dashboard-data GET', error)

    // Check for specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; message?: string }

      // Log detailed error for debugging
      logger.error('Prisma error details:', {
        code: prismaError.code,
        message: prismaError.message,
      })

      if (prismaError.code === 'P1001') {
        return NextResponse.json(
          { error: 'Tidak dapat terhubung ke database. Silakan coba lagi.' },
          { status: 503 }
        )
      }

      // Handle other Prisma errors with more details
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          { error: 'Terjadi kesalahan constraint database.' },
          { status: 500 }
        )
      }

      if (prismaError.code === 'P2025') {
        return NextResponse.json(
          { error: 'Data tidak ditemukan.' },
          { status: 404 }
        )
      }
    }

    // Log the full error for debugging (in development)
    if (process.env.NODE_ENV === 'development') {
      logger.error('Full error stack:', error)
    }

    return NextResponse.json(
      {
        error: 'Gagal mengambil data dashboard. Silakan coba lagi.',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : String(error)
        })
      },
      { status: 500 }
    )
  }
}
