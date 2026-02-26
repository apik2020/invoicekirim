import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendInvoiceSent, sendInvoicePaid, sendInvoiceOverdue } from '@/lib/email'
import { formatCurrency, formatDate } from '@/lib/utils'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { status } = await req.json()

    if (!['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELED'].includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 })
    }

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

    const previousStatus = invoice.status

    // Update status and paidAt if marking as paid
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        ...(status === 'PAID' && { paidAt: new Date() }),
        ...(status !== 'PAID' && { paidAt: null }),
      },
      include: { items: true },
    })

    // Send email notifications based on status change
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const invoiceUrl = `${baseUrl}/invoices/${id}`

    // DRAFT → SENT: Send invoice email to client
    if (previousStatus === 'DRAFT' && status === 'SENT') {
      await sendInvoiceSent({
        to: invoice.clientEmail,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        companyName: invoice.companyName,
        total: formatCurrency(invoice.total),
        dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : '-',
        invoiceUrl,
      }).catch((error) => {
        console.error('Failed to send invoice email:', error)
      })
    }

    // Any STATUS → PAID: Send payment confirmation
    if (status === 'PAID') {
      await sendInvoicePaid({
        to: invoice.clientEmail,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        companyName: invoice.companyName,
        total: formatCurrency(invoice.total),
        paidDate: formatDate(new Date()),
      }).catch((error) => {
        console.error('Failed to send payment confirmation email:', error)
      })
    }

    // Any STATUS → OVERDUE: Send overdue notification
    if (status === 'OVERDUE' && previousStatus !== 'OVERDUE') {
      const daysOverdue = Math.floor(
        (Date.now() - new Date(invoice.dueDate!).getTime()) / (1000 * 60 * 60 * 24)
      )

      await sendInvoiceOverdue({
        to: invoice.clientEmail,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        companyName: invoice.companyName,
        total: formatCurrency(invoice.total),
        dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : '-',
        daysOverdue,
        invoiceUrl,
      }).catch((error) => {
        console.error('Failed to send overdue email:', error)
      })
    }

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error('Update invoice status error:', error)
    return NextResponse.json(
      { error: 'Gagal mengubah status invoice' },
      { status: 500 }
    )
  }
}
