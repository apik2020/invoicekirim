import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateReceiptPDF } from '@/lib/receipt-generator'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Download receipt PDF
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const payment = await prisma.payment.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        user: {
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

    // Generate PDF
    const pdfBuffer = await generateReceiptPDF({
      receiptNumber: payment.receiptNumber,
      date: payment.createdAt,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: 'Stripe',
      description: payment.description || 'InvoiceKirim Subscription Payment',
      customerName: payment.user.name || payment.user.email,
      customerEmail: payment.user.email,
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
