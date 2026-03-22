import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserTeamRole, inviteToTeam } from '@/lib/teams'
import { TeamRole } from '@/lib/permissions'
import { sendTeamInvitationEmail } from '@/lib/email'
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
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: teamId } = await params
    const role = await getUserTeamRole(session.id, teamId)

    if (!role) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const invitations = await prisma.team_invitations.findMany({
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
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: teamId } = await params
    const role = await getUserTeamRole(session.id, teamId)

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
      session.id
    )

    // Get team and inviter details for email
    const [team, inviter] = await Promise.all([
      prisma.teams.findUnique({
        where: { id: teamId },
        select: { name: true },
      }),
      prisma.users.findUnique({
        where: { id: session.id },
        select: { name: true },
      }),
    ])

    // Send invitation email
    if (team && inviter) {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const acceptUrl = `${baseUrl}/api/teams/invitations/accept?token=${invitation.token}`

      try {
        await sendTeamInvitationEmail({
          to: validated.data.email,
          inviterName: inviter.name || 'Tim Admin',
          teamName: team.name,
          role: validated.data.role,
          acceptUrl,
          expiresIn: '7 hari',
        })
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ invitation }, { status: 201 })
  } catch (error) {
    console.error('Error creating invitation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create invitation' },
      { status: 500 }
    )
  }
}
