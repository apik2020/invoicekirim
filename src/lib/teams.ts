import { prisma } from '@/lib/prisma'
import { TeamRole, hasPermission, isRoleAtLeast } from '@/lib/permissions'
import { nanoid } from 'nanoid'

export interface TeamWithMembership {
  id: string
  name: string
  slug: string
  description: string | null
  ownerId: string
  planType: string
  role: TeamRole
  membershipId: string
}

/**
 * Get all teams for a user
 */
export async function getUserTeams(userId: string): Promise<TeamWithMembership[]> {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    include: { team: true },
    orderBy: { createdAt: 'asc' },
  })

  return memberships.map((m) => ({
    id: m.team.id,
    name: m.team.name,
    slug: m.team.slug,
    description: m.team.description,
    ownerId: m.team.ownerId,
    planType: m.team.planType,
    role: m.role as TeamRole,
    membershipId: m.id,
  }))
}

/**
 * Get user's role in a team
 */
export async function getUserTeamRole(
  userId: string,
  teamId: string
): Promise<TeamRole | null> {
  const membership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId },
    },
    select: { role: true },
  })

  return membership?.role as TeamRole | null
}

/**
 * Check if user is a member of a team
 */
export async function isTeamMember(userId: string, teamId: string): Promise<boolean> {
  const membership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId },
    },
  })

  return !!membership
}

/**
 * Check if user has permission in team
 */
export async function checkTeamPermission(
  userId: string,
  teamId: string,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'manage'
): Promise<boolean> {
  const role = await getUserTeamRole(userId, teamId)
  if (!role) return false
  return hasPermission(role, resource, action)
}

/**
 * Create a new team
 */
export async function createTeam(
  userId: string,
  name: string,
  description?: string
) {
  const slug = generateTeamSlug(name)

  const team = await prisma.team.create({
    data: {
      name,
      slug,
      description,
      ownerId: userId,
      members: {
        create: {
          userId,
          role: TeamRole.OWNER,
          joinedAt: new Date(),
        },
      },
      branding: {
        create: {
          primaryColor: '#F97316',
          showLogo: true,
          showColors: true,
        },
      },
    },
    include: {
      members: true,
      branding: true,
    },
  })

  return team
}

/**
 * Generate a unique URL-friendly slug for a team
 */
function generateTeamSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)

  const uniqueSuffix = nanoid(6)
  return `${baseSlug}-${uniqueSuffix}`
}

/**
 * Invite a user to a team
 */
export async function inviteToTeam(
  teamId: string,
  email: string,
  role: TeamRole,
  invitedBy: string
) {
  // Check if inviter has permission
  const inviterRole = await getUserTeamRole(invitedBy, teamId)
  if (!inviterRole || !isRoleAtLeast(inviterRole, TeamRole.ADMIN)) {
    throw new Error('You do not have permission to invite members')
  }

  // Check if user is already a member
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (existingUser) {
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId: existingUser.id },
      },
    })

    if (existingMember) {
      throw new Error('User is already a member of this team')
    }
  }

  // Check for existing pending invitation
  const existingInvitation = await prisma.teamInvitation.findFirst({
    where: {
      teamId,
      email,
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
  })

  if (existingInvitation) {
    throw new Error('An invitation is already pending for this email')
  }

  // Create invitation
  const token = nanoid(32)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const invitation = await prisma.teamInvitation.create({
    data: {
      teamId,
      email,
      role,
      token,
      invitedBy,
      status: 'PENDING',
      expiresAt,
    },
  })

  return invitation
}

/**
 * Accept a team invitation
 */
export async function acceptInvitation(token: string, userId: string) {
  const invitation = await prisma.teamInvitation.findUnique({
    where: { token },
    include: { team: true },
  })

  if (!invitation) {
    throw new Error('Invalid invitation token')
  }

  if (invitation.status !== 'PENDING') {
    throw new Error('Invitation has already been processed')
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    })
    throw new Error('Invitation has expired')
  }

  // Get user email
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })

  if (!user || user.email !== invitation.email) {
    throw new Error('This invitation is for a different email address')
  }

  // Create membership and update invitation
  const [membership] = await prisma.$transaction([
    prisma.teamMember.create({
      data: {
        teamId: invitation.teamId,
        userId,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        joinedAt: new Date(),
      },
    }),
    prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    }),
  ])

  return membership
}

/**
 * Remove a member from a team
 */
export async function removeMember(
  teamId: string,
  memberId: string,
  removedBy: string
) {
  const membership = await prisma.teamMember.findUnique({
    where: { id: memberId },
    include: { team: true },
  })

  if (!membership || membership.teamId !== teamId) {
    throw new Error('Member not found')
  }

  // Can't remove the owner
  if (membership.team.ownerId === membership.userId) {
    throw new Error('Cannot remove the team owner')
  }

  // Check permission
  const removerRole = await getUserTeamRole(removedBy, teamId)
  if (!removerRole || !isRoleAtLeast(removerRole, TeamRole.ADMIN)) {
    throw new Error('You do not have permission to remove members')
  }

  // Check role hierarchy
  if (removerRole !== TeamRole.OWNER && isRoleAtLeast(membership.role as TeamRole, removerRole)) {
    throw new Error('Cannot remove a member with equal or higher role')
  }

  await prisma.teamMember.delete({
    where: { id: memberId },
  })

  return true
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
  teamId: string,
  memberId: string,
  newRole: TeamRole,
  updatedBy: string
) {
  const membership = await prisma.teamMember.findUnique({
    where: { id: memberId },
    include: { team: true },
  })

  if (!membership || membership.teamId !== teamId) {
    throw new Error('Member not found')
  }

  // Can't change owner's role
  if (membership.team.ownerId === membership.userId) {
    throw new Error('Cannot change the team owner\'s role')
  }

  // Check permission
  const updaterRole = await getUserTeamRole(updatedBy, teamId)
  if (!updaterRole || updaterRole !== TeamRole.OWNER) {
    throw new Error('Only team owners can change member roles')
  }

  const updated = await prisma.teamMember.update({
    where: { id: memberId },
    data: { role: newRole },
  })

  return updated
}

/**
 * Delete a team (owner only)
 */
export async function deleteTeam(teamId: string, userId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { ownerId: true },
  })

  if (!team) {
    throw new Error('Team not found')
  }

  if (team.ownerId !== userId) {
    throw new Error('Only team owners can delete teams')
  }

  await prisma.team.delete({
    where: { id: teamId },
  })

  return true
}
