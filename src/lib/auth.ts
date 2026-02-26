import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { checkLoginAttempts, recordFailedAttempt, clearLoginAttempts } from './login-attempts'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { subscription: true },
        })

        // Record failed attempt if user not found or no password
        if (!user || !user.password) {
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

        // Record failed attempt if password is invalid
        if (!isPasswordValid) {
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
        if (!user.subscription) {
          await prisma.subscription.create({
            data: {
              userId: user.id,
              status: 'FREE',
              planType: 'FREE',
            },
          })
        }

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
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
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
