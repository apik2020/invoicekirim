import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

// POST - Send test email using SMTP settings
export async function POST(req: NextRequest) {
  const result = await requireAdminAuth()

  if (result.error || !result.admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    let { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, smtpFromName, smtpFromEmail } = body

    // If password not provided, fetch from database
    if (!smtpPass || smtpPass.trim() === '') {
      const adminData = await prisma.admins.findUnique({
        where: { id: result.admin.id },
        select: {
          smtpHost: true, smtpPort: true, smtpSecure: true,
          smtpUser: true, smtpPass: true,
          smtpFromName: true, smtpFromEmail: true,
        },
      })

      if (!adminData?.smtpPass) {
        return NextResponse.json(
          { error: 'Password SMTP belum disimpan. Silakan masukkan password SMTP terlebih dahulu.' },
          { status: 400 }
        )
      }

      smtpHost = smtpHost || adminData.smtpHost
      smtpPort = smtpPort || adminData.smtpPort
      smtpSecure = smtpSecure ?? adminData.smtpSecure
      smtpUser = smtpUser || adminData.smtpUser
      smtpPass = decrypt(adminData.smtpPass)
      smtpFromName = smtpFromName || adminData.smtpFromName
      smtpFromEmail = smtpFromEmail || adminData.smtpFromEmail
    }

    // Validate required fields
    if (!smtpHost || !smtpUser || !smtpPass) {
      return NextResponse.json(
        { error: 'SMTP host, user, dan password wajib diisi' },
        { status: 400 }
      )
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort) || 587,
      secure: smtpSecure === true,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 15000,
      socketTimeout: 15000,
    })

    await transporter.sendMail({
      from: `"${smtpFromName || 'NotaBener'}" <${smtpFromEmail || smtpUser}>`,
      to: smtpUser,
      subject: 'Test Email - NotaBener Admin',
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
    <h1>Test Email Berhasil!</h1>
    <p>Konfigurasi SMTP admin sudah benar. Email sistem NotaBener siap digunakan.</p>
    <p style="color: #0A637D; font-weight: 600;">${smtpHost} (${smtpUser})</p>
    <p style="font-size: 12px; color: #94a3b8;">${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</p>
  </div>
  <div class="footer"><p>Test email dari NotaBener Admin Panel</p></div>
</div>
</body>
</html>`,
    })

    transporter.close()

    // Update status to connected
    await prisma.admins.update({
      where: { id: result.admin.id },
      data: {
        emailProviderStatus: 'connected',
        emailLastTestedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, message: 'Email test berhasil dikirim!' })
  } catch (error: any) {
    console.error('Send test email error:', error)

    // Update status to failed
    try {
      await prisma.admins.update({
        where: { id: result.admin!.id },
        data: { emailProviderStatus: 'failed', emailLastTestedAt: new Date() },
      })
    } catch {}

    let errorMessage = 'Gagal mengirim email test'
    const details: string[] = []

    if (error.code === 'EAUTH') {
      errorMessage = 'Autentikasi gagal'
      details.push('Periksa username dan password SMTP')
      details.push('Untuk Gmail: Gunakan App Password, bukan password biasa')
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Tidak dapat terhubung ke server SMTP'
      details.push('Periksa SMTP host dan port')
      details.push('Pastikan firewall tidak memblokir koneksi')
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Koneksi timeout'
      details.push('Periksa koneksi internet')
      details.push('Coba gunakan port lain (587 atau 465)')
    }

    return NextResponse.json({ error: errorMessage, details }, { status: 500 })
  }
}
