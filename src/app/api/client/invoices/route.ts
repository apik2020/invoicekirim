import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getClientSession } from '@/lib/client-auth'

// Get all invoices for the logged-in client
export async function GET(request: NextRequest) {
  try {
    const client = await getClientSession()

    if (!client) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')

    // Build where clause
    const where: any = {
      client_invoice_access: {
        some: {
          clientId: client.id,
        },
      },
    }

    if (status && status !== 'ALL') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get invoices with pagination
    const [invoices, total] = await Promise.all([
      prisma.invoices.findMany({
        where,
        include: {
          invoice_items: true,
          client_invoice_access: {
            where: { clientId: client.id },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoices.count({ where }),
    ])

    return NextResponse.json({
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date,
        dueDate: invoice.dueDate,
        companyName: invoice.companyName,
        companyEmail: invoice.companyEmail,
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail,
        subtotal: invoice.subtotal,
        taxRate: invoice.taxRate,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        status: invoice.status,
        paidAt: invoice.paidAt,
        sentAt: invoice.sentAt,
        notes: invoice.notes,
        items: invoice.invoice_items,
        accessToken: invoice.client_invoice_access[0]?.accessToken || invoice.accessToken,
        createdAt: invoice.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get client invoices error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}
