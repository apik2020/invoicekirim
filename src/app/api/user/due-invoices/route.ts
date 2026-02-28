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
    const days = parseInt(searchParams.get('days') || '30')

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + days)

    // Fetch invoices with due dates
    const invoices = await prisma.invoice.findMany({
      where: {
        userId: session.user.id,
        dueDate: { not: null, lte: futureDate },
        status: { in: ['SENT', 'OVERDUE'] }, // Only unpaid invoices
      },
      orderBy: { dueDate: 'asc' },
    })

    // Categorize invoices
    const overdue: typeof invoices = []
    const dueToday: typeof invoices = []
    const dueThisWeek: typeof invoices = []
    const dueThisMonth: typeof invoices = []

    const weekFromNow = new Date(today)
    weekFromNow.setDate(weekFromNow.getDate() + 7)

    const monthFromNow = new Date(today)
    monthFromNow.setDate(monthFromNow.getDate() + 30)

    invoices.forEach((invoice) => {
      if (!invoice.dueDate) return

      const dueDate = new Date(invoice.dueDate)
      dueDate.setHours(0, 0, 0, 0)

      if (dueDate < today) {
        overdue.push(invoice)
      } else if (dueDate.getTime() === today.getTime()) {
        dueToday.push(invoice)
      } else if (dueDate <= weekFromNow) {
        dueThisWeek.push(invoice)
      } else if (dueDate <= monthFromNow) {
        dueThisMonth.push(invoice)
      }
    })

    // Calculate summary
    const overdueAmount = overdue.reduce((sum, inv) => sum + inv.total, 0)
    const dueThisWeekAmount = [...dueToday, ...dueThisWeek].reduce((sum, inv) => sum + inv.total, 0)
    const dueThisMonthAmount = [...dueToday, ...dueThisWeek, ...dueThisMonth].reduce((sum, inv) => sum + inv.total, 0)

    return NextResponse.json({
      overdue,
      dueToday,
      dueThisWeek,
      dueThisMonth,
      summary: {
        overdueCount: overdue.length,
        overdueAmount,
        dueTodayCount: dueToday.length,
        dueThisWeekCount: dueThisWeek.length,
        dueThisWeekAmount,
        dueThisMonthCount: dueThisMonth.length,
        dueThisMonthAmount,
      },
    })
  } catch (error) {
    console.error('Error fetching due invoices:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data jatuh tempo' },
      { status: 500 }
    )
  }
}
