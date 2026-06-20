import { NextResponse } from 'next/server'
import { checkWhatsAppHealth } from '@/lib/whatsapp'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/health
 * Check OpenWA connection status. Admin-only.
 */
export async function GET() {
  try {
    const result = await checkWhatsAppHealth()

    if (result.connected) {
      return NextResponse.json({
        connected: true,
        sessionId: result.sessionId,
        phone: result.phone,
      })
    }

    return NextResponse.json({
      connected: false,
      error: result.error || 'OpenWA tidak terhubung',
    }, { status: 503 })
  } catch (error) {
    logger.apiError('/api/whatsapp/health GET', error)
    return NextResponse.json({
      connected: false,
      error: 'Gagal mengecek status WhatsApp',
    }, { status: 500 })
  }
}
