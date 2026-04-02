import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

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

    console.log(`[CRON] Starting subscription expiration check at ${now.toISOString()}`)

    // Find expired Pro subscriptions
    const expiredSubscriptions = await prisma.subscriptions.findMany({
      where: {
        planType: 'PRO',
        status: 'ACTIVE',
        stripeCurrentPeriodEnd: {
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

    console.log(`[CRON] Found ${expiredSubscriptions.length} expired PRO subscriptions`)

    for (const subscription of expiredSubscriptions) {
      try {
        // Downgrade to FREE
        await prisma.subscriptions.update({
          where: { id: subscription.id },
          data: {
            status: 'FREE',
            planType: 'FREE',
            stripeSubscriptionId: null,
            stripePriceId: null,
            stripeCurrentPeriodEnd: null,
            updatedAt: now,
          },
        })

        // Log the expiration
        await prisma.activity_logs.create({
          data: {
            id: crypto.randomUUID(),
            userId: subscription.userId,
            action: 'UPDATED',
            entityType: 'Subscription',
            entityId: subscription.id,
            title: 'Langganan PRO Berakhir',
            description: 'Langganan PRO telah berakhir dan diturunkan ke FREE',
            metadata: {
              previousPeriodEnd: subscription.stripeCurrentPeriodEnd?.toISOString(),
              downgradedAt: now.toISOString(),
            },
          },
        })

        // Send expiration email
        if (resend && subscription.users.email) {
          try {
            await resend.emails.send({
              from: 'NotaBener <notifications@notabener.com>',
              to: subscription.users.email,
              subject: 'Langganan PRO Anda Telah Berakhir',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333;">Langganan PRO Anda Telah Berakhir</h2>
                  <p>Hai ${subscription.users.name || 'Pengguna'},</p>
                  <p>Langganan PRO NotaBener Anda telah berakhir pada ${now.toLocaleDateString('id-ID')}.</p>
                  <p>Akun Anda telah diturunkan ke paket FREE. Anda masih dapat mengakses fitur dasar dengan batasan:</p>
                  <ul>
                    <li>Maksimal 10 invoice per bulan</li>
                    <li>Fungsi dasar pembuatan invoice</li>
                  </ul>
                  <p>Untuk melanjutkan akses PRO tanpa batasan, Anda dapat upgrade kembali kapan saja.</p>
                  <div style="margin: 30px 0;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing"
                       style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                      Upgrade Kembali ke PRO
                    </a>
                  </div>
                  <p>Terima kasih telah menggunakan NotaBener!</p>
                  <p style="color: #666; font-size: 12px;">Email ini dikirim otomatis, jangan balas email ini.</p>
                </div>
              `,
            })
          } catch (emailError) {
            console.error(`[CRON] Failed to send expiration email to ${subscription.users.email}:`, emailError)
          }
        }

        processedCount++
        console.log(`[CRON] Downgraded subscription ${subscription.id} for user ${subscription.userId}`)
      } catch (error) {
        errorCount++
        console.error(`[CRON] Failed to process subscription ${subscription.id}:`, error)
      }
    }

    console.log(`[CRON] Completed: ${processedCount} processed, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      processed: processedCount,
      errors: errorCount,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('[CRON] Subscription expiration error:', error)
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
