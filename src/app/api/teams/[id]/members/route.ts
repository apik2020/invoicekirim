import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserTeamRole, removeMember, updateMemberRole } from '@/lib/teams'
import { TeamRole } from '@/lib/permissions'
import { z } from 'zod'

const updateMemberSchema = z.object({
  role: z.nativeEnum(TeamRole).optional(),
  memberId: z.string().optional(),
})

// GET /api/teams/[id]/members - List team members
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

    const members = await prisma.team_members.findMany({
      where: { teamId },
      include: {
        users: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ members, userRole: role })
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

// PUT /api/teams/[id]/members - Update member role
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: teamId } = await params
    const body = await req.json()
    const validated = updateMemberSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.flatten() },
        { status: 400 }
      )
    }

    if (!validated.data.memberId || !validated.data.role) {
      return NextResponse.json(
        { error: 'memberId and role are required' },
        { status: 400 }
      )
    }

    const membership = await updateMemberRole(
      teamId,
      validated.data.memberId,
      validated.data.role,
      session.id
    )

    return NextResponse.json({ membership })
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update member' },
      { status: 500 }
    )
  }
}

// DELETE /api/teams/[id]/members - Remove member
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: teamId } = await params
    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId is required' },
        { status: 400 }
      )
    }

    await removeMember(teamId, memberId, session.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove member' },
      { status: 500 }
    )
  }
}
