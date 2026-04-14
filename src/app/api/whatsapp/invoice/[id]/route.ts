import { NextRequest, NextResponse } from 'next/server'
import { getUserSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage, buildInvoiceMessage, buildReminderMessage } from '@/lib/whatsapp'
import { formatCurrency, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

/**
 * POST /api/whatsapp/invoice/[id]
 * Send an invoice via WhatsApp.
 *
 * Body: { type: 'invoice' | 'reminder' }
 * - invoice: Send invoice notification
 * - reminder: Send payment reminder
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { type = 'invoice' } = await req.json()

    // Fetch invoice
    const invoice = await prisma.invoices.findFirst({
      where: { id, userId: session.id },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 })
    }

    // Phone number is required
    if (!invoice.clientPhone) {
      return NextResponse.json(
        { error: 'Client tidak memiliki nomor telepon. Tambahkan nomor telepon ke data client terlebih dahulu.' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const invoiceUrl = `${baseUrl}/invoice/${invoice.accessToken}`
    const paymentStatus = invoice.status === 'PAID' ? 'LUNAS' : 'Belum Dibayar'

    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      companyName: invoice.companyName,
      total: formatCurrency(invoice.total),
      dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : '-',
      paymentStatus,
      invoiceUrl,
    }

    let message: string

    if (type === 'reminder') {
      // Calculate days
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null
      const today = new Date()
      const daysUntilDue = dueDate
        ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : 0
      const daysOverdue = dueDate
        ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0

      message = buildReminderMessage({
        ...invoiceData,
        daysUntilDue: Math.max(0, daysUntilDue),
        daysOverdue: Math.max(0, daysOverdue),
      })
    } else {
      message = buildInvoiceMessage(invoiceData)
    }

    const result = await sendWhatsAppMessage(invoice.clientPhone, message)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Gagal mengirim invoice via WhatsApp' },
        { status: 500 }
      )
    }

    // Log activity
    try {
      await prisma.activity_logs.create({
        data: {
          id: crypto.randomUUID(),
          userId: session.id,
          action: 'CREATED',
          entityType: 'feature_usage',
          entityId: 'whatsapp_send',
          title: `Invoice ${type === 'reminder' ? 'reminder' : ''} dikirim via WhatsApp`,
          description: `Invoice ${invoice.invoiceNumber} dikirim ke ${invoice.clientPhone}`,
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            type,
            phone: invoice.clientPhone,
            messageId: result.messageId,
          },
        },
      })
    } catch {
      // Non-critical — don't fail the request
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      to: invoice.clientPhone,
    })
  } catch (error) {
    console.error('[WA INVOICE] Error:', error)
    return NextResponse.json(
      { error: 'Gagal mengirim invoice via WhatsApp' },
      { status: 500 }
    )
  }
}
