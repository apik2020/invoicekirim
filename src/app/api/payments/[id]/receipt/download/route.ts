import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateReceiptPDF } from '@/lib/receipt-pdf'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Download receipt PDF
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession()

    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const payment = await prisma.payments.findFirst({
      where: {
        id,
        userId: session.id,
      },
      include: {
        users: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    if (!payment.receiptNumber) {
      return NextResponse.json({ error: 'Receipt not generated' }, { status: 400 })
    }

    const user = payment.users

    // Generate PDF
    const pdfBuffer = await generateReceiptPDF({
      receiptNumber: payment.receiptNumber,
      date: payment.createdAt,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: 'Stripe',
      description: payment.description || 'InvoiceKirim Subscription Payment',
      customerName: user?.name || user?.email || 'Customer',
      customerEmail: user?.email || '',
      invoiceNumber: payment.invoiceId || undefined,
    })

    // Return PDF file
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${payment.receiptNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading receipt:', error)
    return NextResponse.json(
      { error: 'Failed to download receipt' },
      { status: 500 }
    )
  }
}
