import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { getBranding, updateBranding } from '@/lib/branding'
import { getUserTeams, createTeam } from '@/lib/teams'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const updateBrandingSchema = z.object({
  logoUrl: z.any().optional().transform(val => {
    // Convert empty string to null
    if (val === '' || val === null || val === undefined) return null
    if (typeof val !== 'string') return null
    // Validate URL
    try {
      new URL(val)
      return val
    } catch {
      return null
    }
  }).nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.any().optional().transform(val => {
    if (val === '' || val === null || val === undefined) return null
    if (typeof val !== 'string') return null
    if (!/^#[0-9A-Fa-f]{6}$/.test(val)) return null
    return val
  }).nullable(),
  accentColor: z.any().optional().transform(val => {
    if (val === '' || val === null || val === undefined) return null
    if (typeof val !== 'string') return null
    if (!/^#[0-9A-Fa-f]{6}$/.test(val)) return null
    return val
  }).nullable(),
  invoicePrefix: z.string().max(10).optional(),
  receiptPrefix: z.string().max(10).optional(),
  showLogo: z.boolean().optional(),
  showColors: z.boolean().optional(),
  emailFromName: z.any().optional().transform(val => {
    if (val === '' || val === null || val === undefined) return null
    return val
  }).nullable(),
  emailReplyTo: z.any().optional().transform(val => {
    if (val === '' || val === null || val === undefined) return null
    if (typeof val !== 'string') return null
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return null
    return val
  }).nullable(),
  fontFamily: z.string().max(50).optional(),
})

/**
 * Get or create personal team for user
 * This ensures every user has at least one team for branding settings
 */
async function getOrCreatePersonalTeam(userId: string): Promise<string> {
  const teams = await getUserTeams(userId)

  if (teams.length > 0) {
    return teams[0].id
  }

  // Create a personal team for the user
  const userName = await prisma.users.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  })

  const teamName = userName?.name || userName?.email?.split('@')[0] || 'Personal'
  const team = await createTeam(userId, `${teamName}'s Workspace`, 'Personal workspace for branding settings')

  return team.id
}

// GET /api/branding - Get branding settings
export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    let teamId = searchParams.get('teamId')

    // If no teamId provided, get or create the user's personal team
    if (!teamId) {
      teamId = await getOrCreatePersonalTeam(session.id)
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
    let teamId = searchParams.get('teamId')

    // If no teamId provided, get or create the user's personal team
    if (!teamId) {
      teamId = await getOrCreatePersonalTeam(session.id)
    }

    const body = await req.json()
    console.log('[Branding PUT] Received body:', JSON.stringify(body, null, 2))

    const validated = updateBrandingSchema.safeParse(body)

    if (!validated.success) {
      console.log('[Branding PUT] Validation failed:', validated.error.flatten())
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.flatten() },
        { status: 400 }
      )
    }

    const branding = await updateBranding(teamId, validated.data)

    return NextResponse.json({ branding, success: true })
  } catch (error: any) {
    console.error('[Branding PUT] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to update branding' },
      { status: 500 }
    )
  }
}
