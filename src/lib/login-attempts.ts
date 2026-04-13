import { prisma } from './prisma'

export interface LoginAttempt {
  success: boolean
  remainingAttempts?: number
  lockoutUntil?: Date
}

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
const ATTEMPT_WINDOW = 15 * 60 * 1000 // 15 minutes

// In-memory store — used as fallback when DB is unavailable
const memoryStore = new Map<string, { count: number; lastAttempt: number; lockUntil?: number }>()

/**
 * Get a unique key for rate limiting (supports both email and IP)
 */
function getStoreKey(identifier: string): string {
  return `login_attempt:${identifier}`
}

/**
 * Check if login attempts should be rate limited
 * Uses database-backed storage with in-memory fallback
 */
export async function checkLoginAttempts(identifier: string): Promise<LoginAttempt> {
  const now = Date.now()

  // Try database-backed check first for multi-instance support
  if (prisma) {
    try {
      const log = await prisma.activity_logs.findFirst({
        where: {
          action: 'UPDATED',
          entityType: 'rate_limit',
          entityId: identifier,
        },
        orderBy: { createdAt: 'desc' },
      })

      if (log) {
        const data = log.metadata as { count: number; lastAttempt: number; lockUntil?: number } | null
        if (data?.lockUntil && now < data.lockUntil) {
          return {
            success: false,
            lockoutUntil: new Date(data.lockUntil),
          }
        }

        // Reset if window has passed
        if (data && now - data.lastAttempt > ATTEMPT_WINDOW) {
          return { success: true }
        }

        if (data && data.count >= MAX_ATTEMPTS && now < (data.lockUntil || 0)) {
          return {
            success: false,
            lockoutUntil: new Date(data.lockUntil!),
          }
        }
      }

      return { success: true }
    } catch (dbError) {
      console.warn('[LoginAttempts] DB lookup failed, using memory fallback:', dbError)
    }
  }

  // Fallback to in-memory store
  const attempts = memoryStore.get(identifier)

  if (attempts?.lockUntil && now < attempts.lockUntil) {
    return {
      success: false,
      lockoutUntil: new Date(attempts.lockUntil),
    }
  }

  if (attempts && now - attempts.lastAttempt > ATTEMPT_WINDOW) {
    memoryStore.delete(identifier)
  }

  return { success: true }
}

/**
 * Record a failed login attempt
 * Persists to database for multi-instance durability
 */
export async function recordFailedAttempt(identifier: string): Promise<LoginAttempt> {
  const now = Date.now()
  const key = getStoreKey(identifier)

  // Try database-backed recording
  if (prisma) {
    try {
      const existing = await prisma.activity_logs.findFirst({
        where: {
          action: 'UPDATED',
          entityType: 'rate_limit',
          entityId: identifier,
        },
        orderBy: { createdAt: 'desc' },
      })

      const data = existing?.metadata as { count: number; lastAttempt: number; lockUntil?: number } | null
      let count = 1
      let lastAttempt = now

      if (data && now - data.lastAttempt <= ATTEMPT_WINDOW) {
        count = data.count + 1
        lastAttempt = now
      }

      const shouldLock = count >= MAX_ATTEMPTS
      const lockUntil = shouldLock ? now + LOCKOUT_DURATION : undefined

      // Upsert the tracking record
      if (existing) {
        await prisma.activity_logs.update({
          where: { id: existing.id },
          data: {
            metadata: { count, lastAttempt, lockUntil },
            createdAt: new Date(),
          },
        })
      } else {
        await prisma.activity_logs.create({
          data: {
            id: crypto.randomUUID(),
            userId: 'system',
            action: 'UPDATED',
            entityType: 'rate_limit',
            entityId: identifier,
            title: `Login attempt tracking: ${identifier}`,
            metadata: { count, lastAttempt, lockUntil },
          },
        })
      }

      if (shouldLock) {
        return {
          success: false,
          remainingAttempts: 0,
          lockoutUntil: new Date(lockUntil!),
        }
      }

      return {
        success: false,
        remainingAttempts: MAX_ATTEMPTS - count,
      }
    } catch (dbError) {
      console.warn('[LoginAttempts] DB write failed, using memory fallback:', dbError)
    }
  }

  // Fallback to in-memory store
  const attempts = memoryStore.get(identifier) || { count: 0, lastAttempt: now }

  if (now - attempts.lastAttempt > ATTEMPT_WINDOW) {
    attempts.count = 0
  }

  attempts.count++
  attempts.lastAttempt = now

  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockUntil = now + LOCKOUT_DURATION
    memoryStore.set(identifier, attempts)
    return {
      success: false,
      remainingAttempts: 0,
      lockoutUntil: new Date(attempts.lockUntil),
    }
  }

  memoryStore.set(identifier, attempts)
  return {
    success: false,
    remainingAttempts: MAX_ATTEMPTS - attempts.count,
  }
}

/**
 * Clear login attempts on successful login
 */
export async function clearLoginAttempts(identifier: string): Promise<void> {
  // Clear from database
  if (prisma) {
    try {
      await prisma.activity_logs.deleteMany({
        where: {
          action: 'UPDATED',
          entityType: 'rate_limit',
          entityId: identifier,
        },
      })
    } catch {
      // Non-critical — memory store will also be cleared
    }
  }

  // Clear from memory
  memoryStore.delete(identifier)
}

/**
 * Get remaining time in lockout (in seconds)
 */
export function getLockoutRemaining(identifier: string): number {
  const attempts = memoryStore.get(identifier)
  if (!attempts?.lockUntil) return 0

  const remaining = Math.ceil((attempts.lockUntil - Date.now()) / 1000)
  return Math.max(0, remaining)
}
