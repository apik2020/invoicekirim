import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (!secret) {
    console.warn('[CRON] No CRON_SECRET set, skipping verification')
    return true // Allow in development if no secret set
  }

  return authHeader === `Bearer ${secret}`
}

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    if (!verifyCronSecret(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    let processedCount = 0
    let errorCount = 0

    console.log(`[CRON] Starting payment expiration check at ${now.toISOString()}`)

    // Find expired pending payments
    const expiredPayments = await prisma.payments.findMany({
      where: {
        status: 'PENDING',
        expiredAt: {
          lt: now,
        },
      },
      include: {
        users: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    })

    console.log(`[CRON] Found ${expiredPayments.length} expired pending payments`)

    for (const payment of expiredPayments) {
      try {
        // Update payment status to EXPIRED
        await prisma.payments.update({
          where: { id: payment.id },
          data: {
            status: 'EXPIRED',
            updatedAt: now,
          },
        })

        // Log the expiration
        await prisma.activity_logs.create({
          data: {
            id: crypto.randomUUID(),
            userId: payment.userId,
            action: 'UPDATED',
            entityType: 'Payment',
            entityId: payment.id,
            title: 'Pembayaran Kedaluwarsa',
            description: `Pembayaran ${payment.dokuOrderId || payment.id} telah kedaluwarsa`,
            metadata: {
              paymentId: payment.id,
              dokuOrderId: payment.dokuOrderId,
              amount: payment.amount,
              currency: payment.currency,
              paymentMethod: payment.paymentMethod,
              expiredAt: payment.expiredAt?.toISOString(),
              markedExpiredAt: now.toISOString(),
            },
          },
        })

        processedCount++
        console.log(`[CRON] Expired payment ${payment.id} for user ${payment.userId}`)
      } catch (error) {
        errorCount++
        console.error(`[CRON] Failed to expire payment ${payment.id}:`, error)
      }
    }

    console.log(`[CRON] Completed: ${processedCount} expired, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      expired: processedCount,
      errors: errorCount,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('[CRON] Payment expiration error:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Support GET for testing (with verification)
export async function GET(req: NextRequest) {
  return POST(req)
}
