import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { getBranding, updateBranding } from '@/lib/branding'
import { z } from 'zod'

const updateBrandingSchema = z.object({
  logoUrl: z.string().url().nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  invoicePrefix: z.string().max(10).optional(),
  receiptPrefix: z.string().max(10).optional(),
  showLogo: z.boolean().optional(),
  showColors: z.boolean().optional(),
  emailFromName: z.string().max(100).nullable().optional(),
  emailReplyTo: z.string().email().nullable().optional(),
  fontFamily: z.string().max(50).optional(),
})

// GET /api/branding - Get branding settings
export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')

    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 })
    }

    const branding = await getBranding(teamId)

    return NextResponse.json({ branding })
  } catch (error) {
    console.error('Error fetching branding:', error)
    return NextResponse.json(
      { error: 'Failed to fetch branding' },
      { status: 500 }
    )
  }
}

// PUT /api/branding - Update branding settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')

    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 })
    }

    const body = await req.json()
    const validated = updateBrandingSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.flatten() },
        { status: 400 }
      )
    }

    const branding = await updateBranding(teamId, validated.data)

    return NextResponse.json({ branding })
  } catch (error) {
    console.error('Error updating branding:', error)
    return NextResponse.json(
      { error: 'Failed to update branding' },
      { status: 500 }
    )
  }
}
