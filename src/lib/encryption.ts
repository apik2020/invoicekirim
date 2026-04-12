import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16

/**
 * Get the encryption key from environment, padded/truncated to exactly 32 bytes
 */
function getKey(): Buffer {
  const envKey = process.env.EMAIL_ENCRYPTION_KEY
  if (!envKey) {
    // Fallback: derive key from NEXTAUTH_SECRET if EMAIL_ENCRYPTION_KEY not set
    const fallback = process.env.NEXTAUTH_SECRET || 'notabener-encryption-key-fallback'
    return crypto.createHash('sha256').update(fallback).digest()
  }
  // Ensure key is exactly 32 bytes for AES-256
  return Buffer.from(envKey.padEnd(32, '0').slice(0, 32), 'utf8')
}

/**
 * Encrypt a plaintext string using AES-256-CBC.
 * Returns a base64 string in format: IV:ciphertext
 */
export function encrypt(text: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  return iv.toString('base64') + ':' + encrypted
}

/**
 * Decrypt an AES-256-CBC encrypted string.
 * Accepts format: IV:ciphertext (base64)
 * Falls back to returning original string if decryption fails (for backward compat with plaintext passwords)
 */
export function decrypt(encrypted: string): string {
  if (!encrypted) return encrypted

  // If it doesn't contain a colon, it's likely plaintext (backward compat)
  if (!encrypted.includes(':')) {
    return encrypted
  }

  try {
    const key = getKey()
    const parts = encrypted.split(':')
    if (parts.length !== 2) return encrypted

    const iv = Buffer.from(parts[0], 'base64')
    const ciphertext = parts[1]

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)

    let decrypted = decipher.update(ciphertext, 'base64', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch {
    // If decryption fails, assume it's plaintext (backward compat)
    return encrypted
  }
}

/**
 * Check if a string looks like an encrypted value (IV:ciphertext format)
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false
  const parts = value.split(':')
  if (parts.length !== 2) return false
  // Check if first part is valid base64 and 16 bytes when decoded
  try {
    const iv = Buffer.from(parts[0], 'base64')
    return iv.length === IV_LENGTH
  } catch {
    return false
  }
}
