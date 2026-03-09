// Initialize Resend (conditionally imported to avoid build errors)
let resend: any = null

try {
  if (process.env.RESEND_API_KEY) {
    const Resend = require('resend')
    resend = new Resend(process.env.RESEND_API_KEY)
  }
} catch (error) {
  // Resend package not installed, will use dev mode
}

// Import nodemailer for SMTP
import nodemailer from 'nodemailer'
import { prisma } from './prisma'

/**
 * Send email via SMTP using user's settings
 */
async function sendViaSMTP(
  to: string | string[],
  subject: string,
  html: string,
  userId: string
): Promise<{ success: boolean; error?: any }> {
  try {
    // Get user's SMTP settings
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        smtpHost: true,
        smtpPort: true,
        smtpSecure: true,
        smtpUser: true,
        smtpPass: true,
      },
    })

    if (!user?.smtpHost || !user?.smtpUser || !user?.smtpPass) {
      return { success: false, error: 'SMTP not configured' }
    }

    const transporter = nodemailer.createTransport({
      host: user.smtpHost,
      port: parseInt(user.smtpPort || '587'),
      secure: user.smtpSecure === true,
      auth: {
        user: user.smtpUser,
        pass: user.smtpPass,
      },
    })

    await transporter.sendMail({
      from: user.smtpUser,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
    })

    return { success: true }
  } catch (error) {
    console.error('SMTP send error:', error)
    return { success: false, error }
  }
}

