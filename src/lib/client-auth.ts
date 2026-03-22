import { cookies } from 'next/headers'
import { prisma } from './prisma'

export interface ClientSession {
  id: string
  email: string
  name: string
  phone: string | null
}

export async function getClientSession(): Promise<ClientSession | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('client_session')?.value

    if (!sessionToken) {
      return null
    }

    const decoded = JSON.parse(Buffer.from(sessionToken, 'base64').toString())

    // Check expiration
    if (decoded.exp && decoded.exp < Date.now()) {
      return null
    }

    // Verify client exists
    const client = await prisma.client_accounts.findUnique({
      where: { id: decoded.clientId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
      },
    })

    return client
  } catch (error) {
    console.error('Get client session error:', error)
    return null
  }
}

export async function getClientFromToken(token: string): Promise<ClientSession | null> {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())

    // Check expiration
    if (decoded.exp && decoded.exp < Date.now()) {
      return null
    }

    const client = await prisma.client_accounts.findUnique({
      where: { id: decoded.clientId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
      },
    })

    return client
  } catch (error) {
    console.error('Get client from token error:', error)
    return null
  }
}
