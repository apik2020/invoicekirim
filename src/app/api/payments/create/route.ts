import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  createDuitkuPayment,
  getDuitkuPaymentStatus,
  generateDuitkuOrderId,
  mapBankCodeToDuitku,
  DUITKU_VA_BANKS,
  DUITKU_QRIS,
  type DuitkuVABankCode,
} from '@/lib/duitku'
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
    const validMethods = ['VA', 'QRIS']
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Metode pembayaran tidak valid' },
        { status: 400 }
      )
    }

    // Calculate amount - use pricing plan price
    const amount = pricingPlan.price

    // Generate Duitku order ID
    const orderId = generateDuitkuOrderId(session.id)

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
        dokuOrderId: orderId, // Keep field name for compatibility
        amount,
        currency: pricingPlan.currency,
        description: `NotaBener ${pricingPlan.name}`,
        status: 'PENDING',
        paymentMethod,
        paymentGateway: 'Duitku',
        pricingPlanId, // Link to pricing plan for webhook processing
        updatedAt: new Date(),
      },
    })

    // Create transaction based on payment method
    if (paymentMethod === 'VA' && bankCode) {
      // Map UI bank code to Duitku API bank code
      const duitkuBankCode = mapBankCodeToDuitku(bankCode)
      console.log('[Payment] Creating VA payment with bank:', bankCode, '-> Duitku code:', duitkuBankCode)

      let vaResult
      try {
        vaResult = await createDuitkuPayment({
          orderId,
          amount,
          customerName: user.name || 'Customer',
          customerEmail: user.email,
          description: `NotaBener ${pricingPlan.name} - ${pricingPlan.name}`,
          paymentMethod: duitkuBankCode,
        })
        console.log('[Payment] VA payment created successfully:', vaResult)
      } catch (duitkuError) {
        console.error('[Payment] Duitku VA payment failed:', duitkuError)
        console.error('[Payment] Duitku error type:', typeof duitkuError)
        console.error('[Payment] Duitku error message:', (duitkuError as any).message)
        console.error('[Payment] Duitku error stringified:', JSON.stringify(duitkuError))
        throw duitkuError
      }

      // Update payment with VA details
      await prisma.payments.update({
        where: { id: payment.id },
        data: {
          dokuOrderId: orderId,
          vaNumber: vaResult.vaNumber,
          vaBank: vaResult.bank,
          expiredAt: vaResult.expiryDate,
          paymentUrl: vaResult.paymentUrl,
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
          paymentUrl: vaResult.paymentUrl,
          expiredAt: vaResult.expiryDate,
        },
      })
    }

    if (paymentMethod === 'QRIS') {
      // Don't specify paymentMethod — let Duitku show all methods including QRIS
      const qrisResult = await createDuitkuPayment({
        orderId,
        amount,
        customerName: user.name || 'Customer',
        customerEmail: user.email,
        description: `NotaBener ${pricingPlan.name} - ${pricingPlan.name}`,
        // No paymentMethod specified — user picks QRIS on Duitku's hosted page
      })

      // Update payment with details
      await prisma.payments.update({
        where: { id: payment.id },
        data: {
          dokuOrderId: orderId,
          qrisUrl: qrisResult.qrImageUrl,
          qrString: qrisResult.qrString,
          expiredAt: qrisResult.expiryDate,
          paymentUrl: qrisResult.paymentUrl,
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
          qrString: qrisResult.qrString,
          paymentUrl: qrisResult.paymentUrl,
          expiredAt: qrisResult.expiryDate,
        },
      })
    }

    // If we reach here, payment method is not supported
    return NextResponse.json(
      { error: 'Metode pembayaran tidak didukung' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Payment creation error:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))

    // Extract error message safely
    let errorMessage = 'Gagal membuat transaksi pembayaran'
    if (error) {
      if (typeof error === 'string') {
        errorMessage = error
      } else if (error instanceof Error) {
        errorMessage = error.message
      } else if ((error as any).message) {
        errorMessage = (error as any).message
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? JSON.stringify(error, null, 2) : undefined
      },
      { status: 500 }
    )
  }
}

// GET endpoint to get available VA banks
export async function GET() {
  return NextResponse.json({
    vaBanks: DUITKU_VA_BANKS,
    qris: DUITKU_QRIS,
    paymentMethods: [
      { value: 'VA', label: 'Virtual Account', description: 'Transfer bank BCA, Mandiri, BNI, BRI, CIMB, Permata, Danamon, Digibank' },
      { value: 'QRIS', label: 'QRIS', description: 'QRIS payment via GoPay, ShopeePay, Dana, LinkAja' },
    ],
  })
}
