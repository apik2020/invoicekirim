import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { CACHE_DURATIONS } from '@/lib/cache'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const revalidate = CACHE_DURATIONS.SHORT
export const fetchCache = 'force-no-store'

export async function GET(req: NextRequest) {
  try {
    // Verify admin session (separate from user session)
    const result = await requireAdminAuth()
    if (result.error) {
      return result.error
    }

    const url = new URL(req.url)
    const period = parseInt(url.searchParams.get('period') || '30')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period)

    // Get date ranges for growth calculation
    const previousStartDate = new Date(startDate)
    previousStartDate.setDate(previousStartDate.getDate() - period)

    // Parallel queries for better performance
    const [
      totalUsers,
      totalInvoices,
      totalRevenue,
      activeSubscriptions,
      recentUsers,
      recentInvoices,
      invoicesByStatus,
      topClients,
      usersWithSubscription,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Total invoices
      prisma.invoice.count(),

      // Total revenue (paid invoices only)
      prisma.invoice.aggregate({
        where: { status: 'PAID' },
        _sum: { total: true },
      }),

      // Active subscriptions (PRO plans with valid stripe period)
      prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          stripeCurrentPeriodEnd: {
            gte: new Date(),
          },
        },
      }),

      // Recent users
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      }),

      // Recent invoices
      prisma.invoice.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),

      // Invoice count by status
      prisma.invoice.groupBy({
        by: ['status'],
        _count: true,
      }),

      // Top clients by revenue
      prisma.invoice.groupBy({
        by: ['clientEmail'],
        _count: true,
        _sum: { total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 10,
      }),

      // Users with active subscriptions (unique users)
      prisma.subscription.groupBy({
        by: ['userId'],
        where: {
          status: 'ACTIVE',
          stripeCurrentPeriodEnd: {
            gte: new Date(),
          },
        },
      }),
    ])

    // Calculate users without subscription
    const usersWithoutSubscription = totalUsers - usersWithSubscription.length

    // Calculate month-by-month stats
    const invoicesByMonth = []
    const usersByMonth = []
    const revenueByMonth = []

    // Get monthly invoice count
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date()
      monthDate.setMonth(monthDate.getMonth() - i)
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999)

      const [monthInvoiceCount, monthUserCount, monthRevenue] = await Promise.all([
        prisma.invoice.count({
          where: {
            createdAt: { gte: monthStart, lt: monthEnd },
          },
        }),
        prisma.user.count({
          where: {
            createdAt: { gte: monthStart, lt: monthEnd },
          },
        }),
        prisma.invoice.aggregate({
          where: {
            status: 'PAID',
            date: { gte: monthStart, lt: monthEnd },
          },
          _sum: { total: true },
        }),
      ])

      invoicesByMonth.push({
        month: monthStart.toISOString(),
        count: monthInvoiceCount,
      })

      usersByMonth.push({
        month: monthStart.toISOString(),
        count: monthUserCount,
      })

      revenueByMonth.push({
        month: monthStart.toISOString(),
        revenue: monthRevenue._sum.total || 0,
        count: monthInvoiceCount,
      })
    }

    // Calculate growth metrics
    const [previousRevenue, previousInvoices, previousUsers] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          date: {
            gte: previousStartDate,
            lt: startDate,
          },
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: previousStartDate,
            lt: startDate,
          },
        },
      }),
      prisma.invoice.count({
        where: {
          createdAt: {
            gte: previousStartDate,
            lt: startDate,
          },
        },
      }),
    ])

    const revenueGrowth = previousRevenue._sum.total
      ? ((totalRevenue._sum.total || 0) - previousRevenue._sum.total) / previousRevenue._sum.total * 100
      : 0

    const invoiceGrowth = previousInvoices
      ? (totalInvoices - previousInvoices) / previousInvoices * 100
      : 0

    const userGrowth = previousUsers
      ? (totalUsers - previousUsers) / previousUsers * 100
      : 0

    const analyticsData = {
      summary: {
        totalUsers,
        totalInvoices,
        totalRevenue: totalRevenue._sum.total || 0,
        activeSubscriptions,
        usersWithSubscription: usersWithSubscription.length,
        usersWithoutSubscription,
        revenueGrowth: Number(revenueGrowth.toFixed(2)),
        invoiceGrowth: Number(invoiceGrowth.toFixed(2)),
        userGrowth: Number(userGrowth.toFixed(2)),
      },
      recentUsers,
      recentInvoices,
      invoicesByStatus: invoicesByStatus.map(item => ({
        status: item.status,
        count: item._count,
      })),
      invoicesByMonth,
      usersByMonth,
      topClients: topClients.map(item => ({
        clientEmail: item.clientEmail,
        invoiceCount: item._count,
        totalRevenue: item._sum.total || 0,
      })),
      revenueByMonth,
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
