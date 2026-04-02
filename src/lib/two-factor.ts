import { generateSecret as otpGenerateSecret, verifySync } from 'otplib'
import QRCode from 'qrcode'
import { prisma } from './prisma'
import { randomBytes, createHash } from 'crypto'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'NotaBener'

/**
 * Generate a new TOTP secret for a user
 */
export function generateTwoFactorSecret(email: string): {
  secret: string
  uri: string
} {
  const secret = otpGenerateSecret()
  // Construct URI manually for TOTP
  const uri = `otpauth://totp/${encodeURIComponent(APP_NAME)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(APP_NAME)}`

  return { secret, uri }
}

/**
 * Generate QR code as data URL from OTP URI
 */
export async function generateQRCode(uri: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(uri, {
      width: 300,
      margin: 2,
      color: {
        dark: '#276874', // Brand teal
        light: '#ffffff',
      },
    })
    return dataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Verify a TOTP code against a secret
 */
export function verifyTwoFactorCode(secret: string, code: string): boolean {
  try {
    // Use the synchronous verify function
    const result = verifySync({ secret, token: code })
    return result.valid
  } catch (error) {
    console.error('Error verifying 2FA code:', error)
    return false
  }
}

/**
 * Generate backup codes for 2FA
 * Returns 10 codes, each 8 characters long
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < 10; i++) {
    const code = randomBytes(4).toString('hex').toUpperCase()
    codes.push(code)
  }
  return codes
}

/**
 * Hash a backup code for storage
 */
export function hashBackupCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

/**
 * Verify a backup code against hashed codes
 */
export function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): { valid: boolean; remainingCodes: string[] } {
  const hashedInput = hashBackupCode(code.toUpperCase())
  const index = hashedCodes.indexOf(hashedInput)

  if (index === -1) {
    return { valid: false, remainingCodes: hashedCodes }
  }

  // Remove the used code
  const remainingCodes = [...hashedCodes.slice(0, index), ...hashedCodes.slice(index + 1)]
  return { valid: true, remainingCodes }
}

/**
 * Enable 2FA for a user
 */
export async function enableTwoFactor(
  userId: string,
  secret: string,
  backupCodes: string[]
): Promise<void> {
  const hashedCodes = backupCodes.map(hashBackupCode)

  await prisma.users.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      twoFactorBackupCodes: JSON.stringify(hashedCodes),
      twoFactorVerifiedAt: new Date(),
    },
  })
}

/**
 * Disable 2FA for a user
 */
export async function disableTwoFactor(userId: string): Promise<void> {
  await prisma.users.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
      twoFactorVerifiedAt: null,
    },
  })
}

/**
 * Check if user has 2FA enabled
 */
export async function isTwoFactorEnabled(userId: string): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  })
  return user?.twoFactorEnabled ?? false
}

/**
 * Get user's 2FA backup codes (hashed)
 */
export async function getTwoFactorBackupCodes(userId: string): Promise<string[] | null> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { twoFactorBackupCodes: true },
  })

  if (!user?.twoFactorBackupCodes) {
    return null
  }

  try {
    return JSON.parse(user.twoFactorBackupCodes)
  } catch {
    return null
  }
}

/**
 * Consume a backup code (remove it from the list)
 */
export async function consumeBackupCode(
  userId: string,
  code: string
): Promise<boolean> {
  const hashedCodes = await getTwoFactorBackupCodes(userId)
  if (!hashedCodes) {
    return false
  }

  const { valid, remainingCodes } = verifyBackupCode(code, hashedCodes)

  if (!valid) {
    return false
  }

  // Update the backup codes in the database
  await prisma.users.update({
    where: { id: userId },
    data: {
      twoFactorBackupCodes: JSON.stringify(remainingCodes),
    },
  })

  return true
}

/**
 * Verify 2FA code or backup code
 */
export async function verifyTwoFactor(
  userId: string,
  code: string
): Promise<{ success: boolean; isBackupCode: boolean }> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      twoFactorSecret: true,
      twoFactorBackupCodes: true,
    },
  })

  if (!user?.twoFactorSecret) {
    return { success: false, isBackupCode: false }
  }

  // First, try TOTP code
  if (verifyTwoFactorCode(user.twoFactorSecret, code)) {
    return { success: true, isBackupCode: false }
  }

  // If TOTP fails, try backup code
  const hashedCodes = await getTwoFactorBackupCodes(userId)
  if (hashedCodes && hashedCodes.length > 0) {
    const { valid } = verifyBackupCode(code, hashedCodes)
    if (valid) {
      // Remove the used backup code
      await consumeBackupCode(userId, code)
      return { success: true, isBackupCode: true }
    }
  }

  return { success: false, isBackupCode: false }
}
