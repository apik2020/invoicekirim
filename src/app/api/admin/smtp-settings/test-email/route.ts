import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

// Force dynamic rendering
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
          smtpHost: true,
          smtpPort: true,
          smtpSecure: true,
          smtpUser: true,
          smtpPass: true,
          smtpFromName: true,
          smtpFromEmail: true,
        },
      })

      if (!adminData?.smtpPass) {
        return NextResponse.json(
          { error: 'Password SMTP belum disimpan. Silakan masukkan password SMTP terlebih dahulu.' },
          { status: 400 }
        )
      }

      // Use saved settings
      smtpHost = smtpHost || adminData.smtpHost
      smtpPort = smtpPort || adminData.smtpPort
      smtpSecure = smtpSecure ?? adminData.smtpSecure
      smtpUser = smtpUser || adminData.smtpUser
      smtpPass = adminData.smtpPass
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

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort) || 587,
      secure: smtpSecure === true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 15000,
      socketTimeout: 15000,
    })

    // Send test email
    await transporter.sendMail({
      from: `"${smtpFromName || 'NotaBener'}" <${smtpFromEmail || smtpUser}>`,
      to: smtpUser, // Send to self
      subject: '✅ Test Email dari NotaBener - SMTP Berhasil!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo-container { width: 60px; height: 60px; background: linear-gradient(145deg, #0A637D, #2d7d8a); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
            .content { background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .success-box { background: #f0fdf4; border: 2px solid #C5E151; border-radius: 12px; padding: 20px; margin: 20px 0; }
          </style>
        </head>
        <body style="background-color: #f7f7f7;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div class="header">
              <div class="logo-container">
                <img src="https://notabener.com/images/notabener-icon-admin.png" alt="NotaBener" width="48" height="48" style="border-radius: 12px;" />
              </div>
              <h1 style="color: #0A637D; margin: 0;">NotaBener</h1>
              <p style="color: #64748b; margin: 8px 0 0;">Admin Panel</p>
            </div>

            <div class="content">
              <h2 style="color: #0A637D; margin-top: 0;">✅ Test Email Berhasil!</h2>
              <p style="color: #334155; line-height: 1.6;">
                Email ini dikirim dari sistem NotaBener untuk menguji konfigurasi SMTP.
              </p>

              <div class="success-box">
                <p style="margin: 0; color: #3f6212;">
                  <strong>Waktu Pengiriman:</strong><br>
                  ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
                </p>
              </div>

              <p style="color: #64748b; font-size: 14px;">
                Jika Anda menerima email ini, berarti konfigurasi SMTP sudah benar dan sistem NotaBener siap mengirim email.
              </p>
            </div>

            <div style="text-align: center; margin-top: 40px; color: #94a3b8; font-size: 14px;">
              <p style="margin: 0;">Email test dari NotaBener Admin Panel</p>
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} NotaBener. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    // Close transporter
    transporter.close()

    return NextResponse.json({
      success: true,
      message: 'Email test berhasil dikirim!',
    })
  } catch (error: any) {
    console.error('Send test email error:', error)

    // Provide helpful error messages
    let errorMessage = 'Gagal mengirim email test'

    if (error.code === 'EAUTH') {
      errorMessage = 'Autentikasi gagal - Periksa username dan password SMTP'
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Tidak dapat terkoneksi ke server SMTP - Periksa host dan port'
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Koneksi timeout - Periksa koneksi atau coba port lain'
    } else if (error.message) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
