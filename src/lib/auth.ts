import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
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

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(env.googleClientId && env.googleClientSecret ? [
      GoogleProvider({
        clientId: env.googleClientId,
        clientSecret: env.googleClientSecret,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            scope: "openid email profile"
          }
        }
      })
    ] : []),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        logger.dev('Auth', 'Login attempt:', credentials?.email)

        if (!credentials?.email || !credentials?.password) {
          logger.dev('Auth', 'Missing email or password')
          throw new Error('Email dan password harus diisi')
        }

        // Check rate limiting for this email
        const attemptCheck = await checkLoginAttempts(credentials.email)
        if (!attemptCheck.success) {
          if (attemptCheck.lockoutUntil) {
            const remaining = Math.ceil((attemptCheck.lockoutUntil.getTime() - Date.now()) / 1000)
            const minutes = Math.floor(remaining / 60)
            const seconds = remaining % 60
            throw new Error(
              `Terlalu banyak percobaan gagal. Akun dikunci sementara. Silakan coba lagi dalam ${minutes} menit ${seconds} detik.`
            )
          }
        }

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
          const failedAttempt = await recordFailedAttempt(credentials.email)
          if (failedAttempt.lockoutUntil) {
            const remaining = Math.ceil((failedAttempt.lockoutUntil.getTime() - Date.now()) / 1000)
            const minutes = Math.floor(remaining / 60)
            const seconds = remaining % 60
            throw new Error(
              `Terlalu banyak percobaan gagal. Akun dikunci sementara. Silakan coba lagi dalam ${minutes} menit ${seconds} detik.`
            )
          }

          if (failedAttempt.remainingAttempts !== undefined && failedAttempt.remainingAttempts <= 2) {
            throw new Error(
              `Email atau password salah. ${failedAttempt.remainingAttempts} percobaan lagi sebelum akun dikunci sementara.`
            )
          }

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
          const failedAttempt = await recordFailedAttempt(credentials.email)
          if (failedAttempt.lockoutUntil) {
            const remaining = Math.ceil((failedAttempt.lockoutUntil.getTime() - Date.now()) / 1000)
            const minutes = Math.floor(remaining / 60)
            const seconds = remaining % 60
            throw new Error(
              `Terlalu banyak percobaan gagal. Akun dikunci sementara. Silakan coba lagi dalam ${minutes} menit ${seconds} detik.`
            )
          }

          if (failedAttempt.remainingAttempts !== undefined && failedAttempt.remainingAttempts <= 2) {
            throw new Error(
              `Email atau password salah. ${failedAttempt.remainingAttempts} percobaan lagi sebelum akun dikunci sementara.`
            )
          }

          throw new Error('Email atau password salah')
        }

        // Clear login attempts on successful login
        await clearLoginAttempts(credentials.email)

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
      // Log OAuth sign-in attempts for debugging
      if (account?.provider === 'google') {
        logger.dev('Auth', 'Google OAuth sign-in attempt:', {
          email: user.email,
          provider: account.provider,
          hasProfile: !!profile
        })
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email ?? undefined
        // Check if user is admin
        token.isAdmin = await isAdminEmail(user.email as string)
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.isAdmin = token.isAdmin as boolean
        session.user.email = token.email as string
      }
      return session
    },
  },
  logger: {
    error(code, metadata) {
      logger.error('NextAuth Error:', code, metadata)
    },
    warn(code) {
      logger.dev('Auth', 'NextAuth Warning:', code)
    },
    debug(code, metadata) {
      logger.dev('Auth', 'NextAuth Debug:', code, metadata)
    },
  },
  debug: env.isDevelopment,
  events: {
    async createUser({ user }) {
      if (user.id) {
        await prisma.subscriptions.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            status: 'FREE',
            planType: 'FREE',
            updatedAt: new Date(),
          },
        }).catch(() => {
          // Ignore if subscription already exists
        })
      }
    },
  },
}
