import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { acceptInvitation } from '@/lib/teams'

// GET /api/teams/invitations/accept - Accept a team invitation
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(
        new URL('/login?error=invalid_invitation', req.url)
      )
    }

    // Check if user is logged in
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      // Redirect to login with the invitation token stored in URL
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', req.url)
      loginUrl.searchParams.set('invitation', 'true')
      return NextResponse.redirect(loginUrl)
    }

    // Accept the invitation
    try {
      const membership = await acceptInvitation(token, session.user.id)

      // Redirect to teams page with success message
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const redirectUrl = new URL('/dashboard/teams', baseUrl)
      redirectUrl.searchParams.set('accepted', 'true')
      redirectUrl.searchParams.set('team', membership.teamId)

      return NextResponse.redirect(redirectUrl.toString())
    } catch (acceptError) {
      console.error('Error accepting invitation:', acceptError)

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const redirectUrl = new URL('/dashboard/teams', baseUrl)
      redirectUrl.searchParams.set('error', acceptError instanceof Error ? acceptError.message : 'Failed to accept invitation')

      return NextResponse.redirect(redirectUrl.toString())
    }
  } catch (error) {
    console.error('Invitation accept error:', error)

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    return NextResponse.redirect(
      new URL('/dashboard/teams?error=invitation_failed', baseUrl)
    )
  }
}
