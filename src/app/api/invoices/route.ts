import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { invoiceSchema } from '@/lib/validations/invoice'
import { generateInvoiceNumber } from '@/lib/utils'
import { checkRateLimit, apiRateLimit } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {
      userId: session.user.id,
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

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ])

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get invoices error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil invoice' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting check (per user)
    const rateLimit = await checkRateLimit(`invoice:create:${session.user.id}`, apiRateLimit)

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Terlalu banyak percobaan. Silakan coba lagi dalam 1 menit.',
          retryAfter: rateLimit.reset,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.reset.toString(),
            'Retry-After': Math.ceil((rateLimit.reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    // Check subscription limits
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (subscription?.planType === 'FREE') {
      const invoiceCount = await prisma.invoice.count({
        where: {
          userId: session.user.id,
          createdAt: {
            gte: new Date(new Date().setDate(1)), // Start of current month
          },
        },
      })

      if (invoiceCount >= 10) {
        return NextResponse.json(
          {
            error: 'Batas gratis tercapai (10 invoice/bulan). Upgrade ke Pro untuk invoice tanpa batas.',
          },
          { status: 403 }
        )
      }
    }

    const body = await req.json()
    const validation = invoiceSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { items, ...data } = validation.data

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0)
    const taxAmount = subtotal * (data.taxRate / 100)
    const total = subtotal + taxAmount

    // Generate invoice number if not provided
    const invoiceNumber = data.invoiceNumber || generateInvoiceNumber()

    // Check if invoice number already exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
    })

    if (existingInvoice) {
      return NextResponse.json(
        { error: 'Nomor invoice sudah digunakan' },
        { status: 400 }
      )
    }

    const invoice = await prisma.invoice.create({
      data: {
        ...data,
        invoiceNumber,
        userId: session.user.id,
        date: new Date(data.date),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        subtotal,
        taxAmount,
        total,
        status: data.status || 'DRAFT',
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: true },
    })

    return NextResponse.json(
      invoice,
      {
        status: 201,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString(),
        },
      }
    )
  } catch (error) {
    console.error('Create invoice error:', error)
    return NextResponse.json(
      { error: 'Gagal membuat invoice' },
      { status: 500 }
    )
  }
}
