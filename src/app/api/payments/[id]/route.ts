import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get a single payment by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const payment = await prisma.payment.findUnique({
      where: { id },
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Pembayaran tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if user owns this payment
    if (payment.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Tidak memiliki akses ke pembayaran ini' },
        { status: 403 }
      )
    }

    return NextResponse.json({ payment })
  } catch (error) {
    console.error('Error fetching payment:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data pembayaran' },
      { status: 500 }
    )
  }
}

// PATCH - Update a payment
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const payment = await prisma.payment.findUnique({
      where: { id },
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Pembayaran tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if user owns this payment
    if (payment.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Tidak memiliki akses ke pembayaran ini' },
        { status: 403 }
      )
    }

    const { status, description, receiptUrl, receiptNumber } = body

    const updateData: any = {}
    if (status) updateData.status = status.toUpperCase()
    if (description !== undefined) updateData.description = description
    if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl
    if (receiptNumber !== undefined) updateData.receiptNumber = receiptNumber

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
    })
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json(
      { error: 'Gagal mengupdate pembayaran' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a payment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const payment = await prisma.payment.findUnique({
      where: { id },
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Pembayaran tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if user owns this payment
    if (payment.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Tidak memiliki akses ke pembayaran ini' },
        { status: 403 }
      )
    }

    await prisma.payment.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Pembayaran berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus pembayaran' },
      { status: 500 }
    )
  }
}
