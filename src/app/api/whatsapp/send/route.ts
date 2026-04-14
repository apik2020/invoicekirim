import { NextRequest, NextResponse } from 'next/server'
import { getUserSession } from '@/lib/session'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

/**
 * POST /api/whatsapp/send
 * Send a WhatsApp message. Requires authentication.
 *
 * Body: { phoneNumber: string, message: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { phoneNumber, message } = body

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'phoneNumber dan message wajib diisi' },
        { status: 400 }
      )
    }

    const result = await sendWhatsAppMessage(phoneNumber, message)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Gagal mengirim pesan WhatsApp' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    })
  } catch (error) {
    console.error('[WA SEND] Error:', error)
    return NextResponse.json(
      { error: 'Gagal mengirim pesan WhatsApp' },
      { status: 500 }
    )
  }
}
