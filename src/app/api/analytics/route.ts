import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import {
  getAnalytics,
  getRevenueByMonth,
  getInvoiceStatusBreakdown,
  formatAnalyticsCSV,
} from '@/lib/analytics'

// GET /api/analytics - Get comprehensive analytics
export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId') || undefined
    const format = searchParams.get('format') || 'json'
    const months = parseInt(searchParams.get('months') || '12')

    // If teamId is provided, use team analytics; otherwise use user analytics
    const params = teamId ? { teamId } : { userId: session.id }

    const [metrics, revenueByMonth, invoiceBreakdown] = await Promise.all([
      getAnalytics(params),
      getRevenueByMonth({ ...params, months }),
      getInvoiceStatusBreakdown(params),
    ])

    if (format === 'csv') {
      const csv = formatAnalyticsCSV(metrics)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="analytics.csv"',
        },
      })
    }

    return NextResponse.json({
      metrics,
      revenueByMonth,
      invoiceBreakdown,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
