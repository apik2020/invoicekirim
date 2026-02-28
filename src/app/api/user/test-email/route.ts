import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import nodemailer from 'nodemailer'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// POST - Test email connection
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass } = body

    // Validate required fields
    if (!smtpHost || !smtpUser || !smtpPass) {
      return NextResponse.json(
        { error: 'SMTP host, user, dan password wajib diisi' },
        { status: 400 }
      )
    }

    // Create transporter with test credentials
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort) || 587,
      secure: smtpSecure === true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    // Verify connection
    await transporter.verify()

    // Send test email
    await transporter.sendMail({
      from: smtpUser,
      to: smtpUser, // Send to self
      subject: '✅ Test Email - InvoiceKirim',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #f97316 0%, #ec4899 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .success {
              color: #10b981;
              font-size: 48px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Email Berhasil!</h1>
            </div>
            <div class="content">
              <div class="success">✅</div>
              <h2 style="text-align: center;">Pengaturan Email Anda Sudah Benar</h2>
              <p style="text-align: center;">
                InvoiceKirim berhasil mengirim email menggunakan konfigurasi SMTP Anda.
              </p>
              <p style="text-align: center; color: #666; margin-top: 30px;">
                Anda sekarang bisa mengirim invoice langsung dari dashboard!
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    return NextResponse.json({
      success: true,
      message: 'Email test berhasil dikirim!'
    })
  } catch (error: any) {
    console.error('Test email error:', error)

    // Provide helpful error messages
    let errorMessage = 'Gagal mengirim email test'
    const details: string[] = []

    if (error.code === 'EAUTH') {
      errorMessage = 'Autentikasi gagal'
      details.push('Email atau password salah')
      details.push('Untuk Gmail: Gunakan App Password, bukan password biasa')
      details.push('Pastikan 2-Factor Authentication aktif')
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Tidak dapat terkoneksi ke server SMTP'
      details.push('Periksa SMTP host dan port')
      details.push('Pastikan firewall tidak memblokir koneksi')
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Koneksi timeout'
      details.push('Periksa koneksi internet Anda')
      details.push('Coba gunakan port lain (587 atau 465)')
    } else if (error.response && error.response.includes('Too many bad auth attempts')) {
      errorMessage = 'Akun email diblokir sementara'
      details.push('Gmail: Terlalu banyak percobaan login gagal')
      details.push('Tunggu 1-2 jam atau gunakan App Password baru')
    }

    return NextResponse.json(
      { error: errorMessage, details },
      { status: 500 }
    )
  }
}
