import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendPaymentReminder } from '@/lib/email'
import { formatCurrency, formatDate } from '@/lib/utils'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if invoice exists and belongs to user
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: session.user.id,
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
    const invoiceUrl = `${baseUrl}/invoices/${id}`

    // Send payment reminder
    const result = await sendPaymentReminder({
      to: invoice.clientEmail,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      companyName: invoice.companyName,
      total: formatCurrency(invoice.total),
      dueDate: formatDate(dueDate),
      daysUntilDue: daysUntilDue > 0 ? daysUntilDue : 0,
      invoiceUrl,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: 'Gagal mengirim reminder', details: result.error },
        { status: 500 }
      )
    }

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
