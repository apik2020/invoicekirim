import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import crypto from 'crypto'

export interface ApiKeyWithPrefix {
  id: string
  name: string
  prefix: string
  scopes: string[]
  isActive: boolean
  lastUsedAt: Date | null
  expiresAt: Date | null
  createdAt: Date
}

export interface CreateApiKeyResult {
  id: string
  name: string
  key: string // Full key - only shown once
  prefix: string
}

// Available API scopes
export const API_SCOPES = {
  // Invoice scopes
  'invoices:read': 'View invoices',
  'invoices:write': 'Create and update invoices',
  'invoices:delete': 'Delete invoices',

  // Client scopes
  'clients:read': 'View clients',
  'clients:write': 'Create and update clients',
  'clients:delete': 'Delete clients',

  // Template scopes
  'templates:read': 'View templates',
  'templates:write': 'Create and update templates',
  'templates:delete': 'Delete templates',

  // Item scopes
  'items:read': 'View items',
  'items:write': 'Create and update items',
  'items:delete': 'Delete items',

  // Payment scopes
  'payments:read': 'View payments',
  'payments:write': 'Create payments',

  // Webhook scopes
  'webhooks:read': 'View webhooks',
  'webhooks:write': 'Create and update webhooks',
  'webhooks:delete': 'Delete webhooks',

  // Analytics scopes
  'analytics:read': 'View analytics',
} as const

export type ApiScope = keyof typeof API_SCOPES

/**
 * Generate a new API key
 */
export function generateApiKey(): { key: string; hashedKey: string; prefix: string } {
  // Generate a random key
  const rawKey = nanoid(32)
  const prefix = `ik_${rawKey.slice(0, 8)}`

  // Create full key with prefix
  const key = `ik_live_${rawKey}`

  // Hash the key for storage
  const hashedKey = hashApiKey(key)

  return { key, hashedKey, prefix }
}

/**
 * Hash an API key for secure storage
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

/**
 * Verify an API key
 */
export async function verifyApiKey(
  key: string
): Promise<{ valid: boolean; apiKey?: { id: string; userId?: string; teamId?: string; scopes: string[] } }> {
  if (!key || !key.startsWith('ik_')) {
    return { valid: false }
  }

  const hashedKey = hashApiKey(key)

  const apiKey = await prisma.apiKey.findUnique({
    where: { key: hashedKey },
    select: {
      id: true,
      userId: true,
      teamId: true,
      scopes: true,
      isActive: true,
      expiresAt: true,
    },
  })

  if (!apiKey || !apiKey.isActive) {
    return { valid: false }
  }

  // Check expiration
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false }
  }

  // Update last used
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  })

  return {
    valid: true,
    apiKey: {
      id: apiKey.id,
      userId: apiKey.userId || undefined,
      teamId: apiKey.teamId || undefined,
      scopes: apiKey.scopes as string[] || [],
    },
  }
}

/**
 * Create a new API key for a user or team
 */
export async function createApiKey(
  params: {
    name: string
    userId?: string
    teamId?: string
    scopes?: string[]
    expiresAt?: Date
  }
): Promise<CreateApiKeyResult> {
  const { key, hashedKey, prefix } = generateApiKey()

  const apiKey = await prisma.apiKey.create({
    data: {
      name: params.name,
      key: hashedKey,
      prefix,
      userId: params.userId,
      teamId: params.teamId,
      scopes: params.scopes || Object.keys(API_SCOPES),
      expiresAt: params.expiresAt,
      isActive: true,
    },
  })

  return {
    id: apiKey.id,
    name: apiKey.name,
    key, // Full key - only returned on creation
    prefix,
  }
}

/**
 * List API keys for a user or team
 */
export async function listApiKeys(params: {
  userId?: string
  teamId?: string
}): Promise<ApiKeyWithPrefix[]> {
  const where: { userId?: string; teamId?: string } = {}
  if (params.userId) where.userId = params.userId
  if (params.teamId) where.teamId = params.teamId

  const keys = await prisma.apiKey.findMany({
    where,
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      isActive: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return keys.map((k) => ({
    id: k.id,
    name: k.name,
    prefix: k.prefix,
    scopes: k.scopes as string[] || [],
    isActive: k.isActive,
    lastUsedAt: k.lastUsedAt,
    expiresAt: k.expiresAt,
    createdAt: k.createdAt,
  }))
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(keyId: string, params: {
  userId?: string
  teamId?: string
}): Promise<boolean> {
  const where: { id: string; userId?: string; teamId?: string } = { id: keyId }
  if (params.userId) where.userId = params.userId
  if (params.teamId) where.teamId = params.teamId

  const result = await prisma.apiKey.updateMany({
    where,
    data: { isActive: false },
  })

  return result.count > 0
}

/**
 * Delete an API key
 */
export async function deleteApiKey(keyId: string, params: {
  userId?: string
  teamId?: string
}): Promise<boolean> {
  const where: { id: string; userId?: string; teamId?: string } = { id: keyId }
  if (params.userId) where.userId = params.userId
  if (params.teamId) where.teamId = params.teamId

  const result = await prisma.apiKey.deleteMany({
    where,
  })

  return result.count > 0
}
