import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-session'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Schema for test connection (password required)
const testConnectionSchema = z.object({
  smtpHost: z.string().min(1, 'SMTP host harus diisi'),
  smtpPort: z.string().default('587'),
  smtpSecure: z.boolean().default(false),
  smtpUser: z.string().min(1, 'SMTP user harus diisi'),
  smtpPass: z.string().min(1, 'SMTP password harus diisi'),
  testOnly: z.literal(true),
})

// Schema for save settings (password optional - keep existing if not provided)
const saveSettingsSchema = z.object({
  smtpHost: z.string().min(1, 'SMTP host harus diisi'),
  smtpPort: z.string().default('587'),
  smtpSecure: z.boolean().default(false),
  smtpUser: z.string().min(1, 'SMTP user harus diisi'),
  smtpPass: z.string().optional(), // Optional - keep existing if empty
  smtpFromName: z.string().min(1, 'Nama pengirim harus diisi'),
  smtpFromEmail: z.string().email('Format email tidak valid'),
})

// GET - Retrieve SMTP settings
export async function GET(req: NextRequest) {
  const result = await requireAdminAuth()

  if (result.error || !result.admin) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const adminData = await prisma.admins.findUnique({
      where: { id: result.admin.id },
      select: {
        smtpHost: true,
        smtpPort: true,
        smtpSecure: true,
        smtpUser: true,
        smtpPass: true, // Check if password exists (don't return it)
        smtpFromName: true,
        smtpFromEmail: true,
      },
    })

    return NextResponse.json({
      smtpHost: adminData?.smtpHost || '',
      smtpPort: adminData?.smtpPort || '587',
      smtpSecure: adminData?.smtpSecure || false,
      smtpUser: adminData?.smtpUser || '',
      smtpFromName: adminData?.smtpFromName || 'NotaBener',
      smtpFromEmail: adminData?.smtpFromEmail || '',
      hasSmtpPass: !!adminData?.smtpPass, // Indicate if password is set
    })
  } catch (error) {
    console.error('Get SMTP settings error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil pengaturan SMTP' },
      { status: 500 }
    )
  }
}

// POST - Save SMTP settings or test connection
export async function POST(req: NextRequest) {
  const result = await requireAdminAuth()

  if (result.error || !result.admin) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await req.json()

    // Check if this is just a test request (requires full password)
    if (body.testOnly === true) {
      const validation = testConnectionSchema.safeParse(body)

      if (!validation.success) {
        const firstError = validation.error.issues[0]
        return NextResponse.json(
          { error: firstError?.message || 'Data tidak valid' },
          { status: 400 }
        )
      }

      const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass } = validation.data

      // Test SMTP connection
      const nodemailer = await import('nodemailer')

      const transporter = nodemailer.default.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 10000,
        socketTimeout: 10000,
      })

      try {
        await transporter.verify()
        return NextResponse.json({
          success: true,
          message: 'Koneksi SMTP berhasil diverifikasi',
        })
      } catch (verifyError: any) {
        console.error('SMTP verification error:', verifyError)
        return NextResponse.json({
          success: false,
          error: `Koneksi SMTP gagal: ${verifyError.message || 'Unknown error'}`,
        }, { status: 400 })
      } finally {
        transporter.close()
      }
    }

    // Save settings - validate
    const validation = saveSettingsSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || 'Data tidak valid' },
        { status: 400 }
      )
    }

    const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, smtpFromName, smtpFromEmail } = validation.data

    // Build update data - always update these fields
    const updateData: Record<string, any> = {
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpFromName,
      smtpFromEmail,
      updatedAt: new Date(),
    }

    // Only update password if a new one is provided (not empty)
    if (smtpPass && smtpPass.trim() !== '') {
      updateData.smtpPass = smtpPass
    }

    // Save SMTP settings
    await prisma.admins.update({
      where: { id: result.admin.id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'Pengaturan SMTP berhasil disimpan',
    })
  } catch (error) {
    console.error('Save SMTP settings error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menyimpan pengaturan SMTP' },
      { status: 500 }
    )
  }
}
