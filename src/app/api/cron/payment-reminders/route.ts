import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPaymentReminder, sendInvoiceOverdue } from '@/lib/email'
import { differenceInDays, addDays } from 'date-fns'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Cron job endpoint for sending payment reminders
 *
 * This endpoint should be called by Vercel Cron Jobs or similar scheduler
 * Recommended schedule: Daily at 9:00 AM
 *
 * Vercel Cron configuration in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/payment-reminders",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization')
    const cronSecret = req.headers.get('x-cron-secret')

    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const results = {
      remindersSent: 0,
      overdueNoticesSent: 0,
      errors: [] as Array<{ invoice: string; error: string }>,
    }

    // 1. Find invoices due in 3 days (for reminder)
    const threeDaysFromNow = addDays(today, 3)

    const invoicesDueSoon = await prisma.invoice.findMany({
      where: {
        status: { in: ['SENT', 'OVERDUE'] },
        dueDate: {
          gte: today,
          lte: threeDaysFromNow,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            companyName: true,
            companyEmail: true,
          },
        },
      },
    })

    // 2. Find overdue invoices
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['SENT', 'OVERDUE'] },
        dueDate: {
          lt: today,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            companyName: true,
            companyEmail: true,
          },
        },
      },
    })

    // Process payment reminders
    for (const invoice of invoicesDueSoon) {
      try {
        if (!invoice.dueDate) continue
        const daysUntilDue = differenceInDays(new Date(invoice.dueDate), today)

        // Only send if due in 3 days or less (avoid duplicate on the same day)
        if (daysUntilDue <= 0) continue

        // Check if we already sent a reminder today
        const existingReminder = await prisma.activityLog.findFirst({
          where: {
            userId: invoice.userId,
            entityType: 'INVOICE',
            entityId: invoice.id,
            action: 'REMINDER_SENT',
            createdAt: {
              gte: today,
            },
          },
        })

        if (existingReminder) continue

        // Send reminder email
        const invoiceUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.accessToken}`

        await sendPaymentReminder({
          to: invoice.clientEmail,
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.clientName,
          companyName: invoice.user.companyName || invoice.user.name || 'InvoiceKirim',
          total: formatCurrency(invoice.total),
          dueDate: formatDate(invoice.dueDate),
          daysUntilDue,
          invoiceUrl,
        })

        // Log the reminder
        await prisma.activityLog.create({
          data: {
            userId: invoice.userId,
            action: 'REMINDER_SENT',
            entityType: 'INVOICE',
            entityId: invoice.id,
            title: 'Payment Reminder Sent',
            description: `Payment reminder sent for invoice ${invoice.invoiceNumber}`,
          },
        })

        results.remindersSent++
      } catch (error) {
        console.error(`Error sending reminder for invoice ${invoice.invoiceNumber}:`, error)
        results.errors.push({
          invoice: invoice.invoiceNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Process overdue notices
    for (const invoice of overdueInvoices) {
      try {
        if (!invoice.dueDate) continue
        const daysOverdue = Math.abs(differenceInDays(today, new Date(invoice.dueDate)))

        // Update invoice status to OVERDUE if not already
        if (invoice.status !== 'OVERDUE') {
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { status: 'OVERDUE' },
          })
        }

        // Check if we already sent an overdue notice this week
        const weekAgo = addDays(today, -7)
        const existingNotice = await prisma.activityLog.findFirst({
          where: {
            userId: invoice.userId,
            entityType: 'INVOICE',
            entityId: invoice.id,
            action: 'OVERDUE_NOTICE_SENT',
            createdAt: {
              gte: weekAgo,
            },
          },
        })

        if (existingNotice) continue

        // Send overdue notice email
        const invoiceUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.accessToken}`

        await sendInvoiceOverdue({
          to: invoice.clientEmail,
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.clientName,
          companyName: invoice.user.companyName || invoice.user.name || 'InvoiceKirim',
          total: formatCurrency(invoice.total),
          dueDate: formatDate(invoice.dueDate),
          daysOverdue,
          invoiceUrl,
        })

        // Log the overdue notice
        await prisma.activityLog.create({
          data: {
            userId: invoice.userId,
            action: 'OVERDUE_NOTICE_SENT',
            entityType: 'INVOICE',
            entityId: invoice.id,
            title: 'Overdue Notice Sent',
            description: `Overdue notice sent for invoice ${invoice.invoiceNumber} (${daysOverdue} days overdue)`,
          },
        })

        results.overdueNoticesSent++
      } catch (error) {
        console.error(`Error sending overdue notice for invoice ${invoice.invoiceNumber}:`, error)
        results.errors.push({
          invoice: invoice.invoiceNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment reminders processed successfully',
      data: results,
    })
  } catch (error) {
    console.error('Error processing payment reminders:', error)
    return NextResponse.json(
      {
        error: 'Failed to process payment reminders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Helper functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}
