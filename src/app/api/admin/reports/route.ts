import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const result = await requireAdminAuth()
    if (result.error || !result.admin) {
      return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const period = url.searchParams.get('period') || 'month' // day, week, month, year

    // Calculate date ranges
    const now = new Date()
    let startDate: Date
    let previousStartDate: Date

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        previousStartDate = new Date(startDate)
        previousStartDate.setDate(previousStartDate.getDate() - 1)
        break
      case 'week':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 7)
        previousStartDate = new Date(startDate)
        previousStartDate.setDate(previousStartDate.getDate() - 7)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    }

    // Get current period stats
    const [
      totalUsers,
      newUsers,
      totalInvoices,
      paidInvoices,
      totalRevenue,
      currentPeriodPayments,
      previousPeriodPayments,
      subscriptions,
      activeSubscriptions,
    ] = await Promise.all([
      // Total users
      prisma.users.count(),
      // New users this period
      prisma.users.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
      // Total invoices
      prisma.invoices.count(),
      // Paid invoices this period
      prisma.invoices.count({
        where: {
          status: 'PAID',
          paidAt: { gte: startDate },
        },
      }),
      // Total revenue
      prisma.payments.aggregate({
        where: {
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
      }),
      // Current period revenue
      prisma.payments.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate },
        },
        _sum: {
          amount: true,
        },
      }),
      // Previous period revenue
      prisma.payments.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: previousStartDate,
            lt: startDate,
          },
        },
        _sum: {
          amount: true,
        },
      }),
      // Total subscriptions
      prisma.subscriptions.count(),
      // Active subscriptions
      prisma.subscriptions.count({
        where: {
          status: 'ACTIVE',
        },
      }),
    ])

    // Get monthly revenue for chart (last 12 months)
    const monthlyRevenue = []
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

      const revenue = await prisma.payments.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: {
          amount: true,
        },
      })

      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        year: monthStart.getFullYear(),
        revenue: revenue._sum.amount || 0,
      })
    }

    // Get user growth for chart (last 12 months)
    const userGrowth = []
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

      const count = await prisma.users.count({
        where: {
          createdAt: {
            lte: monthEnd,
          },
        },
      })

      userGrowth.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        year: monthStart.getFullYear(),
        users: count,
      })
    }

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = await prisma.subscriptions.aggregate({
      where: {
        status: 'ACTIVE',
        planType: 'PRO',
      },
      _count: true,
    })

    // Get plan distribution
    const planDistribution = await prisma.subscriptions.groupBy({
      by: ['planType'],
      _count: true,
    })

    // Calculate growth percentages
    const currentRevenue = currentPeriodPayments._sum.amount || 0
    const previousRevenue = previousPeriodPayments._sum.amount || 0
    const revenueGrowth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0

    return NextResponse.json({
      overview: {
        totalUsers,
        newUsers,
        totalInvoices,
        paidInvoices,
        totalRevenue: totalRevenue._sum.amount || 0,
        currentPeriodRevenue: currentRevenue,
        previousPeriodRevenue: previousRevenue,
        revenueGrowth: revenueGrowth.toFixed(1),
        subscriptions,
        activeSubscriptions,
      },
      charts: {
        monthlyRevenue,
        userGrowth,
      },
      planDistribution: planDistribution.map((p) => ({
        plan: p.planType,
        count: p._count,
      })),
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
