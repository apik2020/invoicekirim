import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-session'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'

const PROVIDER_PRESETS: Record<string, { host: string; port: string; secure: boolean }> = {
  gmail: { host: 'smtp.gmail.com', port: '587', secure: false },
  outlook: { host: 'smtp-mail.outlook.com', port: '587', secure: false },
  yahoo: { host: 'smtp.mail.yahoo.com', port: '465', secure: true },
  zoho: { host: 'smtp.zoho.com', port: '587', secure: false },
}

// Schema for test connection (password required)
const testConnectionSchema = z.object({
  smtpHost: z.string().min(1, 'SMTP host harus diisi'),
  smtpPort: z.string().default('587'),
  smtpSecure: z.boolean().default(false),
  smtpUser: z.string().min(1, 'SMTP user harus diisi'),
  smtpPass: z.string().min(1, 'SMTP password harus diisi'),
  testOnly: z.literal(true),
})

// Schema for save settings (password optional)
const saveSettingsSchema = z.object({
  smtpHost: z.string().min(1, 'SMTP host harus diisi'),
  smtpPort: z.string().default('587'),
  smtpSecure: z.boolean().default(false),
  smtpUser: z.string().min(1, 'SMTP user harus diisi'),
  smtpPass: z.string().optional(),
  smtpFromName: z.string().min(1, 'Nama pengirim harus diisi'),
  smtpFromEmail: z.string().email('Format email tidak valid'),
  provider: z.string().optional(),
})

export const dynamic = 'force-dynamic'

// GET - Retrieve SMTP settings
export async function GET(req: NextRequest) {
  const result = await requireAdminAuth()

  if (result.error || !result.admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
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
        emailProvider: true,
        emailProviderStatus: true,
        emailLastTestedAt: true,
      },
    })

    return NextResponse.json({
      smtpHost: adminData?.smtpHost || '',
      smtpPort: adminData?.smtpPort || '587',
      smtpSecure: adminData?.smtpSecure || false,
      smtpUser: adminData?.smtpUser || '',
      smtpFromName: adminData?.smtpFromName || 'NotaBener',
      smtpFromEmail: adminData?.smtpFromEmail || '',
      hasSmtpPass: !!adminData?.smtpPass,
      provider: adminData?.emailProvider || 'custom',
      status: adminData?.emailProviderStatus || 'untested',
      lastTestedAt: adminData?.emailLastTestedAt,
    })
  } catch (error) {
    console.error('Get SMTP settings error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan saat mengambil pengaturan SMTP' }, { status: 500 })
  }
}

// POST - Save SMTP settings or test connection
export async function POST(req: NextRequest) {
  const result = await requireAdminAuth()

  if (result.error || !result.admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()

    // Auto-fill from provider preset
    if (body.provider && PROVIDER_PRESETS[body.provider]) {
      const preset = PROVIDER_PRESETS[body.provider]
      body.smtpHost = body.smtpHost || preset.host
      body.smtpPort = body.smtpPort || preset.port
      body.smtpSecure = body.smtpSecure ?? preset.secure
    }

    // Test connection only
    if (body.testOnly === true) {
      const validation = testConnectionSchema.safeParse(body)

      if (!validation.success) {
        const firstError = validation.error.issues[0]
        return NextResponse.json({ error: firstError?.message || 'Data tidak valid' }, { status: 400 })
      }

      const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass } = validation.data
      const nodemailer = await import('nodemailer')

      const transporter = nodemailer.default.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpSecure,
        auth: { user: smtpUser, pass: smtpPass },
        connectionTimeout: 10000,
        socketTimeout: 10000,
      })

      try {
        await transporter.verify()
        return NextResponse.json({ success: true, message: 'Koneksi SMTP berhasil diverifikasi' })
      } catch (verifyError: any) {
        return NextResponse.json({
          success: false,
          error: `Koneksi SMTP gagal: ${verifyError.message || 'Unknown error'}`,
        }, { status: 400 })
      } finally {
        transporter.close()
      }
    }

    // Save settings
    const validation = saveSettingsSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json({ error: firstError?.message || 'Data tidak valid' }, { status: 400 })
    }

    const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, smtpFromName, smtpFromEmail, provider } = validation.data

    const updateData: Record<string, any> = {
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpFromName,
      smtpFromEmail,
      emailProvider: provider || 'custom',
      updatedAt: new Date(),
    }

    // Encrypt password if provided
    if (smtpPass && smtpPass.trim() !== '') {
      updateData.smtpPass = encrypt(smtpPass)
      updateData.emailProviderStatus = 'untested'
    }

    await prisma.admins.update({
      where: { id: result.admin.id },
      data: updateData,
    })

    return NextResponse.json({ success: true, message: 'Pengaturan SMTP berhasil disimpan' })
  } catch (error) {
    console.error('Save SMTP settings error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan saat menyimpan pengaturan SMTP' }, { status: 500 })
  }
}
