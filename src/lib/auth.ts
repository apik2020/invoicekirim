import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { checkLoginAttempts, recordFailedAttempt, clearLoginAttempts } from './login-attempts'
import { env } from './env'

// Helper to check if user is admin
async function isAdminEmail(email: string): Promise<boolean> {
  try {
    const admin = await prisma.admin.findUnique({
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
      })
    ] : []),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('🔐 Login attempt:', credentials?.email)

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing email or password')
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
        console.log('🔍 Checking Admin table for:', credentials.email)
        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
          },
        })

        console.log('📋 Admin found:', !!admin)

        if (admin && admin.password) {
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            admin.password
          )

          console.log('🔑 Admin password valid:', isPasswordValid)

          if (isPasswordValid) {
            await clearLoginAttempts(credentials.email)
            console.log('✅ Admin login successful')
            return {
              id: admin.id,
              email: admin.email,
              name: admin.name,
            }
          }
        }

        // Check User table
        console.log('🔍 Checking User table for:', credentials.email)
        let user
        try {
          user = await prisma.user.findUnique({
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
          console.error('❌ Database error:', error)
          throw new Error('Database error')
        }

        console.log('📋 User found:', !!user, 'Has password:', !!user?.password)

        // Get subscription separately to avoid potential errors
        let subscription = null
        if (user) {
          try {
            subscription = await prisma.subscription.findUnique({
              where: { userId: user.id },
            })
          } catch (error) {
            console.error('❌ Subscription query error:', error)
            // Continue without subscription
          }
        }

        // Record failed attempt if user not found or no password
        if (!user || !user.password) {
          console.log('❌ User not found or no password')
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

        console.log('🔑 User password valid:', isPasswordValid)

        // Record failed attempt if password is invalid
        if (!isPasswordValid) {
          console.log('❌ Invalid password')
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
            await prisma.subscription.create({
              data: {
                userId: user.id,
                status: 'FREE',
                planType: 'FREE',
              },
            })
          } catch (error) {
            console.error('❌ Failed to create subscription:', error)
            // Continue anyway
          }
        }

        console.log('✅ User login successful')
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
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
  events: {
    async createUser({ user }) {
      if (user.id) {
        await prisma.subscription.create({
          data: {
            userId: user.id,
            status: 'FREE',
            planType: 'FREE',
          },
        }).catch(() => {
          // Ignore if subscription already exists
        })
      }
    },
  },
}
