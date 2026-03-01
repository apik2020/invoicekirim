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

// Email templates
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
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(145deg, #0891b2, #06b6d4); border-radius: 16px; margin: 0 auto 20px;"></div>
              <h1 style="color: #1e293b; font-size: 24px; font-weight: bold; margin: 0;">InvoiceKirim</h1>
              <p style="color: #64748b; margin: 8px 0 0;">Platform Invoice untuk Freelancer</p>
            </div>

            <!-- Main Card -->
            <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #0891b2; font-size: 28px; font-weight: bold; margin: 0 0 10px;">
                Invoice ${data.invoiceNumber}
              </h2>
              <p style="color: #64748b; margin: 0 0 30px;">
                Halo ${data.clientName},
              </p>
              <p style="color: #334155; line-height: 1.6; margin: 0 0 20px;">
                ${data.companyName} telah mengirimkan invoice baru untuk Anda. Berikut adalah detail invoice:
              </p>

              <!-- Invoice Details -->
              <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #64748b;">Total Amount</span>
                  <span style="color: #1e293b; font-weight: bold; font-size: 20px;">${data.total}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #64748b;">Jatuh Tempo</span>
                  <span style="color: #0891b2; font-weight: 600;">${data.dueDate}</span>
                </div>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.invoiceUrl}" style="display: inline-block; background: linear-gradient(145deg, #0891b2, #06b6d4); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
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
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fef3c7;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(145deg, #f59e0b, #d97706); border-radius: 16px; margin: 0 auto 20px;"></div>
              <h1 style="color: #92400e; font-size: 24px; font-weight: bold; margin: 0;">⏰ Payment Reminder</h1>
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
              <div style="background: #fffbeb; border: 2px solid #fcd34d; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #92400e;">Total Amount</span>
                  <span style="color: #92400e; font-weight: bold; font-size: 20px;">${data.total}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #92400e;">Jatuh Tempo</span>
                  <span style="color: #d97706; font-weight: 600;">${data.dueDate}</span>
                </div>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.invoiceUrl}" style="display: inline-block; background: linear-gradient(145deg, #f59e0b, #d97706); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Bayar Sekarang
                </a>
              </div>

              <p style="color: #64748b; font-size: 14px; margin: 20px 0 0;">
                Silakan lakukan pembayaran sebelum tanggal jatuh tempo untuk menghindari denda keterlambatan.
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 40px; color: #92400e; font-size: 14px;">
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
              <div style="width: 60px; height: 60px; background: linear-gradient(145deg, #ef4444, #dc2626); border-radius: 16px; margin: 0 auto 20px;"></div>
              <h1 style="color: #991b1b; font-size: 24px; font-weight: bold; margin: 0;">⚠️ Invoice Overdue</h1>
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
              <div style="width: 60px; height: 60px; background: linear-gradient(145deg, #10b981, #059669); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 32px;">
                ✅
              </div>
              <h1 style="color: #065f46; font-size: 24px; font-weight: bold; margin: 0;">Pembayaran Berhasil!</h1>
            </div>

            <!-- Main Card -->
            <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <p style="color: #334155; line-height: 1.6; margin: 0 0 20px;">
                Halo ${data.clientName},
              </p>
              <p style="color: #065f46; line-height: 1.6; margin: 0 0 30px; font-weight: 600;">
                Terima kasih! Pembayaran untuk <strong>Invoice ${data.invoiceNumber}</strong> dari ${data.companyName} telah berhasil diterima.
              </p>

              <!-- Payment Details -->
              <div style="background: #f0fdf4; border: 2px solid #6ee7b7; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #065f46;">Invoice Number</span>
                  <span style="color: #065f46; font-weight: 600;">${data.invoiceNumber}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #065f46;">Total Amount</span>
                  <span style="color: #065f46; font-weight: bold; font-size: 20px;">${data.total}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #065f46;">Tanggal Bayar</span>
                  <span style="color: #059669; font-weight: 600;">${data.paidDate}</span>
                </div>
              </div>

              <p style="color: #64748b; font-size: 14px; margin: 20px 0 0;">
                Bukti pembayaran telah terlampir dalam invoice. Anda bisa mengunduh invoice dari dashboard.
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 40px; color: #065f46; font-size: 14px;">
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
 * Send email using Resend
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[]
  subject: string
  html: string
}) {
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
}) {
  const template = emailTemplates.invoiceSent(data)
  return sendEmail({
    to: data.to,
    subject: template.subject,
    html: template.html,
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
}) {
  const template = emailTemplates.paymentReminder(data)
  return sendEmail({
    to: data.to,
    subject: template.subject,
    html: template.html,
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
}) {
  const template = emailTemplates.invoiceOverdue(data)
  return sendEmail({
    to: data.to,
    subject: template.subject,
    html: template.html,
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
}) {
  const template = emailTemplates.invoicePaid(data)
  return sendEmail({
    to: data.to,
    subject: template.subject,
    html: template.html,
  })
}
