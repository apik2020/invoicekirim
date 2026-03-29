import { NextRequest, NextResponse } from 'next/server'
import { getUserSession } from '@/lib/session'
import { getAvailableUpgrades } from '@/lib/subscription-upgrade'

export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await getAvailableUpgrades(session.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[available-plans] Error:', error)
    console.error('[available-plans] Error details:', error instanceof Error ? error.message : String(error))
    console.error('[available-plans] Stack trace:', error instanceof Error ? error.stack : 'No stack trace')

    return NextResponse.json(
      {
        error: 'Gagal mengambil opsi upgrade',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
