import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import {
  checkFeatureAccess,
  getUserFeatures,
  type FeatureKey,
} from '@/lib/feature-access'

/**
 * GET /api/feature-access
 * Check access for a single feature or get all features
 * Query params:
 * - feature: Feature key to check (optional, if not provided returns all features)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const featureKey = searchParams.get('feature') as FeatureKey | null

    if (featureKey) {
      // Check single feature
      const result = await checkFeatureAccess(session.id, featureKey)
      return NextResponse.json(result)
    }

    // Get all features with access status
    const features = await getUserFeatures(session.id)
    return NextResponse.json({ features })
  } catch (error) {
    console.error('Feature access check error:', error)
    return NextResponse.json(
      { error: 'Gagal memeriksa akses fitur' },
      { status: 500 }
    )
  }
}
