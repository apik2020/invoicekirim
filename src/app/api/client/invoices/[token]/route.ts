import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBranding } from '@/lib/branding'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Find invoice by access token
    const invoice = await prisma.invoices.findUnique({
      where: { accessToken: token },
      include: { invoice_items: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 })
    }

    // Don't show DRAFT invoices to clients
    if (invoice.status === 'DRAFT') {
      return NextResponse.json({ error: 'Invoice belum tersedia' }, { status: 403 })
    }

    // Track invoice view - update viewedAt and increment viewCount
    await prisma.invoices.update({
      where: { accessToken: token },
      data: {
        viewedAt: new Date(),
        viewCount: { increment: 1 },
      },
    })

    // Fetch branding for the invoice's team
    let branding = null
    if (invoice.teamId) {
      branding = await getBranding(invoice.teamId)
    }

    return NextResponse.json({ ...invoice, branding })
  } catch (error) {
    console.error('Get invoice by token error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil invoice' },
      { status: 500 }
    )
  }
}
