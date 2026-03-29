import { NextRequest, NextResponse } from 'next/server'
import { getUserSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { checkFeatureAccess } from '@/lib/feature-access'

export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 🔒 FEATURE ACCESS CHECK: Analytics View
    const analyticsAccess = await checkFeatureAccess(session.id, 'ANALYTICS_VIEW')

    if (!analyticsAccess.allowed) {
      return NextResponse.json(
        {
          error: 'FEATURE_LOCKED',
          message: getAnalyticsLockedMessage(analyticsAccess.reason),
          upgradeUrl: analyticsAccess.upgradeUrl || '/checkout',
          planRequired: analyticsAccess.planName,
        },
        { status: 403 }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const months = parseInt(searchParams.get('months') || '12')

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    // Fetch all invoices in date range
    const invoices = await prisma.invoices.findMany({
      where: {
        userId: session.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    })

    // Group by month
    const monthlyData = new Map<string, {
      month: string
      revenue: number
      paid: number
      pending: number
      count: number
    }>()

    // Initialize all months
    for (let i = 0; i < months; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() - (months - 1 - i))
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyData.set(key, {
        month: date.toISOString(),
        revenue: 0,
        paid: 0,
        pending: 0,
        count: 0,
      })
    }

    // Aggregate data
    invoices.forEach((invoice) => {
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
    const statusData = await prisma.invoices.groupBy({
      by: ['status'],
      where: { userId: session.id },
      _sum: { total: true },
      _count: { id: true },
    })

    const revenueByStatus = statusData.map((item) => ({
      status: item.status,
      total: item._sum.total || 0,
      count: item._count.id,
    }))

    // Summary
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0)
    const paidRevenue = invoices.filter((inv) => inv.status === 'PAID').reduce((sum, inv) => sum + inv.total, 0)
    const pendingRevenue = invoices.filter((inv) => inv.status === 'SENT' || inv.status === 'OVERDUE').reduce((sum, inv) => sum + inv.total, 0)

    // Calculate growth rate (compare last month with previous month)
    const dataArr = Array.from(monthlyData.values()).filter((d) => d.count > 0)
    let growthRate = 0
    if (dataArr.length >= 2) {
      const lastMonth = dataArr[dataArr.length - 1].revenue
      const prevMonth = dataArr[dataArr.length - 2].revenue
      if (prevMonth > 0) {
        growthRate = ((lastMonth - prevMonth) / prevMonth) * 100
      }
    }

    return NextResponse.json({
      revenueByMonth: Array.from(monthlyData.values()),
      revenueByStatus,
      summary: {
        totalRevenue,
        paidRevenue,
        pendingRevenue,
        growthRate: Math.round(growthRate * 10) / 10,
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil analytics' },
      { status: 500 }
    )
  }
}

/**
 * Get user-friendly message for locked analytics
 */
function getAnalyticsLockedMessage(reason?: string): string {
  switch (reason) {
    case 'trial_expired':
      return 'Masa trial Anda telah berakhir. Upgrade ke Pro untuk melanjutkan akses analitik.'
    case 'feature_locked':
      return 'Analitik bisnis mendalam hanya tersedia untuk pengguna Pro. Upgrade sekarang untuk melihat performa bisnis Anda.'
    case 'plan_limit':
      return 'Paket Anda saat ini tidak termasuk analitik. Upgrade ke Pro untuk akses fitur analitik.'
    default:
      return 'Analitik tersedia dalam paket Pro. Upgrade untuk melihat statistik bisnis Anda.'
  }
}
