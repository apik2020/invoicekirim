import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createReceipt } from '@/lib/receipt-generator'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Get receipt info
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payment = await prisma.payment.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (!payment.receiptNumber) {
      // Generate receipt if it doesn't exist
      const updatedPayment = await createReceipt(params.id)
      return NextResponse.json({
        receiptNumber: updatedPayment.receiptNumber,
        receiptUrl: updatedPayment.receiptUrl,
        downloadUrl: `/api/payments/${params.id}/receipt/download`,
      })
    }

    return NextResponse.json({
      receiptNumber: payment.receiptNumber,
      receiptUrl: payment.receiptUrl,
      downloadUrl: `/api/payments/${params.id}/receipt/download`,
    })
  } catch (error) {
    console.error('Error fetching receipt:', error)
    return NextResponse.json(
      { error: 'Failed to fetch receipt' },
      { status: 500 }
    )
  }
}

// Generate/download receipt PDF
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payment = await prisma.payment.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Generate or update receipt
    const updatedPayment = await createReceipt(params.id)

    return NextResponse.json({
      message: 'Receipt generated successfully',
      receiptNumber: updatedPayment.receiptNumber,
      receiptUrl: updatedPayment.receiptUrl,
    })
  } catch (error) {
    console.error('Error generating receipt:', error)
    return NextResponse.json(
      { error: 'Failed to generate receipt' },
      { status: 500 }
    )
  }
}
