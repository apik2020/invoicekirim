import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/pdf/InvoicePDF'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get invoice with items
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: { items: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 })
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(<InvoicePDF invoice={invoice as any} />)

    // Return PDF with appropriate headers
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Generate PDF error:', error)
    return NextResponse.json(
      { error: 'Gagal generate PDF' },
      { status: 500 }
    )
  }
}
