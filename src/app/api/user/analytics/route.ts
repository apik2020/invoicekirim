import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const months = parseInt(searchParams.get('months') || '12')

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    // Fetch all invoices in date range
    const invoices = await prisma.invoice.findMany({
      where: {
        userId: session.user.id,
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
    const statusData = await prisma.invoice.groupBy({
      by: ['status'],
      where: { userId: session.user.id },
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
