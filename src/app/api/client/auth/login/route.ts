import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sendSystemEmail } from '@/lib/email'

// Request magic link for client login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find or create client account
    let client = await prisma.client_accounts.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Check if client has any invoices (via client_email in invoices table)
    const hasInvoices = await prisma.invoices.findFirst({
      where: { clientEmail: email.toLowerCase() },
    })

    if (!hasInvoices) {
      return NextResponse.json(
        { error: 'No invoices found for this email address' },
        { status: 404 }
      )
    }

    // Create client account if doesn't exist
    if (!client) {
      // Get name from the most recent invoice
      const latestInvoice = await prisma.invoices.findFirst({
        where: { clientEmail: email.toLowerCase() },
        orderBy: { createdAt: 'desc' },
        select: { clientName: true, clientPhone: true },
      })

      client = await prisma.client_accounts.create({
        data: {
          email: email.toLowerCase(),
          name: latestInvoice?.clientName || email.split('@')[0],
          phone: latestInvoice?.clientPhone,
        },
      })

      // Create notification preferences
      await prisma.client_notification_preferences.create({
        data: {
          clientId: client.id,
        },
      })

      // Create access tokens for all invoices with this email
      const invoices = await prisma.invoices.findMany({
        where: { clientEmail: email.toLowerCase() },
        select: { id: true, accessToken: true },
      })

      for (const invoice of invoices) {
        await prisma.client_invoice_access.create({
          data: {
            clientId: client.id,
            invoiceId: invoice.id,
            accessToken: invoice.accessToken,
          },
        })
      }
    }

    // Generate magic link token
    const magicLinkToken = randomBytes(32).toString('hex')
    const magicLinkExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Update client with magic link
    await prisma.client_accounts.update({
      where: { id: client.id },
      data: {
        magicLinkToken,
        magicLinkExpires,
      },
    })

    // Send magic link email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
    const magicLinkUrl = `${baseUrl}/client/auth/verify?token=${magicLinkToken}`

    await sendSystemEmail({
      to: client.email,
      subject: 'Login ke Dashboard Client InvoiceKirim',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Login - InvoiceKirim Client</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f7f7f7;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 40px;">
                <div style="width: 60px; height: 60px; background: linear-gradient(145deg, #276874, #2d7d8a); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-weight: bold; font-size: 16px;">[iK]</span>
                </div>
                <h1 style="color: #276874; font-size: 24px; font-weight: bold; margin: 0;">InvoiceKirim</h1>
                <p style="color: #64748b; margin: 8px 0 0;">Client Portal</p>
              </div>

              <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #276874; font-size: 24px; font-weight: bold; margin: 0 0 20px;">
                  Login ke Dashboard
                </h2>
                <p style="color: #334155; line-height: 1.6; margin: 0 0 30px;">
                  Halo ${client.name},
                </p>
                <p style="color: #334155; line-height: 1.6; margin: 0 0 30px;">
                  Klik tombol di bawah untuk login ke dashboard client Anda dan melihat semua invoice, notifikasi, dan pesan:
                </p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${magicLinkUrl}" style="display: inline-block; background: linear-gradient(145deg, #EF3F0A, #d63509); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                    Login ke Dashboard
                  </a>
                </div>

                <div style="background: #fff7ed; border: 2px solid #fed7aa; border-radius: 12px; padding: 20px; margin: 30px 0;">
                  <p style="color: #9a3412; font-size: 14px; margin: 0;">
                    <strong>Link ini akan kadaluarsa dalam 1 jam.</strong> Jika Anda tidak meminta login, Anda bisa mengabaikan email ini.
                  </p>
                </div>

                <p style="color: #64748b; font-size: 14px; margin: 20px 0 0;">
                  Jika tombol di atas tidak berfungsi, salin dan tempel link berikut ke browser Anda:
                </p>
                <p style="color: #276874; font-size: 12px; word-break: break-all; margin: 10px 0 0;">
                  ${magicLinkUrl}
                </p>
              </div>

              <div style="text-align: center; margin-top: 40px; color: #94a3b8; font-size: 14px;">
                <p style="margin: 0 0 8px;">InvoiceKirim - Platform Invoice untuk Freelancer</p>
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} InvoiceKirim. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    return NextResponse.json({
      success: true,
      message: 'Magic link has been sent to your email',
    })
  } catch (error) {
    console.error('Client login error:', error)
    return NextResponse.json(
      { error: 'Failed to send magic link' },
      { status: 500 }
    )
  }
}
