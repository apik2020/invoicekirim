import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkFeatureAccess } from '@/lib/feature-access'
import { trackPdfExport } from '@/lib/feature-access'
import { generateInvoicesCSV, generateInvoicesExcel, InvoiceExportData } from '@/lib/export-invoices'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET /api/invoices/export - Export invoices to CSV or Excel
export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 🔒 FEATURE ACCESS CHECK: PDF Export
    const exportAccess = await checkFeatureAccess(session.id, 'PDF_EXPORT')

    if (!exportAccess.allowed) {
      return NextResponse.json(
        {
          error: 'FEATURE_LOCKED',
          message: getExportLockedMessage(exportAccess.reason, exportAccess.limit, exportAccess.currentUsage),
          upgradeUrl: exportAccess.upgradeUrl || '/dashboard/checkout',
          planRequired: exportAccess.planName,
        },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'csv' // csv or excel
    const status = searchParams.get('status') // Filter by status
    const search = searchParams.get('search') // Search query
    const startDate = searchParams.get('startDate') // Start date filter
    const endDate = searchParams.get('endDate') // End date filter

    // Build where clause
    const where: any = {
      userId: session.id,
    }

    if (status && status !== 'ALL') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientEmail: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    // Fetch invoices with items and client relation
    const invoices = await prisma.invoices.findMany({
      where,
      include: {
        invoice_items: {
          select: {
            description: true,
            quantity: true,
            price: true,
          },
        },
        clients: {
          select: {
            name: true,
            company: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    if (invoices.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada invoice untuk diekspor' },
        { status: 400 }
      )
    }

    // Transform data for export - flatten items
    const exportData: InvoiceExportData[] = invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.date,
      dueDate: invoice.dueDate,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      clientPhone: invoice.clientPhone,
      clientCompany: invoice.clients?.company || '',
      status: invoice.status,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      discountType: invoice.discountType,
      discountValue: invoice.discountValue,
      discountAmount: invoice.discountAmount,
      total: invoice.total,
      notes: invoice.notes,
      items: invoice.invoice_items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      })),
    }))

    const timestamp = new Date().toISOString().split('T')[0]

    if (format === 'excel') {
      // Generate Excel file
      const buffer = await generateInvoicesExcel(exportData)

      // 🔍 Track export usage
      await trackPdfExport(session.id)

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="invoices-${timestamp}.xlsx"`,
        },
      })
    } else {
      // Generate CSV
      const csv = generateInvoicesCSV(exportData)

      // 🔍 Track export usage
      await trackPdfExport(session.id)

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="invoices-${timestamp}.csv"`,
        },
      })
    }
  } catch (error) {
    console.error('Export invoices error:', error)
    return NextResponse.json(
      { error: 'Gagal mengekspor invoice' },
      { status: 500 }
    )
  }
}

/**
 * Get user-friendly message for locked export feature
 */
function getExportLockedMessage(
  reason?: string,
  limit?: number | null,
  currentUsage?: number
): string {
  switch (reason) {
    case 'trial_expired':
      return 'Masa trial Anda telah berakhir. Upgrade ke Pro untuk melanjutkan ekspor invoice.'
    case 'usage_exceeded':
      if (limit !== null && currentUsage !== undefined) {
        return `Anda telah mencapai batas ekspor bulanan (${currentUsage}/${limit}). Upgrade ke Pro untuk ekspor tanpa batas.`
      }
      return 'Anda telah mencapai batas ekspor bulanan. Upgrade ke Pro untuk melanjutkan.'
    case 'feature_locked':
      return 'Fitur ekspor invoice hanya tersedia untuk pengguna Pro. Upgrade sekarang untuk mengekspor data invoice Anda.'
    default:
      return 'Ekspor invoice tersedia dalam paket Pro. Upgrade untuk membuka fitur ini.'
  }
}
