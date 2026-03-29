import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

// Helper to get authenticated user from either NextAuth or custom session
async function getAuthenticatedUser() {
  // First, try NextAuth session (for Google OAuth users)
  const nextAuthSession = await getServerSession(authOptions)

  if (nextAuthSession?.user?.id) {
    // Check if user is admin
    if (nextAuthSession.user.isAdmin) {
      return null // Admin should use admin dashboard
    }

    // Get fresh user data from database
    const dbUser = await prisma.users.findUnique({
      where: { id: nextAuthSession.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      }
    })

    if (dbUser) {
      return {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        image: dbUser.image,
        isAdmin: false // Regular user from NextAuth
      }
    }
  }

  // Fallback: Check custom user_session cookie (for credentials login)
  const cookieStore = await cookies()
  const userSessionCookie = cookieStore.get('user_session')

  if (userSessionCookie?.value) {
    const session = JSON.parse(userSessionCookie.value)

    if (session?.id) {
      // Check if user is admin
      if (session.isAdmin) {
        return null // Admin should use admin dashboard
      }

      return session
    }
  }

  return null
}

export async function GET(_req: NextRequest) {
  try {
    // Get authenticated user from either session type
    const session = await getAuthenticatedUser()

    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.id

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
