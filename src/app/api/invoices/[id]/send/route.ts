import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkFeatureAccess, trackEmailSend } from '@/lib/feature-access'
import { logInvoiceSent } from '@/lib/activity-log'
import { sendInvoiceSent } from '@/lib/email'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// POST - Send invoice via email
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession()
    const { id } = await params

    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 🔒 FEATURE ACCESS CHECK: Email Send
    const emailAccess = await checkFeatureAccess(session.id, 'EMAIL_SEND')

    if (!emailAccess.allowed) {
      return NextResponse.json(
        {
          error: 'FEATURE_LOCKED',
          message: getEmailLockedMessage(emailAccess.reason, emailAccess.limit, emailAccess.currentUsage),
          upgradeUrl: emailAccess.upgradeUrl || '/checkout',
          planRequired: emailAccess.planName,
        },
        { status: 403 }
      )
    }

    // Fetch invoice with items
    const invoice = await prisma.invoices.findFirst({
      where: {
        id,
        userId: session.id,
      },
      include: {
        invoice_items: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Check user SMTP settings
    const user = await prisma.users.findUnique({
      where: { id: session.id },
      select: {
        smtpHost: true,
        smtpPort: true,
        smtpSecure: true,
        smtpUser: true,
        smtpPass: true,
      },
    })

    if (!user?.smtpHost || !user?.smtpUser || !user?.smtpPass) {
      return NextResponse.json(
        { error: 'Pengaturan email belum dikonfigurasi. Silakan atur di Pengaturan > Pengaturan Email' },
        { status: 400 }
      )
    }

    // Generate invoice URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const invoiceUrl = `${baseUrl}/invoice/${invoice.accessToken}`

    // Send email — if this fails, status stays DRAFT and user gets clear error
    let emailSent = false
    let emailError: string | null = null
    try {
      await sendInvoiceSent({
        to: invoice.clientEmail,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        companyName: invoice.companyName,
        total: formatCurrency(invoice.total),
        dueDate: invoice.dueDate
          ? new Date(invoice.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
          : '-',
        invoiceUrl,
        userId: session.id,
        teamId: invoice.teamId ?? undefined,
      })
      emailSent = true
    } catch (err) {
      console.error('Send invoice email error:', err)
      emailError = err instanceof Error ? err.message : 'Email gagal terkirim'
    }

    // Only update status to SENT if email actually sent successfully
    if (emailSent) {
      await prisma.invoices.update({
        where: { id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      })

      // Log activity
      await logInvoiceSent(session.id, invoice.invoiceNumber, invoice.clientEmail)

      // Track email usage
      await trackEmailSend(session.id)

      return NextResponse.json({
        success: true,
        message: 'Invoice berhasil dikirim ke ' + invoice.clientEmail
      })
    } else {
      // Email failed — keep status as DRAFT, return error to user
      return NextResponse.json(
        {
          error: 'GAGAL_KIRIM',
          message: `Email gagal dikirim: ${emailError}. Invoice tetap dalam status DRAFT. Silakan coba lagi.`,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Send invoice error:', error)
    return NextResponse.json(
      { error: 'Failed to send invoice' },
      { status: 500 }
    )
  }
}

/**
 * Get user-friendly message for locked email feature
 */
function getEmailLockedMessage(
  reason?: string,
  limit?: number | null,
  currentUsage?: number
): string {
  switch (reason) {
    case 'trial_expired':
      return 'Masa trial Anda telah berakhir. Upgrade ke Pro untuk melanjutkan pengiriman invoice.'
    case 'usage_exceeded':
      if (limit !== null && currentUsage !== undefined) {
        return `Anda telah mencapai batas pengiriman bulanan (${currentUsage}/${limit}). Upgrade ke Pro untuk kiriman tanpa batas.`
      }
      return 'Anda telah mencapai batas pengiriman bulanan. Upgrade ke Pro untuk melanjutkan.'
    case 'feature_locked':
      return 'Fitur kirim invoice via email hanya tersedia untuk pengguna Pro. Upgrade sekarang.'
    default:
      return 'Kirim invoice tersedia dalam paket Pro. Upgrade untuk membuka fitur ini.'
  }
}

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}
