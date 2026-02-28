import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createReceipt } from '@/lib/receipt-generator'

// GET - List all payments for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      userId: session.user.id,
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.payment.count({ where }),
    ])

    return NextResponse.json({
      payments,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data pembayaran' },
      { status: 500 }
    )
  }
}

// POST - Create a new payment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      stripePaymentId,
      stripePaymentIntentId,
      amount,
      currency = 'IDR',
      description,
      invoiceId,
      generateReceipt = true,
    } = body

    // Validate required fields
    if (!stripePaymentId || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'stripePaymentId dan amount harus diisi' },
        { status: 400 }
      )
    }

    // Check if payment with this stripePaymentId already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { stripePaymentId },
    })

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Pembayaran dengan stripePaymentId ini sudah ada' },
        { status: 400 }
      )
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        stripePaymentId,
        stripePaymentIntentId: stripePaymentIntentId || null,
        invoiceId: invoiceId || null,
        amount: parseFloat(amount.toString()),
        currency: currency.toUpperCase(),
        description: description || null,
        status: 'COMPLETED',
      },
    })

    // Generate receipt if requested
    if (generateReceipt) {
      try {
        await createReceipt(payment.id)
      } catch (receiptError) {
        console.error('Failed to generate receipt:', receiptError)
        // Don't fail the payment creation if receipt generation fails
      }
    }

    return NextResponse.json({
      success: true,
      payment,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Gagal membuat pembayaran' },
      { status: 500 }
    )
  }
}
