import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'
import { logInvoiceSent } from '@/lib/activity-log'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// POST - Send invoice via email
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch invoice with items
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        items: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Generate invoice URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const invoiceUrl = `${baseUrl}/invoice/${invoice.accessToken}`

    // Calculate totals
    const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
    const taxAmount = invoice.subtotal * (invoice.taxRate / 100)

    // Create HTML email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #fff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #f97316 0%, #ec4899 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: bold;
            }
            .content {
              padding: 30px;
            }
            .invoice-info {
              background-color: #fff7ed;
              border-left: 4px solid #f97316;
              padding: 15px;
              margin-bottom: 20px;
              border-radius: 4px;
            }
            .invoice-info p {
              margin: 5px 0;
              font-size: 14px;
            }
            .invoice-info strong {
              color: #f97316;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #eee;
            }
            th {
              background-color: #f97316;
              color: white;
              font-weight: bold;
              font-size: 14px;
            }
            td {
              font-size: 14px;
            }
            .totals {
              margin-top: 20px;
              text-align: right;
            }
            .total-row {
              display: flex;
              justify-content: flex-end;
              padding: 8px 0;
              font-size: 14px;
            }
            .total-row.grand-total {
              border-top: 2px solid #f97316;
              padding-top: 15px;
              margin-top: 10px;
            }
            .total-row span:first-child {
              margin-right: 20px;
              color: #666;
            }
            .total-row.grand-total span {
              font-size: 18px;
              font-weight: bold;
              color: #f97316;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: linear-gradient(135deg, #f97316 0%, #ec4899 100%);
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              text-align: center;
              margin-top: 20px;
            }
            .footer {
              background-color: #f9f9f9;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .company-info, .client-info {
              margin-bottom: 20px;
            }
            .company-info h3, .client-info h3 {
              color: #f97316;
              margin-bottom: 10px;
              font-size: 16px;
            }
            .company-info p, .client-info p {
              margin: 5px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📄 Invoice ${invoice.invoiceNumber}</h1>
            </div>

            <div class="content">
              <div class="invoice-info">
                <p><strong>No. Invoice:</strong> ${invoice.invoiceNumber}</p>
                <p><strong>Tanggal:</strong> ${new Date(invoice.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                ${invoice.dueDate ? `<p><strong>Jatuh Tempo:</strong> ${new Date(invoice.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>` : ''}
              </div>

              <div class="company-info">
                <h3>Dari:</h3>
                <p><strong>${invoice.companyName}</strong></p>
                ${invoice.companyEmail ? `<p>📧 ${invoice.companyEmail}</p>` : ''}
                ${invoice.companyPhone ? `<p>📱 ${invoice.companyPhone}</p>` : ''}
                ${invoice.companyAddress ? `<p>📍 ${invoice.companyAddress}</p>` : ''}
              </div>

              <div class="client-info">
                <h3>Kepada:</h3>
                <p><strong>${invoice.clientName}</strong></p>
                <p>📧 ${invoice.clientEmail}</p>
                ${invoice.clientPhone ? `<p>📱 ${invoice.clientPhone}</p>` : ''}
                ${invoice.clientAddress ? `<p>📍 ${invoice.clientAddress}</p>` : ''}
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Deskripsi</th>
                    <th style="text-align: center;">Jumlah</th>
                    <th style="text-align: right;">Harga</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items.map(item => `
                    <tr>
                      <td>${item.description}</td>
                      <td style="text-align: center;">${item.quantity}</td>
                      <td style="text-align: right;">${formatCurrency(item.price)}</td>
                      <td style="text-align: right;">${formatCurrency(item.quantity * item.price)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="totals">
                <div class="total-row">
                  <span>Subtotal:</span>
                  <span>${formatCurrency(invoice.subtotal)}</span>
                </div>
                <div class="total-row">
                  <span>Pajak (${invoice.taxRate}%):</span>
                  <span>${formatCurrency(invoice.taxAmount)}</span>
                </div>
                <div class="total-row grand-total">
                  <span>Total:</span>
                  <span>${formatCurrency(invoice.total)}</span>
                </div>
              </div>

              ${invoice.notes ? `
                <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 4px;">
                  <strong>Catatan:</strong>
                  <p style="margin: 5px 0 0 0; font-size: 14px;">${invoice.notes}</p>
                </div>
              ` : ''}

              <div style="text-align: center; margin-top: 30px;">
                <a href="${invoiceUrl}" class="button">Lihat Invoice Online</a>
              </div>
            </div>

            <div class="footer">
              <p>Invoice ini dikirim secara otomatis oleh InvoiceKirim</p>
              <p>Jika ada pertanyaan, silakan hubungi pengirim invoice ini</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Fetch user to get SMTP settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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

    // Create transporter with user's SMTP settings
    const userTransporter = nodemailer.createTransport({
      host: user.smtpHost,
      port: parseInt(user.smtpPort || '587'),
      secure: user.smtpSecure ?? false,
      auth: {
        user: user.smtpUser,
        pass: user.smtpPass,
      },
    })

    // Send email
    await userTransporter.sendMail({
      from: user.smtpUser,
      to: invoice.clientEmail,
      subject: `Invoice ${invoice.invoiceNumber} dari ${invoice.companyName}`,
      html: emailHtml,
    })

    // Update invoice status to SENT
    await prisma.invoice.update({
      where: { id },
      data: { status: 'SENT' },
    })

    // Log activity
    await logInvoiceSent(session.user.id, invoice.invoiceNumber, invoice.clientEmail)

    return NextResponse.json({
      success: true,
      message: 'Invoice berhasil dikirim ke ' + invoice.clientEmail
    })
  } catch (error) {
    console.error('Send invoice error:', error)
    return NextResponse.json(
      { error: 'Failed to send invoice' },
      { status: 500 }
    )
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
