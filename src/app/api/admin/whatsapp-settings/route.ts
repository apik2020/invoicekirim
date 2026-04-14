import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/whatsapp-settings
 * Read OpenWA configuration from environment variables.
 * API key is masked for security.
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin_session')

    if (!adminSession?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.OPENWA_API_KEY || ''
    const maskedApiKey = apiKey
      ? apiKey.substring(0, 4) + '••••' + apiKey.substring(apiKey.length - 4)
      : ''

    return NextResponse.json({
      baseUrl: process.env.OPENWA_BASE_URL || '',
      apiKey: maskedApiKey,
      sessionId: process.env.OPENWA_SESSION_ID || 'notabener',
      hasApiKey: !!apiKey,
      configured: !!(process.env.OPENWA_BASE_URL && apiKey),
    })
  } catch (error) {
    console.error('[WA ADMIN SETTINGS] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
