import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { checkMultipleFeatures, type FeatureKey } from '@/lib/feature-access'

/**
 * POST /api/feature-access/batch
 * Check access for multiple features at once
 * Body: { features: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { features } = body

    if (!Array.isArray(features) || features.length === 0) {
      return NextResponse.json(
        { error: 'Features array is required' },
        { status: 400 }
      )
    }

    // Validate feature keys
    const validFeatures = features.filter((f): f is FeatureKey => typeof f === 'string' && f.length > 0)

    if (validFeatures.length === 0) {
      return NextResponse.json(
        { error: 'No valid feature keys provided' },
        { status: 400 }
      )
    }

    // Batch check all features
    const results = await checkMultipleFeatures(session.id, validFeatures)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Batch feature access check error:', error)
    return NextResponse.json(
      { error: 'Gagal memeriksa akses fitur' },
      { status: 500 }
    )
  }
}
