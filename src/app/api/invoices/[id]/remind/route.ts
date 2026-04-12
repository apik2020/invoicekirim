import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPaymentReminder, sendInvoiceOverdue } from '@/lib/email'
import { formatCurrency, formatDate } from '@/lib/utils'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if invoice exists and belongs to user
    const invoice = await prisma.invoices.findFirst({
      where: {
        id,
        userId: session.id,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 })
    }

    // Only allow reminders for SENT or OVERDUE invoices
    if (invoice.status !== 'SENT' && invoice.status !== 'OVERDUE') {
      return NextResponse.json(
        { error: 'Hanya bisa mengirim reminder untuk invoice dengan status SENT atau OVERDUE' },
        { status: 400 }
      )
    }

    // Calculate days until due or days overdue
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null
    if (!dueDate) {
      return NextResponse.json({ error: 'Invoice tidak memiliki tanggal jatuh tempo' }, { status: 400 })
    }

    const today = new Date()
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const invoiceUrl = `${baseUrl}/invoice/${invoice.accessToken}`

    // Determine if overdue or upcoming
    const isOverdue = daysOverdue > 0

    let result
    if (isOverdue) {
      // Send overdue notification for overdue invoices
      result = await sendInvoiceOverdue({
        to: invoice.clientEmail,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        companyName: invoice.companyName,
        total: formatCurrency(invoice.total),
        dueDate: formatDate(dueDate),
        daysOverdue,
        invoiceUrl,
        userId: session.id,
        teamId: invoice.teamId ?? undefined,
      })
    } else {
      // Send payment reminder for upcoming due dates
      result = await sendPaymentReminder({
        to: invoice.clientEmail,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        companyName: invoice.companyName,
        total: formatCurrency(invoice.total),
        dueDate: formatDate(dueDate),
        daysUntilDue: daysUntilDue > 0 ? daysUntilDue : 0,
        invoiceUrl,
        userId: session.id,
        teamId: invoice.teamId ?? undefined,
      })
    }

    if (!result.success) {
      return NextResponse.json(
        { error: 'Gagal mengirim reminder', details: result.error },
        { status: 500 }
      )
    }

    // Update reminder tracking fields
    await prisma.invoices.update({
      where: { id },
      data: {
        reminderCount: { increment: 1 },
        lastReminderAt: new Date(),
      },
    })

    return NextResponse.json({
      message: 'Payment reminder berhasil dikirim',
      to: invoice.clientEmail,
    })
  } catch (error) {
    console.error('Send payment reminder error:', error)
    return NextResponse.json(
      { error: 'Gagal mengirim payment reminder' },
      { status: 500 }
    )
  }
}
