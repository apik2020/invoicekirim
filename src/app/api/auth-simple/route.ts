import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[AUTH-SIMPLE] Login attempt:', credentials?.email)
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        // Simple test - always return a user
        return {
          id: 'test-id',
          email: credentials.email,
          name: 'Test User',
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'test-secret-key-minimum-32-characters',
})

export { handler as GET, handler as POST }
