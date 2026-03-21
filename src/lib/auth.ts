import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { checkLoginAttempts, recordFailedAttempt, clearLoginAttempts } from './login-attempts'
import { env } from './env'
import { logger } from './logger'

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
  // Check if user exists
  let user = await prisma.users.findUnique({
    where: { email }
  })

  if (!user) {
    // Create new user
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
    logger.dev('Auth', 'Created new OAuth user:', email)

    // Create subscription for new user
    try {
      await prisma.subscriptions.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          status: 'FREE',
          planType: 'FREE',
          updatedAt: new Date(),
        }
      })
    } catch (error) {
      logger.error('Failed to create subscription for OAuth user:', error)
    }
  } else {
    // Update user info if needed
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
    ...(env.googleClientId && env.googleClientSecret ? [
      GoogleProvider({
        clientId: env.googleClientId,
        clientSecret: env.googleClientSecret,
      })
    ] : []),

    // Credentials Provider (Email/Password)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          logger.dev('Auth', 'Login attempt:', credentials?.email)

          if (!credentials?.email || !credentials?.password) {
            logger.dev('Auth', 'Missing email or password')
            throw new Error('Email dan password harus diisi')
          }

          // Skip rate limiting in production temporarily to debug
          // Check rate limiting for this email
          // const attemptCheck = await checkLoginAttempts(credentials.email)
          // if (!attemptCheck.success) {
          //   if (attemptCheck.lockoutUntil) {
          //     const remaining = Math.ceil((attemptCheck.lockoutUntil.getTime() - Date.now()) / 1000)
          //     const minutes = Math.floor(remaining / 60)
          //     const seconds = remaining % 60
          //     throw new Error(
          //       `Terlalu banyak percobaan gagal. Akun dikunci sementara. Silakan coba lagi dalam ${minutes} menit ${seconds} detik.`
          //     )
          //   }
          // }

          // Check Admin table first
          logger.dev('Auth', 'Checking Admin table for:', credentials.email)
        const admin = await prisma.admins.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
          },
        })

        logger.dev('Auth', 'Admin found:', !!admin)

        if (admin && admin.password) {
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            admin.password
          )

          logger.dev('Auth', 'Admin password valid:', isPasswordValid)

          if (isPasswordValid) {
            await clearLoginAttempts(credentials.email)
            logger.dev('Auth', 'Admin login successful')
            return {
              id: admin.id,
              email: admin.email,
              name: admin.name,
            }
          }
        }

        // Check User table
        logger.dev('Auth', 'Checking User table for:', credentials.email)
        let user
        try {
          user = await prisma.users.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              password: true,
            },
          })
        } catch (error) {
          logger.error('Database error:', error)
          throw new Error('Database error')
        }

        logger.dev('Auth', 'User found:', !!user, 'Has password:', !!user?.password)

        // Get subscription separately to avoid potential errors
        let subscription = null
        if (user) {
          try {
            subscription = await prisma.subscriptions.findUnique({
              where: { userId: user.id },
            })
          } catch (error) {
            logger.error('Subscription query error:', error)
            // Continue without subscription
          }
        }

        // Record failed attempt if user not found or no password
        if (!user || !user.password) {
          logger.dev('Auth', 'User not found or no password')
          // Skip rate limiting temporarily
          // const failedAttempt = await recordFailedAttempt(credentials.email)
          // if (failedAttempt.lockoutUntil) {
          //   const remaining = Math.ceil((failedAttempt.lockoutUntil.getTime() - Date.now()) / 1000)
          //   const minutes = Math.floor(remaining / 60)
          //   const seconds = remaining % 60
          //   throw new Error(
          //     `Terlalu banyak percobaan gagal. Akun dikunci sementara. Silakan coba lagi dalam ${minutes} menit ${seconds} detik.`
          //   )
          // }

          // if (failedAttempt.remainingAttempts !== undefined && failedAttempt.remainingAttempts <= 2) {
          //   throw new Error(
          //     `Email atau password salah. ${failedAttempt.remainingAttempts} percobaan lagi sebelum akun dikunci sementara.`
          //   )
          // }

          throw new Error('Email atau password salah')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        logger.dev('Auth', 'User password valid:', isPasswordValid)

        // Record failed attempt if password is invalid
        if (!isPasswordValid) {
          logger.dev('Auth', 'Invalid password')
          // Skip rate limiting temporarily
          // const failedAttempt = await recordFailedAttempt(credentials.email)
          // if (failedAttempt.lockoutUntil) {
          //   const remaining = Math.ceil((failedAttempt.lockoutUntil.getTime() - Date.now()) / 1000)
          //   const minutes = Math.floor(remaining / 60)
          //   const seconds = remaining % 60
          //   throw new Error(
          //     `Terlalu banyak percobaan gagal. Akun dikunci sementara. Silakan coba lagi dalam ${minutes} menit ${seconds} detik.`
          //   )
          // }

          // if (failedAttempt.remainingAttempts !== undefined && failedAttempt.remainingAttempts <= 2) {
          //   throw new Error(
          //     `Email atau password salah. ${failedAttempt.remainingAttempts} percobaan lagi sebelum akun dikunci sementara.`
          //   )
          // }

          throw new Error('Email atau password salah')
        }

        // Clear login attempts on successful login
        // await clearLoginAttempts(credentials.email)

        // Create subscription if doesn't exist
        if (!subscription) {
          try {
            await prisma.subscriptions.create({
              data: {
                id: crypto.randomUUID(),
                userId: user.id,
                status: 'FREE',
                planType: 'FREE',
                updatedAt: new Date(),
              },
            })
          } catch (error) {
            logger.error('Failed to create subscription:', error)
            // Continue anyway
          }
        }

        logger.dev('Auth', 'User login successful')
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
        } catch (error) {
          logger.error('Auth error:', error)
          throw error
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
    async signIn({ user, account }) {
      // Handle Google OAuth sign-in
      if (account?.provider === 'google' && user.email) {
        logger.dev('Auth', 'Google OAuth sign-in:', user.email)

        try {
          const dbUser = await createOrGetOAuthUser(user.email, user.name, user.image)
          // Update the user object with database ID
          user.id = dbUser.id
          logger.dev('Auth', 'Google OAuth successful, user ID:', dbUser.id)
          return true
        } catch (error) {
          logger.error('Google OAuth error:', error)
          return false
        }
      }

      return true
    },

    async jwt({ token, user, account }) {
      try {
        // Initial sign in
        if (user) {
          token.id = user.id
          token.email = user.email ?? undefined
          token.name = user.name ?? undefined
          token.image = user.image ?? undefined

          // Check if admin
          if (user.email) {
            token.isAdmin = await isAdminEmail(user.email)
          }
        }

        // For Google OAuth, ensure we have the correct user ID from database
        if (account?.provider === 'google' && user?.email) {
          const dbUser = await prisma.users.findUnique({
            where: { email: user.email }
          })
          if (dbUser) {
            token.id = dbUser.id
            token.email = dbUser.email ?? undefined
            token.name = dbUser.name ?? undefined
            token.image = dbUser.image ?? undefined
            token.isAdmin = await isAdminEmail(dbUser.email)
          }
        }

        return token
      } catch (error) {
        logger.error('JWT callback error:', error)
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
        logger.error('Session callback error:', error)
        return session
      }
    },
  },
  debug: true, // Enable debug mode temporarily to troubleshoot production issues
}
