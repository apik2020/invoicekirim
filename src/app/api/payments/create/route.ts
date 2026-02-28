import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  createTransaction,
  createVAPayment,
  createQRISPayment,
  VABankCode,
} from '@/lib/midtrans'

// Subscription pricing
const PRICING = {
  PRO_MONTHLY: 49000,
  PRO_YEARLY: 490000, // ~17% discount
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { paymentMethod, bankCode, planType, billingCycle } = body

    // Validate payment method
    const validMethods = ['VA', 'QRIS', 'SNAP']
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Metode pembayaran tidak valid' },
        { status: 400 }
      )
    }

    // Calculate amount
    const amount =
      billingCycle === 'yearly' ? PRICING.PRO_YEARLY : PRICING.PRO_MONTHLY

    // Generate order ID
    const orderId = `IK-${Date.now()}-${session.user.id.slice(-6)}`

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // Create pending payment record
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        midtransOrderId: orderId,
        amount,
        currency: 'IDR',
        description: `InvoiceKirim Pro - ${billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan'}`,
        status: 'PENDING',
        paymentMethod,
        paymentGateway: 'MIDTRANS',
      },
    })

    const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create transaction based on payment method
    if (paymentMethod === 'VA' && bankCode) {
      const vaResult = await createVAPayment(bankCode as VABankCode, {
        orderId,
        amount,
        customerName: user.name || 'Customer',
        customerEmail: user.email,
        description: `InvoiceKirim Pro ${billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan'}`,
      })

      // Update payment with VA details
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          vaNumber: vaResult.vaNumber,
          vaBank: vaResult.bank,
          expiredAt: vaResult.expiredAt,
        },
      })

      return NextResponse.json({
        success: true,
        payment: {
          id: payment.id,
          orderId,
          amount,
          method: 'VA',
          vaNumber: vaResult.vaNumber,
          bank: vaResult.bank,
          expiredAt: vaResult.expiredAt,
        },
      })
    }

    if (paymentMethod === 'QRIS') {
      const qrisResult = await createQRISPayment({
        orderId,
        amount,
        customerName: user.name || 'Customer',
        customerEmail: user.email,
        description: `InvoiceKirim Pro ${billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan'}`,
      })

      // Update payment with QRIS details
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          qrisUrl: qrisResult.qrImageUrl,
          expiredAt: qrisResult.expiredAt,
        },
      })

      return NextResponse.json({
        success: true,
        payment: {
          id: payment.id,
          orderId,
          amount,
          method: 'QRIS',
          qrImageUrl: qrisResult.qrImageUrl,
          expiredAt: qrisResult.expiredAt,
        },
      })
    }

    // Default: Snap (all payment methods)
    const snapResult = await createTransaction({
      orderId,
      amount,
      customerName: user.name || 'Customer',
      customerEmail: user.email,
      description: `InvoiceKirim Pro ${billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan'}`,
    })

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        orderId,
        amount,
        method: 'SNAP',
        snapToken: snapResult.token,
        snapUrl: snapResult.redirectUrl,
        expiredAt: expiryDate,
      },
    })
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Gagal membuat transaksi pembayaran' },
      { status: 500 }
    )
  }
}