// Email templates with new InvoiceKirim theme
// Brand/Deep Teal: #276874
// Primary/Bright Orange: #EF3F0A
// Success/Lime Green: #C5E151
export const emailTemplates = {
  invoiceSent: (data: {
    invoiceNumber: string
    clientName: string
    companyName: string
    total: string
    dueDate: string
    invoiceUrl: string
  }) => ({
    subject: `Invoice ${data.invoiceNumber} dari ${data.companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice ${data.invoiceNumber}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f7f7f7;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(145deg, #276874, #2d7d8a); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-weight: bold; font-size: 16px;">[iK]</span>
              </div>
              <h1 style="color: #276874; font-size: 24px; font-weight: bold; margin: 0;">InvoiceKirim</h1>
              <p style="color: #64748b; margin: 8px 0 0;">Platform Invoice untuk Freelancer</p>
            </div>

            <!-- Main Card -->
            <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #276874; font-size: 28px; font-weight: bold; margin: 0 0 10px;">
                Invoice ${data.invoiceNumber}
              </h2>
              <p style="color: #64748b; margin: 0 0 30px;">
                Halo ${data.clientName},
              </p>
              <p style="color: #334155; line-height: 1.6; margin: 0 0 20px;">
                ${data.companyName} telah mengirimkan invoice baru untuk Anda. Berikut adalah detail invoice:
              </p>

              <!-- Invoice Details -->
              <div style="background: #f7f7f7; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #64748b;">Total Amount</span>
                  <span style="color: #1e293b; font-weight: bold; font-size: 20px;">${data.total}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #64748b;">Jatuh Tempo</span>
                  <span style="color: #276874; font-weight: 600;">${data.dueDate}</span>
                </div>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.invoiceUrl}" style="display: inline-block; background: linear-gradient(145deg, #EF3F0A, #d63509); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Lihat Invoice
                </a>
              </div>

              <p style="color: #64748b; font-size: 14px; margin: 20px 0 0;">
                Silakan review invoice dan lakukan pembayaran sebelum tanggal jatuh tempo.
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 40px; color: #94a3b8; font-size: 14px;">
              <p style="margin: 0 0 8px;">Invoice dibuat dengan InvoiceKirim</p>
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} InvoiceKirim. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  paymentReminder: (data: {
    invoiceNumber: string
    clientName: string
    companyName: string
    total: string
    dueDate: string
    daysUntilDue: number
    invoiceUrl: string
  }) => ({
    subject: `Reminder: Invoice ${data.invoiceNumber} akan jatuh tempo dalam ${data.daysUntilDue} hari`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Reminder - ${data.invoiceNumber}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fff7ed;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(145deg, #EF3F0A, #d63509); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 24px;">⏰</span>
              </div>
              <h1 style="color: #c2410c; font-size: 24px; font-weight: bold; margin: 0;">Payment Reminder</h1>
            </div>

            <!-- Main Card -->
            <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <p style="color: #334155; line-height: 1.6; margin: 0 0 20px;">
                Halo ${data.clientName},
              </p>
              <p style="color: #334155; line-height: 1.6; margin: 0 0 30px;">
                Ini adalah pengingat bahwa <strong>Invoice ${data.invoiceNumber}</strong> dari ${data.companyName} akan jatuh tempo dalam <strong>${data.daysUntilDue} hari</strong> (${data.dueDate}).
              </p>

              <!-- Invoice Details -->
              <div style="background: #fff7ed; border: 2px solid #fed7aa; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #9a3412;">Total Amount</span>
                  <span style="color: #9a3412; font-weight: bold; font-size: 20px;">${data.total}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #9a3412;">Jatuh Tempo</span>
                  <span style="color: #EF3F0A; font-weight: 600;">${data.dueDate}</span>
                </div>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.invoiceUrl}" style="display: inline-block; background: linear-gradient(145deg, #EF3F0A, #d63509); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Bayar Sekarang
                </a>
              </div>

              <p style="color: #64748b; font-size: 14px; margin: 20px 0 0;">
                Silakan lakukan pembayaran sebelum tanggal jatuh tempo untuk menghindari denda keterlambatan.
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 40px; color: #9a3412; font-size: 14px;">
              <p style="margin: 0 0 8px;">Invoice dibuat dengan InvoiceKirim</p>
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} InvoiceKirim. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  invoiceOverdue: (data: {
    invoiceNumber: string
    clientName: string
    companyName: string
    total: string
    dueDate: string
    daysOverdue: number
    invoiceUrl: string
  }) => ({
    subject: `⚠️ PENTING: Invoice ${data.invoiceNumber} sudah jatuh tempo (${data.daysOverdue} hari)`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice Overdue - ${data.invoiceNumber}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fef2f2;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(145deg, #ef4444, #dc2626); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 24px;">⚠️</span>
              </div>
              <h1 style="color: #991b1b; font-size: 24px; font-weight: bold; margin: 0;">Invoice Overdue</h1>
            </div>

            <!-- Main Card -->
            <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <p style="color: #334155; line-height: 1.6; margin: 0 0 20px;">
                Halo ${data.clientName},
              </p>
              <p style="color: #991b1b; line-height: 1.6; margin: 0 0 30px; font-weight: 600;">
                Invoice <strong>${data.invoiceNumber}</strong> dari ${data.companyName} sudah jatuh tempo selama <strong>${data.daysOverdue} hari</strong>. Mohon segera lakukan pembayaran.
              </p>

              <!-- Invoice Details -->
              <div style="background: #fef2f2; border: 2px solid #fca5a5; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #991b1b;">Total Amount</span>
                  <span style="color: #991b1b; font-weight: bold; font-size: 20px;">${data.total}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #991b1b;">Jatuh Tempo</span>
                  <span style="color: #dc2626; font-weight: 600;">${data.dueDate}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid #fecaca;">
                  <span style="color: #991b1b;">Terlambat</span>
                  <span style="color: #dc2626; font-weight: 600;">${data.daysOverdue} hari</span>
                </div>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.invoiceUrl}" style="display: inline-block; background: linear-gradient(145deg, #ef4444, #dc2626); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Bayar Sekarang
                </a>
              </div>

              <p style="color: #64748b; font-size: 14px; margin: 20px 0 0;">
                Jika sudah melakukan pembayaran, harap abaikan email ini.
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 40px; color: #991b1b; font-size: 14px;">
              <p style="margin: 0 0 8px;">Invoice dibuat dengan InvoiceKirim</p>
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} InvoiceKirim. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  invoicePaid: (data: {
    invoiceNumber: string
    clientName: string
    companyName: string
    total: string
    paidDate: string
  }) => ({
    subject: `✅ Pembayaran Invoice ${data.invoiceNumber} berhasil`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Confirmation - ${data.invoiceNumber}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f0fdf4;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(145deg, #C5E151, #a8c945); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 28px;">✓</span>
              </div>
              <h1 style="color: #3f6212; font-size: 24px; font-weight: bold; margin: 0;">Pembayaran Berhasil!</h1>
            </div>

            <!-- Main Card -->
            <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <p style="color: #334155; line-height: 1.6; margin: 0 0 20px;">
                Halo ${data.clientName},
              </p>
              <p style="color: #3f6212; line-height: 1.6; margin: 0 0 30px; font-weight: 600;">
                Terima kasih! Pembayaran untuk <strong>Invoice ${data.invoiceNumber}</strong> dari ${data.companyName} telah berhasil diterima.
              </p>

              <!-- Payment Details -->
              <div style="background: #f0fdf4; border: 2px solid #C5E151; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #3f6212;">Invoice Number</span>
                  <span style="color: #3f6212; font-weight: 600;">${data.invoiceNumber}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #3f6212;">Total Amount</span>
                  <span style="color: #3f6212; font-weight: bold; font-size: 20px;">${data.total}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #3f6212;">Tanggal Bayar</span>
                  <span style="color: #C5E151; font-weight: 600;">${data.paidDate}</span>
                </div>
              </div>

              <p style="color: #64748b; font-size: 14px; margin: 20px 0 0;">
                Bukti pembayaran telah terlampir dalam invoice. Anda bisa mengunduh invoice dari dashboard.
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 40px; color: #3f6212; font-size: 14px;">
              <p style="margin: 0 0 8px;">Invoice dibuat dengan InvoiceKirim</p>
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} InvoiceKirim. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Trial expiration templates
  trialExpired: (data: {
    userName: string
    dashboardUrl: string
  }) => ({
    subject: `Masa Trial InvoiceKirim Telah Berakhir`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Trial Berakhir - InvoiceKirim</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f7f7f7;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(145deg, #276874, #2d7d8a); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-weight: bold; font-size: 16px;">[iK]</span>
              </div>
              <h1 style="color: #276874; font-size: 24px; font-weight: bold; margin: 0;">InvoiceKirim</h1>
              <p style="color: #64748b; margin: 8px 0 0;">Platform Invoice untuk Freelancer</p>
            </div>

            <!-- Main Card -->
            <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #991b1b; font-size: 24px; font-weight: bold; margin: 0 0 20px;">
                Masa Trial Telah Berakhir
              </h2>
              <p style="color: #334155; line-height: 1.6; margin: 0 0 20px;">
                Halo ${data.userName},
              </p>
              <p style="color: #334155; line-height: 1.6; margin: 0 0 20px;">
                Masa trial gratis Anda di InvoiceKirim telah berakhir. Akun Anda telah diturunkan ke <strong>plan FREE</strong>.
              </p>

              <!-- Info Box -->
              <div style="background: #fef2f2; border: 2px solid #fca5a5; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <h3 style="color: #991b1b; font-size: 16px; margin: 0 0 12px;">Fitur yang terbatas di plan FREE:</h3>
                <ul style="color: #64748b; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Maksimal 3 invoice per bulan</li>
                  <li style="margin-bottom: 8px;">Tanpa fitur tim</li>
                  <li style="margin-bottom: 8px;">Tanpa laporan lanjutan</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.dashboardUrl}" style="display: inline-block; background: linear-gradient(145deg, #EF3F0A, #d63509); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Upgrade ke PRO
                </a>
              </div>

              <p style="color: #64748b; font-size: 14px; margin: 20px 0 0;">
                Upgrade ke plan PRO untuk mendapatkan akses penuh ke semua fitur InvoiceKirim.
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 40px; color: #94a3b8; font-size: 14px;">
              <p style="margin: 0 0 8px;">Invoice dibuat dengan InvoiceKirim</p>
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} InvoiceKirim. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  trialExpiringSoon: (data: {
    userName: string
    daysLeft: number
    expiryDate: string
    dashboardUrl: string
  }) => ({
    subject: `⚠️ Trial InvoiceKirim Akan Berakhir dalam ${data.daysLeft} Hari`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Trial Akan Berakhir - InvoiceKirim</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fff7ed;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(145deg, #EF3F0A, #d63509); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 24px;">⏰</span>
              </div>
              <h1 style="color: #c2410c; font-size: 24px; font-weight: bold; margin: 0;">Trial Akan Berakhir</h1>
            </div>

            <!-- Main Card -->
            <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <p style="color: #334155; line-height: 1.6; margin: 0 0 20px;">
                Halo ${data.userName},
              </p>
              <p style="color: #c2410c; line-height: 1.6; margin: 0 0 30px; font-weight: 600;">
                Masa trial gratis Anda akan berakhir dalam <strong>${data.daysLeft} hari</strong> (${data.expiryDate}).
              </p>

              <!-- Warning Box -->
              <div style="background: #fff7ed; border: 2px solid #fed7aa; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <h3 style="color: #9a3412; font-size: 16px; margin: 0 0 12px;">Jangan kehilangan akses ke:</h3>
                <ul style="color: #64748b; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Invoice unlimited</li>
                  <li style="margin-bottom: 8px;">Fitur tim & kolaborasi</li>
                  <li style="margin-bottom: 8px;">Laporan & analitik lanjutan</li>
                  <li style="margin-bottom: 8px;">Integrasi email SMTP</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.dashboardUrl}" style="display: inline-block; background: linear-gradient(145deg, #EF3F0A, #d63509); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Upgrade Sekarang
                </a>
              </div>

              <p style="color: #64748b; font-size: 14px; margin: 20px 0 0;">
                Upgrade sebelum trial berakhir untuk memastikan layanan tidak terganggu.
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 40px; color: #9a3412; font-size: 14px;">
              <p style="margin: 0 0 8px;">Invoice dibuat dengan InvoiceKirim</p>
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} InvoiceKirim. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  trialWarning: (data: {
    userName: string
    daysLeft: number
    expiryDate: string
    dashboardUrl: string
  }) => ({
    subject: `Pengingat: Trial InvoiceKirim Berakhir dalam ${data.daysLeft} Hari`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Trial Reminder - InvoiceKirim</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f7f7f7;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(145deg, #276874, #2d7d8a); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-weight: bold; font-size: 16px;">[iK]</span>
              </div>
              <h1 style="color: #276874; font-size: 24px; font-weight: bold; margin: 0;">InvoiceKirim</h1>
              <p style="color: #64748b; margin: 8px 0 0;">Platform Invoice untuk Freelancer</p>
            </div>

            <!-- Main Card -->
            <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #276874; font-size: 24px; font-weight: bold; margin: 0 0 20px;">
                Pengingat Trial
              </h2>
              <p style="color: #334155; line-height: 1.6; margin: 0 0 20px;">
                Halo ${data.userName},
              </p>
              <p style="color: #334155; line-height: 1.6; margin: 0 0 30px;">
                Masa trial gratis Anda akan berakhir dalam <strong style="color: #276874;">${data.daysLeft} hari</strong> pada tanggal ${data.expiryDate}.
              </p>

              <!-- Info Box -->
              <div style="background: #f0fdf4; border: 2px solid #C5E151; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <h3 style="color: #3f6212; font-size: 16px; margin: 0 0 12px;">Nikmati fitur PRO selama trial:</h3>
                <ul style="color: #64748b; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Unlimited invoices</li>
                  <li style="margin-bottom: 8px;">Team collaboration</li>
                  <li style="margin-bottom: 8px;">Advanced reports</li>
                  <li style="margin-bottom: 8px;">Priority support</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.dashboardUrl}" style="display: inline-block; background: linear-gradient(145deg, #276874, #2d7d8a); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Lihat Plan PRO
                </a>
              </div>

              <p style="color: #64748b; font-size: 14px; margin: 20px 0 0;">
                Pertimbangkan untuk upgrade agar tidak kehilangan fitur premium setelah trial berakhir.
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 40px; color: #94a3b8; font-size: 14px;">
              <p style="margin: 0 0 8px;">Invoice dibuat dengan InvoiceKirim</p>
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} InvoiceKirim. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  teamInvitation: (data: {
    inviterName: string
    teamName: string
    role: string
    acceptUrl: string
    expiresIn: string
  }) => ({
    subject: `Anda Diundang ke Tim ${data.teamName} di InvoiceKirim`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Undangan Tim - InvoiceKirim</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f7f7f7;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(145deg, #276874, #2d7d8a); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-weight: bold; font-size: 16px;">[iK]</span>
              </div>
              <h1 style="color: #276874; font-size: 24px; font-weight: bold; margin: 0;">InvoiceKirim</h1>
              <p style="color: #64748b; margin: 8px 0 0;">Platform Invoice untuk Freelancer</p>
            </div>

            <!-- Main Card -->
            <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #276874; font-size: 24px; font-weight: bold; margin: 0 0 20px;">
                Undangan Tim
              </h2>
              <p style="color: #334155; line-height: 1.6; margin: 0 0 20px;">
                <strong>${data.inviterName}</strong> telah mengundang Anda untuk bergabung dengan tim <strong>"${data.teamName}"</strong> di InvoiceKirim.
              </p>

              <!-- Invitation Details -->
              <div style="background: #f7f7f7; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #64748b;">Tim</span>
                  <span style="color: #1e293b; font-weight: 600;">${data.teamName}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #64748b;">Peran</span>
                  <span style="color: #276874; font-weight: 600;">${data.role}</span>
                </div>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.acceptUrl}" style="display: inline-block; background: linear-gradient(145deg, #EF3F0A, #d63509); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Terima Undangan
                </a>
              </div>

              <p style="color: #64748b; font-size: 14px; margin: 20px 0 0; text-align: center;">
                Undangan ini akan kadaluarsa dalam ${data.expiresIn}.
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 40px; color: #94a3b8; font-size: 14px;">
              <p style="margin: 0 0 8px;">Invoice dibuat dengan InvoiceKirim</p>
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} InvoiceKirim. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  passwordReset: (data: {
    userName: string
    resetUrl: string
    expiresIn: string
  }) => ({
    subject: `Reset Password InvoiceKirim`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Password - InvoiceKirim</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f7f7f7;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(145deg, #276874, #2d7d8a); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-weight: bold; font-size: 16px;">[iK]</span>
              </div>
              <h1 style="color: #276874; font-size: 24px; font-weight: bold; margin: 0;">InvoiceKirim</h1>
              <p style="color: #64748b; margin: 8px 0 0;">Platform Invoice untuk Freelancer</p>
            </div>

            <!-- Main Card -->
            <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #276874; font-size: 24px; font-weight: bold; margin: 0 0 20px;">
                Reset Password
              </h2>
              <p style="color: #334155; line-height: 1.6; margin: 0 0 20px;">
                Halo ${data.userName},
              </p>
              <p style="color: #334155; line-height: 1.6; margin: 0 0 30px;">
                Kami menerima permintaan untuk mengubah password akun Anda. Klik tombol di bawah untuk membuat password baru:
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.resetUrl}" style="display: inline-block; background: linear-gradient(145deg, #EF3F0A, #d63509); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Reset Password
                </a>
              </div>

              <!-- Info Box -->
              <div style="background: #fff7ed; border: 2px solid #fed7aa; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <p style="color: #9a3412; font-size: 14px; margin: 0;">
                  <strong>⚠️ Penting:</strong> Link ini akan kadaluarsa dalam ${data.expiresIn}. Jika Anda tidak meminta reset password, Anda bisa mengabaikan email ini.
                </p>
              </div>

              <p style="color: #64748b; font-size: 14px; margin: 20px 0 0;">
                Jika tombol di atas tidak berfungsi, salin dan tempel link berikut ke browser Anda:
              </p>
              <p style="color: #276874; font-size: 12px; word-break: break-all; margin: 10px 0 0;">
                ${data.resetUrl}
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 40px; color: #94a3b8; font-size: 14px;">
              <p style="margin: 0 0 8px;">Invoice dibuat dengan InvoiceKirim</p>
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} InvoiceKirim. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
}

/**
 * Send email using SMTP (user's settings) or fall back to Resend
 */
export async function sendEmail({
  to,
  subject,
  html,
  userId,
}: {
  to: string | string[]
  subject: string
  html: string
  userId?: string // Optional: pass user ID to fetch SMTP settings
}) {
  // Try SMTP first if userId is provided
  if (userId) {
    try {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          smtpHost: true,
          smtpPort: true,
          smtpSecure: true,
          smtpUser: true,
          smtpPass: true,
        },
      })

      if (user?.smtpHost && user?.smtpUser && user?.smtpPass) {
        // User has SMTP configured, use it
        const transporter = nodemailer.createTransport({
          host: user.smtpHost,
          port: parseInt(user.smtpPort || '587'),
          secure: user.smtpSecure === true,
          auth: {
            user: user.smtpUser,
            pass: user.smtpPass,
          },
        })

        await transporter.sendMail({
          from: user.smtpUser,
          to: Array.isArray(to) ? to.join(', ') : to,
          subject,
          html,
        })

        return { success: true, data: { id: 'smtp-sent', method: 'smtp' } }
      }
    } catch (smtpError) {
      console.error('SMTP send failed, falling back to Resend:', smtpError)
      // Continue to Resend fallback
    }
  }

  // Fall back to Resend
  if (!resend) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Resend not configured. Skipping email send.')
      console.log('To:', to)
      console.log('Subject:', subject)
    }
    // Return success for development when Resend is not configured
    return { success: true, data: { id: 'dev-mode-skipped' } }
  }

  try {
    const result = await resend.emails.send({
      from: 'InvoiceKirim <hs.pramono@gmail.com>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}

/**
 * Send invoice notification
 */
export async function sendInvoiceSent(data: {
  to: string
  invoiceNumber: string
  clientName: string
  companyName: string
  total: string
  dueDate: string
  invoiceUrl: string
  userId?: string
}) {
  const template = emailTemplates.invoiceSent(data)
  return sendEmail({
    to: data.to,
    subject: template.subject,
    html: template.html,
    userId: data.userId,
  })
}

/**
 * Send payment reminder
 */
export async function sendPaymentReminder(data: {
  to: string
  invoiceNumber: string
  clientName: string
  companyName: string
  total: string
  dueDate: string
  daysUntilDue: number
  invoiceUrl: string
  userId?: string
}) {
  const template = emailTemplates.paymentReminder(data)
  return sendEmail({
    to: data.to,
    subject: template.subject,
    html: template.html,
    userId: data.userId,
  })
}

/**
 * Send overdue notification
 */
export async function sendInvoiceOverdue(data: {
  to: string
  invoiceNumber: string
  clientName: string
  companyName: string
  total: string
  dueDate: string
  daysOverdue: number
  invoiceUrl: string
  userId?: string
}) {
  const template = emailTemplates.invoiceOverdue(data)
  return sendEmail({
    to: data.to,
    subject: template.subject,
    html: template.html,
    userId: data.userId,
  })
}

/**
 * Send payment confirmation
 */
export async function sendInvoicePaid(data: {
  to: string
  invoiceNumber: string
  clientName: string
  companyName: string
  total: string
  paidDate: string
  userId?: string
}) {
  const template = emailTemplates.invoicePaid(data)
  return sendEmail({
    to: data.to,
    subject: template.subject,
    html: template.html,
    userId: data.userId,
  })
}

/**
 * Send trial expired notification
 */
export async function sendTrialExpiredEmail(data: {
  to: string
  userName: string
  dashboardUrl: string
}) {
  const template = emailTemplates.trialExpired(data)
  return sendEmail({
    to: data.to,
    subject: template.subject,
    html: template.html,
  })
}

/**
 * Send trial expiring soon notification (1 day before)
 */
export async function sendTrialExpiringSoonEmail(data: {
  to: string
  userName: string
  daysLeft: number
  expiryDate: string
  dashboardUrl: string
}) {
  const template = emailTemplates.trialExpiringSoon(data)
  return sendEmail({
    to: data.to,
    subject: template.subject,
    html: template.html,
  })
}

/**
 * Send trial warning notification (3 days before)
 */
export async function sendTrialWarningEmail(data: {
  to: string
  userName: string
  daysLeft: number
  expiryDate: string
  dashboardUrl: string
}) {
  const template = emailTemplates.trialWarning(data)
  return sendEmail({
    to: data.to,
    subject: template.subject,
    html: template.html,
  })
}

/**
 * Send team invitation email
 */
export async function sendTeamInvitationEmail(data: {
  to: string
  inviterName: string
  teamName: string
  role: string
  acceptUrl: string
  expiresIn: string
}) {
  const template = emailTemplates.teamInvitation(data)
  return sendEmail({
    to: data.to,
    subject: template.subject,
    html: template.html,
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(data: {
  to: string
  userName: string
  resetUrl: string
  expiresIn: string
}) {
  const template = emailTemplates.passwordReset(data)
  return sendEmail({
    to: data.to,
    subject: template.subject,
    html: template.html,
  })
}
