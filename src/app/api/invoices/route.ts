import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { invoiceSchema } from '@/lib/validations/invoice'
import { generateInvoiceNumber } from '@/lib/utils'
import { checkRateLimit, apiRateLimit } from '@/lib/rate-limit'
import { logInvoiceCreated } from '@/lib/activity-log'

// Helper function to calculate discount
function calculateDiscount(
  amount: number,
  type?: string | null,
  value?: number | null
): number {
  if (!value || value <= 0 || !type) return 0
  if (type === 'percentage') {
    return amount * (value / 100)
  }
  return Math.min(value, amount) // Cap at amount for fixed discount
}

export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

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

    const [invoices, total] = await Promise.all([
      prisma.invoices.findMany({
        where,
        include: { invoice_items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoices.count({ where }),
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
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting check (per user)
    const rateLimit = await checkRateLimit(`invoice:create:${session.id}`, apiRateLimit)

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
    const subscription = await prisma.subscriptions.findUnique({
      where: { userId: session.id },
    })

    if (subscription?.planType === 'FREE') {
      const invoiceCount = await prisma.invoices.count({
        where: {
          userId: session.id,
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

    const {
      items,
      settings,
      termsAndConditions,
      signatureUrl,
      signatoryName,
      signatoryTitle,
      discountType,
      discountValue,
      additionalDiscountType,
      additionalDiscountValue,
      ...data
    } = validation.data

    // Calculate totals with discount support
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0)

    // Calculate discount amounts
    const discountAmount = calculateDiscount(subtotal, discountType, discountValue)
    const afterFirstDiscount = subtotal - discountAmount
    const additionalDiscountAmount = calculateDiscount(afterFirstDiscount, additionalDiscountType, additionalDiscountValue)
    const taxableAmount = afterFirstDiscount - additionalDiscountAmount
    const taxAmount = taxableAmount * (data.taxRate / 100)
    const total = taxableAmount + taxAmount

    // Generate invoice number if not provided
    const invoiceNumber = data.invoiceNumber || generateInvoiceNumber()

    // Check if invoice number already exists
    const existingInvoice = await prisma.invoices.findUnique({
      where: { invoiceNumber },
    })

    if (existingInvoice) {
      return NextResponse.json(
        { error: 'Nomor invoice sudah digunakan' },
        { status: 400 }
      )
    }

    const invoice = await prisma.invoices.create({
      data: {
        id: crypto.randomUUID(),
        ...data,
        invoiceNumber,
        accessToken: crypto.randomUUID(), // Generate access token for public viewing
        userId: session.id,
        date: new Date(data.date),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        subtotal,
        taxAmount,
        total,
        status: data.status || 'DRAFT',
        updatedAt: new Date(),
        // New fields - only include if provided
        ...(settings && { settings: JSON.parse(JSON.stringify(settings)) }),
        ...(termsAndConditions && { termsAndConditions }),
        ...(signatureUrl && { signatureUrl }),
        ...(signatoryName && { signatoryName }),
        ...(signatoryTitle && { signatoryTitle }),
        ...(discountType && { discountType }),
        ...(discountValue !== undefined && discountValue !== null && { discountValue }),
        ...(discountAmount && { discountAmount }),
        ...(additionalDiscountType && { additionalDiscountType }),
        ...(additionalDiscountValue !== undefined && additionalDiscountValue !== null && { additionalDiscountValue }),
        ...(additionalDiscountAmount && { additionalDiscountAmount }),
        invoice_items: {
          create: items.map((item) => ({
            id: crypto.randomUUID(),
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            taxRate: data.taxRate || 11,
            subtotal: item.quantity * item.price,
          })),
        },
      },
      include: { invoice_items: true },
    })

    // Log activity
    await logInvoiceCreated(session.id, invoiceNumber, total)

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
