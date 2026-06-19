import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { createTeam, getUserTeams } from '@/lib/teams'
import { logger } from '@/lib/logger'
import { createTeamSchema } from '@/lib/validations/common'

/**
 * GET /api/teams
 *
 * Lists all teams the authenticated user belongs to.
 *
 * @returns {{ teams: Team[] }} List of the user's teams
 * @throws {401} Unauthorized - User not logged in
 * @throws {500} Internal Server Error
 */
export async function GET() {
  let session
  try {
    session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teams = await getUserTeams(session.id)

    return NextResponse.json({ teams })
  } catch (error) {
    logger.apiError('/api/teams GET', error, session?.id)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/teams
 *
 * Creates a new team owned by the authenticated user.
 *
 * @body {CreateTeamSchema} Team data (name, optional description)
 *
 * @returns {{ team: Team }} Created team object
 * @throws {401} Unauthorized - User not logged in
 * @throws {422} Validation Error - Invalid team data
 * @throws {500} Internal Server Error
 */
export async function POST(req: NextRequest) {
  let session
  try {
    session = await getUserSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = createTeamSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        {
          error: firstError?.message || 'Data tidak valid',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 422 }
      )
    }

    const team = await createTeam(
      session.id,
      validation.data.name,
      validation.data.description
    )

    logger.info('Team created', { userId: session.id, teamId: team?.id })

    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    logger.apiError('/api/teams POST', error, session?.id)
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    )
  }
}
