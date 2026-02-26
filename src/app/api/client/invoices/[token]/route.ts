import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Find invoice by access token
    const invoice = await prisma.invoice.findUnique({
      where: { accessToken: token },
      include: { items: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 })
    }

    // Don't show DRAFT invoices to clients
    if (invoice.status === 'DRAFT') {
      return NextResponse.json({ error: 'Invoice belum tersedia' }, { status: 403 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Get invoice by token error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil invoice' },
      { status: 500 }
    )
  }
}
