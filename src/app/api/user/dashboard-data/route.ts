import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin - block access to user dashboard
    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    })

    if (admin) {
      return NextResponse.json(
        { error: 'Akses ditolak. Admin harus menggunakan dashboard admin di /admin' },
        { status: 403 }
      )
    }

    const userId = session.user.id

    const [invoices, subscription, activityLogs, dueInvoices] = await Promise.all([
      withRetry(() => prisma.invoice.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { items: true },
      })),
      withRetry(() => prisma.subscription.findUnique({
        where: { userId },
      })),
      withRetry(() => prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })),
      withRetry(() => prisma.invoice.findMany({
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
      withRetry(() => prisma.invoice.findMany({ where: { userId } })),
      withRetry(() => prisma.invoice.groupBy({
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

    // Fetch analytics
    const analytics = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/user/analytics?months=6`)
      .then(res => res.json())
      .catch(() => ({ revenueByMonth: [], revenueByStatus: [], summary: {} }))

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
    console.error('Error fetching dashboard data:', error)

    // Check for specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; message?: string }
      if (prismaError.code === 'P1001') {
        return NextResponse.json(
          { error: 'Tidak dapat terhubung ke database. Silakan coba lagi.' },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Gagal mengambil data dashboard. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
