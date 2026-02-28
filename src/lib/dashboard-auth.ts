import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'

/**
 * Server-side check to ensure user is NOT an admin
 * Use this in server components or API routes for the user dashboard
 */
export async function ensureNotAdmin() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    // No session - let the page handle redirect
    return null
  }

  // Check if this email belongs to an admin
  const admin = await prisma.admin.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })

  if (admin) {
    // This is an admin - redirect to admin dashboard
    redirect('/admin')
  }

  // Regular user - allow access
  return null
}

/**
 * Client-side hook to check if current user is admin
 * Use this in client components
 */
export function useIsAdmin() {
  // This would be used in client components
  // For now, the server-side check above is sufficient
  return false
}
