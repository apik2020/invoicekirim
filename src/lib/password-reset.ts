import crypto from 'crypto'
import { prisma } from './prisma'

const RESET_TOKEN_EXPIRY = 60 * 60 * 1000 // 1 hour in milliseconds

/**
 * Generate a secure random token for password reset
 * Uses crypto.randomBytes for cryptographic security
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Create a password reset token for a user
 * - Deletes any existing tokens for this email first
 * - Creates a new token with 1 hour expiry
 */
export async function createPasswordResetToken(email: string): Promise<{ token: string; email: string }> {
  const token = generateResetToken()
  const expires = new Date(Date.now() + RESET_TOKEN_EXPIRY)

  // Delete any existing reset tokens for this email
  await prisma.verification_tokens.deleteMany({
    where: {
      identifier: email,
    },
  })

  // Create new reset token
  await prisma.verification_tokens.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  })

  return { token, email }
}

/**
 * Verify a password reset token
 * Returns the email if valid, null if invalid or expired
 */
export async function verifyResetToken(token: string): Promise<string | null> {
  const resetToken = await prisma.verification_tokens.findUnique({
    where: { token },
  })

  // Token not found
  if (!resetToken) {
    return null
  }

  // Token expired
  if (resetToken.expires < new Date()) {
    // Delete expired token
    await prisma.verification_tokens.delete({
      where: { token },
    })
    return null
  }

  return resetToken.identifier
}

/**
 * Delete a used reset token
 */
export async function deleteResetToken(token: string): Promise<void> {
  await prisma.verification_tokens.delete({
    where: { token },
  }).catch(() => {
    // Ignore error if token doesn't exist
  })
}

/**
 * Check if user exists by email
 */
export async function findUserByEmail(email: string) {
  return prisma.users.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
    },
  })
}

/**
 * Update user password
 */
export async function updateUserPassword(email: string, hashedPassword: string): Promise<void> {
  await prisma.users.update({
    where: { email },
    data: {
      password: hashedPassword,
      updatedAt: new Date(),
    },
  })
}
