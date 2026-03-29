import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  createTransaction,
  createVAPayment,
  createQRISPayment,
  VABankCode,
} from '@/lib/midtrans'
import { validateUpgradeRequest } from '@/lib/subscription-upgrade'

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { paymentMethod, bankCode, pricingPlanId, planSlug } = body

    // Validate required fields
    if (!pricingPlanId || !planSlug) {
      return NextResponse.json(
        { error: 'Paket tidak valid' },
        { status: 400 }
      )
    }

    // Get pricing plan details
    const pricingPlan = await prisma.pricing_plans.findUnique({
      where: { id: pricingPlanId },
      select: {
        id: true,
        slug: true,
        name: true,
        price: true,
        currency: true,
        trialDays: true,
      },
    })

    if (!pricingPlan) {
      return NextResponse.json({ error: 'Paket tidak ditemukan' }, { status: 404 })
    }

    // Verify plan slug matches
    if (pricingPlan.slug !== planSlug) {
      return NextResponse.json({ error: 'Paket tidak cocok' }, { status: 400 })
    }

    // Validate upgrade eligibility
    const validation = await validateUpgradeRequest(session.id, planSlug)
    if (!validation.allowed) {
      // Log failed attempt
      await prisma.activity_logs.create({
        data: {
          id: crypto.randomUUID(),
          userId: session.id,
          action: 'CREATED',
          entityType: 'Checkout',
          entityId: pricingPlanId,
          title: 'Checkout Ditolak - Upgrade Tidak Valid',
          description: validation.reason || 'Upgrade tidak diizinkan',
          metadata: {
            targetPlanSlug: planSlug,
            pricingPlanId,
            attemptedAt: new Date().toISOString(),
          },
        },
      })

      return NextResponse.json(
        { error: validation.reason || 'Upgrade tidak diizinkan' },
        { status: 400 }
      )
    }

    // Validate payment method
    const validMethods = ['VA', 'QRIS', 'SNAP']
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Metode pembayaran tidak valid' },
        { status: 400 }
      )
    }

    // Calculate amount - use pricing plan price
    const amount = pricingPlan.price

    // Generate order ID
    const orderId = `IK-${Date.now()}-${session.id.slice(-6)}`

    // Get user info
    const user = await prisma.users.findUnique({
      where: { id: session.id },
      select: { name: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // Create pending payment record with pricing plan link
    const payment = await prisma.payments.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.id,
        midtransOrderId: orderId,
        amount,
        currency: pricingPlan.currency,
        description: `InvoiceKirim ${pricingPlan.name}`,
        status: 'PENDING',
        paymentMethod,
        paymentGateway: 'MIDTRANS',
        pricingPlanId, // Link to pricing plan for webhook processing
        updatedAt: new Date(),
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
        description: `InvoiceKirim ${pricingPlan.name}`,
      })

      // Update payment with VA details
      await prisma.payments.update({
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
        description: `InvoiceKirim ${pricingPlan.name}`,
      })

      // Update payment with QRIS details
      await prisma.payments.update({
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
      description: `InvoiceKirim ${pricingPlan.name}`,
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
