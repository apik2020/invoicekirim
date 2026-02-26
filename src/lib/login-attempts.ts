import { prisma } from './prisma'

export interface LoginAttempt {
  success: boolean
  remainingAttempts?: number
  lockoutUntil?: Date
}

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
const ATTEMPT_WINDOW = 15 * 60 * 1000 // 15 minutes

// In-memory store for development (use Redis in production)
const attemptStore = new Map<string, { count: number; lastAttempt: number; lockUntil?: number }>()

/**
 * Check if login attempts should be rate limited
 * @param identifier - Email or IP address
 * @returns Login attempt info
 */
export async function checkLoginAttempts(identifier: string): Promise<LoginAttempt> {
  // For development, use in-memory store
  // In production, use Redis or database
  const now = Date.now()
  const attempts = attemptStore.get(identifier)

  // Check if currently locked out
  if (attempts?.lockUntil && now < attempts.lockUntil) {
    return {
      success: false,
      lockoutUntil: new Date(attempts.lockUntil),
    }
  }

  // Reset if window has passed
  if (attempts && now - attempts.lastAttempt > ATTEMPT_WINDOW) {
    attemptStore.delete(identifier)
  }

  return { success: true }
}

/**
 * Record a failed login attempt
 * @param identifier - Email or IP address
 * @returns Updated attempt info
 */
export async function recordFailedAttempt(identifier: string): Promise<LoginAttempt> {
  const now = Date.now()
  const attempts = attemptStore.get(identifier) || { count: 0, lastAttempt: now }

  // Reset if window has passed
  if (now - attempts.lastAttempt > ATTEMPT_WINDOW) {
    attempts.count = 0
  }

  attempts.count++
  attempts.lastAttempt = now

  // Check if should lock out
  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockUntil = now + LOCKOUT_DURATION
    attemptStore.set(identifier, attempts)

    return {
      success: false,
      remainingAttempts: 0,
      lockoutUntil: new Date(attempts.lockUntil),
    }
  }

  attemptStore.set(identifier, attempts)

  return {
    success: false,
    remainingAttempts: MAX_ATTEMPTS - attempts.count,
  }
}

/**
 * Clear login attempts on successful login
 * @param identifier - Email or IP address
 */
export async function clearLoginAttempts(identifier: string): Promise<void> {
  attemptStore.delete(identifier)
}

/**
 * Get remaining time in lockout (in seconds)
 * @param identifier - Email or IP address
 */
export function getLockoutRemaining(identifier: string): number {
  const attempts = attemptStore.get(identifier)
  if (!attempts?.lockUntil) return 0

  const remaining = Math.ceil((attempts.lockUntil - Date.now()) / 1000)
  return Math.max(0, remaining)
}
