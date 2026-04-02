import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-session'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const smtpSettingsSchema = z.object({
  smtpHost: z.string().min(1, 'SMTP host harus diisi'),
  smtpPort: z.string().default('587'),
  smtpSecure: z.boolean().default(false),
  smtpUser: z.string().min(1, 'SMTP user harus diisi'),
  smtpPass: z.string().min(1, 'SMTP password harus diisi'),
  smtpFromName: z.string().min(1, 'Nama pengirim harus diisi'),
  smtpFromEmail: z.string().email('Format email tidak valid'),
  testOnly: z.boolean().optional(),
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
    })
  } catch (error) {
    console.error('Get SMTP settings error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil pengaturan SMTP' },
      { status: 500 }
    )
  }
}

// POST - Save SMTP settings
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
    const validation = smtpSettingsSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || 'Data tidak valid' },
        { status: 400 }
      )
    }

    const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, smtpFromName, smtpFromEmail, testOnly } = validation.data

    // Check if this is just a test request
    if (testOnly) {
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

    // Save SMTP settings
    await prisma.admins.update({
      where: { id: result.admin.id },
      data: {
        smtpHost,
        smtpPort,
        smtpSecure,
        smtpUser,
        smtpPass,
        smtpFromName,
        smtpFromEmail,
        updatedAt: new Date(),
      },
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
