import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encrypt, isEncrypted } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

// Provider presets for auto-fill
const PROVIDER_PRESETS: Record<string, { host: string; port: string; secure: boolean }> = {
  gmail: { host: 'smtp.gmail.com', port: '587', secure: false },
  outlook: { host: 'smtp-mail.outlook.com', port: '587', secure: false },
  yahoo: { host: 'smtp.mail.yahoo.com', port: '465', secure: true },
}

// GET - Fetch email provider settings
export async function GET() {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.users.findUnique({
      where: { id: session.id },
      select: {
        emailProviderMode: true,
        emailProvider: true,
        emailFallbackEnabled: true,
        emailProviderStatus: true,
        emailLastTestedAt: true,
        emailTestTarget: true,
        smtpHost: true,
        smtpPort: true,
        smtpSecure: true,
        smtpUser: true,
        smtpPass: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Backward compat: if user has SMTP configured but no mode set, treat as custom
    const mode = user.emailProviderMode || (user.smtpHost ? 'custom' : 'default')
    const hasPassword = !!user.smtpPass

    return NextResponse.json({
      mode,
      provider: user.emailProvider || 'custom',
      fallbackEnabled: user.emailFallbackEnabled ?? true,
      status: user.emailProviderStatus || 'untested',
      lastTestedAt: user.emailLastTestedAt,
      testTarget: user.emailTestTarget || user.smtpUser || '',
      smtp: {
        host: user.smtpHost || '',
        port: user.smtpPort || '587',
        secure: user.smtpSecure ?? false,
        user: user.smtpUser || '',
        hasPassword,
      },
    })
  } catch (error) {
    console.error('Error fetching email settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT - Save email provider settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      mode,
      provider,
      fallbackEnabled,
      testTarget,
      smtp,
    } = body as {
      mode: 'default' | 'custom'
      provider?: string
      fallbackEnabled?: boolean
      testTarget?: string
      smtp?: {
        host?: string
        port?: string
        secure?: boolean
        user?: string
        pass?: string
      }
    }

    const updateData: Record<string, any> = {
      emailProviderMode: mode || 'default',
      emailProvider: provider || 'custom',
      emailFallbackEnabled: fallbackEnabled ?? true,
      emailTestTarget: testTarget || null,
    }

    if (mode === 'default') {
      // When using system email, clear custom SMTP fields and set status
      updateData.smtpHost = null
      updateData.smtpPort = '587'
      updateData.smtpSecure = false
      updateData.smtpUser = null
      updateData.smtpPass = null
      updateData.emailProviderStatus = null
      updateData.emailLastTestedAt = null
    } else if (mode === 'custom' && smtp) {
      // Custom SMTP mode
      const preset = provider && PROVIDER_PRESETS[provider]
      const host = preset ? preset.host : (smtp.host || '')
      const port = preset ? preset.port : (smtp.port || '587')
      const secure = preset ? preset.secure : (smtp.secure ?? false)

      if (!host || !smtp.user) {
        return NextResponse.json(
          { error: 'SMTP host dan email pengirim wajib diisi' },
          { status: 400 }
        )
      }

      updateData.smtpHost = host
      updateData.smtpPort = port
      updateData.smtpSecure = secure
      updateData.smtpUser = smtp.user

      // Only update password if a new one is provided
      if (smtp.pass) {
        updateData.smtpPass = encrypt(smtp.pass)
        updateData.emailProviderStatus = 'untested'
      }

      // Reset status when settings change
      if (smtp.host || smtp.user || smtp.pass) {
        // Don't override if only pass wasn't provided
        if (!updateData.emailProviderStatus) {
          updateData.emailProviderStatus = 'untested'
        }
      }
    }

    await prisma.users.update({
      where: { id: session.id },
      data: updateData,
    })

    return NextResponse.json({ success: true, message: 'Pengaturan email berhasil disimpan' })
  } catch (error) {
    console.error('Error saving email settings:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
