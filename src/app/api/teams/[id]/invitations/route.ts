import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserTeamRole, inviteToTeam } from '@/lib/teams'
import { TeamRole } from '@/lib/permissions'
import { z } from 'zod'

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(TeamRole).default(TeamRole.MEMBER),
})

// GET /api/teams/[id]/invitations - List pending invitations
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: teamId } = await params
    const role = await getUserTeamRole(session.user.id, teamId)

    if (!role) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const invitations = await prisma.teamInvitation.findMany({
      where: {
        teamId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}

// POST /api/teams/[id]/invitations - Invite a new member
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: teamId } = await params
    const role = await getUserTeamRole(session.user.id, teamId)

    if (!role || ![TeamRole.OWNER, TeamRole.ADMIN].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const validated = inviteSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.flatten() },
        { status: 400 }
      )
    }

    const invitation = await inviteToTeam(
      teamId,
      validated.data.email,
      validated.data.role,
      session.user.id
    )

    // TODO: Send invitation email

    return NextResponse.json({ invitation }, { status: 201 })
  } catch (error) {
    console.error('Error creating invitation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create invitation' },
      { status: 500 }
    )
  }
}
