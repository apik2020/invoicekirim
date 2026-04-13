import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

// Simple logger
const log = (...args: any[]) => console.log('[AUTH]', ...args)
const logError = (...args: any[]) => console.error('[AUTH ERROR]', ...args)

// Helper to check if user is admin
async function isAdminEmail(email: string): Promise<boolean> {
  try {
    const admin = await prisma.admins.findUnique({
      where: { email },
      select: { id: true },
    })
    return !!admin
  } catch {
    return false
  }
}

// Helper to create or get user for OAuth
async function createOrGetOAuthUser(email: string, name?: string | null, image?: string | null) {
  let user = await prisma.users.findUnique({
    where: { email }
  })

  if (!user) {
    user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email: email,
        name: name || email.split('@')[0],
        image: image || null,
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })
    log('Created new OAuth user:', email)

    try {
      // Get the free plan ID
      const freePlan = await prisma.pricing_plans.findFirst({
        where: { slug: 'plan-free', isActive: true },
        select: { id: true },
      })

      await prisma.subscriptions.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          status: 'FREE',
          planType: 'FREE',
          pricingPlanId: freePlan?.id || null,
          updatedAt: new Date(),
        }
      })
    } catch (error) {
      logError('Failed to create subscription for OAuth user:', error)
    }
  } else {
    if (name && name !== user.name) {
      await prisma.users.update({
        where: { id: user.id },
        data: {
          name: name,
          image: image || user.image,
          updatedAt: new Date(),
        }
      })
    }
  }

  return user
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),

    // Credentials Provider (Email/Password)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          log('Login attempt:', credentials?.email)

          if (!credentials?.email || !credentials?.password) {
            log('Missing email or password')
            return null
          }

          // Check Admin table first
          log('Checking Admin table for:', credentials.email)
          const admin = await prisma.admins.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
            },
          })

          log('Admin found:', !!admin)

          if (admin && admin.password) {
            const isPasswordValid = await bcrypt.compare(
              credentials.password,
              admin.password
            )

            log('Admin password valid:', isPasswordValid)

            if (isPasswordValid) {
              log('Admin login successful')
              return {
                id: admin.id,
                email: admin.email,
                name: admin.name,
              }
            }
          }

          // Check User table
          log('Checking User table for:', credentials.email)
          const user = await prisma.users.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              password: true,
            },
          })

          log('User found:', !!user, 'Has password:', !!user?.password)

          if (!user || !user.password) {
            log('User not found or no password')
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          log('User password valid:', isPasswordValid)

          if (!isPasswordValid) {
            log('Invalid password')
            return null
          }

          log('User login successful')
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error) {
          logError('Auth error:', error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === 'google' && user.email) {
          log('Google OAuth sign-in:', user.email)

          // Check if user is admin
          const isAdmin = await isAdminEmail(user.email)

          // Create or get user with subscription
          const dbUser = await createOrGetOAuthUser(
            user.email,
            user.name,
            user.image
          )

          // Attach admin status and database user ID to user object
          user.id = dbUser.id
          user.isAdmin = isAdmin

          log('Google OAuth successful, user ID:', dbUser.id, 'isAdmin:', isAdmin)
          return true
        }
        return true
      } catch (error) {
        logError('SignIn callback error:', error)
        return false
      }
    },

    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id
          token.email = user.email ?? undefined
          token.name = user.name ?? undefined
          token.image = user.image ?? undefined
          token.isAdmin = user.isAdmin ?? false
        }
        return token
      } catch (error) {
        logError('JWT callback error:', error)
        return token
      }
    },

    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = token.id as string
          session.user.email = token.email as string
          session.user.name = token.name as string
          session.user.image = token.image as string | null
          session.user.isAdmin = token.isAdmin as boolean
        }
        return session
      } catch (error) {
        logError('Session callback error:', error)
        return session
      }
    },
  },
  debug: process.env.NEXTAUTH_DEBUG === 'true',
}
