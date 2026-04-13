import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import { prisma } from './prisma'

export interface ClientSession {
  id: string
  email: string
  name: string | null
  phone: string | null
}

const SESSION_SECRET = process.env.NEXTAUTH_SECRET || 'client-session-fallback-secret-change-me'

/**
 * Create a signed session token with HMAC
 * Format: base64(payload).base64(signature)
 */
export function createSignedSessionToken(payload: { clientId: string; email: string; exp: number }): string {
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64')
  const signature = createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64')
    .replace(/=+$/, '') // trim padding for cleaner token
  return `${payloadB64}.${signature}`
}

/**
 * Verify and decode a signed session token
 * Returns null if signature is invalid or token is expired
 */
function verifySignedToken(token: string): { clientId: string; email: string; exp: number } | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null

  const [payloadB64, providedSignature] = parts

  // Recompute signature
  const expectedSignature = createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64')
    .replace(/=+$/, '')

  // Timing-safe comparison to prevent timing attacks
  try {
    const providedBuf = Buffer.from(providedSignature)
    const expectedBuf = Buffer.from(expectedSignature)

    if (providedBuf.length !== expectedBuf.length) return null

    if (!timingSafeEqual(providedBuf, expectedBuf)) return null
  } catch {
    return null
  }

  // Decode payload
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString())

    // Check expiration
    if (payload.exp && payload.exp < Date.now()) return null

    return payload
  } catch {
    return null
  }
}

export async function getClientSession(): Promise<ClientSession | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('client_session')?.value

    if (!sessionToken) return null

    const decoded = verifySignedToken(sessionToken)
    if (!decoded) return null

    // Verify client exists in database
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
    const decoded = verifySignedToken(token)
    if (!decoded) return null

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
