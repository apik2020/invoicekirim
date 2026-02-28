import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { CACHE_DURATIONS } from '@/lib/cache'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = CACHE_DURATIONS.SHORT

// GET /api/admin/payments - List all payments with filters
export async function GET(req: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdmin()
    if (admin instanceof NextResponse) {
      return admin
    }

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status')
    const userId = url.searchParams.get('userId')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const sortBy = url.searchParams.get('sortBy') || 'createdAt'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { receiptNumber: { contains: search, mode: 'insensitive' } },
        { stripePaymentIntentId: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (userId) {
      where.userId = userId
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    // Get payments with user and subscription info
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ])

    // Calculate summary statistics
    const [totalRevenue, completedCount, pendingCount] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.payment.count({ where: { status: 'COMPLETED' } }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
    ])

    return NextResponse.json({
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalRevenue: totalRevenue._sum.amount || 0,
        completedCount,
        pendingCount,
      },
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

// POST /api/admin/payments - Manual payment creation (for admin)
export async function POST(req: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdmin()
    if (admin instanceof NextResponse) {
      return admin
    }

    const body = await req.json()
    const { userId, amount, currency, description, status, stripePaymentIntentId } = body

    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'userId and amount are required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Generate receipt number if completed
    let receiptNumber = null
    if (status === 'COMPLETED') {
      const { generateReceiptNumber } = await import('@/lib/receipt-generator')
      receiptNumber = await generateReceiptNumber()
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        currency: currency || 'IDR',
        description: description || 'Manual payment by admin',
        status: status || 'PENDING',
        stripePaymentIntentId,
        receiptNumber,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: admin.id, // Admin who created it
        action: 'MANUAL_PAYMENT_CREATED',
        entityType: 'PAYMENT',
        entityId: payment.id,
        details: `Admin created manual payment of ${amount} ${currency || 'IDR'} for user ${user.email}`,
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}
