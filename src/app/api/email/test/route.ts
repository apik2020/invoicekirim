import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

// POST - Test email connection and send test email
export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { emailTarget } = body as { emailTarget?: string }

    // Get user's email settings
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
        { error: 'Konfigurasi SMTP belum lengkap. Isi semua field yang diperlukan.' },
        { status: 400 }
      )
    }

    // Decrypt password
    const password = decrypt(user.smtpPass)
    const targetEmail = emailTarget || user.smtpUser

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: user.smtpHost,
      port: parseInt(user.smtpPort || '587'),
      secure: user.smtpSecure === true,
      auth: {
        user: user.smtpUser,
        pass: password,
      },
    })

    // Verify connection
    await transporter.verify()

    // Send test email
    await transporter.sendMail({
      from: user.smtpUser,
      to: targetEmail,
      subject: 'Test Email - NotaBener',
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f7f7f7; }
.container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
.card { background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; }
.success { font-size: 48px; margin-bottom: 20px; }
h1 { color: #0A637D; font-size: 24px; font-weight: bold; margin: 0 0 10px; }
p { color: #64748b; line-height: 1.6; margin: 10px 0; }
.footer { text-align: center; margin-top: 30px; color: #94a3b8; font-size: 14px; }
</style></head>
<body>
<div class="container">
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="width: 60px; height: 60px; background: linear-gradient(145deg, #22c55e, #16a34a); border-radius: 16px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
      <span style="color: white; font-size: 28px;">&#10003;</span>
    </div>
  </div>
  <div class="card">
    <div class="success">&#9989;</div>
    <h1>Email Berhasil Terkirim!</h1>
    <p>Konfigurasi SMTP Anda sudah benar. Email dari NotaBener akan dikirim melalui server Anda.</p>
    <p style="color: #0A637D; font-weight: 600;">${user.smtpHost} (${user.smtpUser})</p>
  </div>
  <div class="footer"><p>Test email dikirim oleh NotaBener</p></div>
</div>
</body>
</html>`,
    })

    // Update status to connected
    await prisma.users.update({
      where: { id: session.id },
      data: {
        emailProviderStatus: 'connected',
        emailLastTestedAt: new Date(),
        emailTestTarget: targetEmail,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Test email berhasil dikirim ke ${targetEmail}`,
    })
  } catch (error: any) {
    console.error('Test email error:', error)

    // Update status to failed
    try {
      const session = await getUserSession()
      if (session?.id) {
        await prisma.users.update({
          where: { id: session.id },
          data: {
            emailProviderStatus: 'failed',
            emailLastTestedAt: new Date(),
          },
        })
      }
    } catch {}

    // Provide helpful error messages
    let errorMessage = 'Gagal mengirim email test'
    const details: string[] = []

    if (error.code === 'EAUTH') {
      errorMessage = 'Autentikasi gagal'
      details.push('Email atau password salah')
      details.push('Untuk Gmail: Gunakan App Password, bukan password biasa')
      details.push('Pastikan 2-Factor Authentication aktif di akun Google Anda')
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Tidak dapat terhubung ke server SMTP'
      details.push('Periksa SMTP host dan port sudah benar')
      details.push('Pastikan firewall tidak memblokir koneksi')
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Koneksi timeout'
      details.push('Periksa koneksi internet Anda')
      details.push('Coba gunakan port lain (587 untuk TLS, 465 untuk SSL)')
    } else if (error.response?.includes('Too many bad auth attempts')) {
      errorMessage = 'Akun email diblokir sementara'
      details.push('Terlalu banyak percobaan login gagal')
      details.push('Tunggu 1-2 jam atau buat App Password baru')
    } else if (error.message?.includes('self signed certificate')) {
      errorMessage = 'Sertifikat SSL tidak valid'
      details.push('Coba ubah koneksi ke TLS (port 587) jika menggunakan SSL')
    }

    return NextResponse.json(
      { error: errorMessage, details },
      { status: 500 }
    )
  }
}
