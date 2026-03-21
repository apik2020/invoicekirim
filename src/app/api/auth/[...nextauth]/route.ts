import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const log = (...args: any[]) => console.log('[AUTH]', ...args)

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

const handler = NextAuth({
  providers: [
    // Credentials Provider
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
          log('Auth error:', error)
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email ?? undefined
        token.name = user.name ?? undefined
        token.image = user.image ?? undefined
        token.isAdmin = user.email ? await isAdminEmail(user.email) : false
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.image as string | null
        session.user.isAdmin = token.isAdmin as boolean
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
