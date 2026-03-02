import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Available webhook events
export const WEBHOOK_EVENTS = {
  // Invoice events
  'invoice.created': 'Invoice created',
  'invoice.updated': 'Invoice updated',
  'invoice.sent': 'Invoice sent',
  'invoice.paid': 'Invoice paid',
  'invoice.overdue': 'Invoice overdue',
  'invoice.canceled': 'Invoice canceled',
  'invoice.viewed': 'Invoice viewed by client',

  // Payment events
  'payment.created': 'Payment created',
  'payment.completed': 'Payment completed',
  'payment.failed': 'Payment failed',
  'payment.refunded': 'Payment refunded',

  // Client events
  'client.created': 'Client created',
  'client.updated': 'Client updated',
  'client.deleted': 'Client deleted',

  // Team events
  'team.member.added': 'Team member added',
  'team.member.removed': 'Team member removed',
} as const

export type WebhookEvent = keyof typeof WEBHOOK_EVENTS

export interface WebhookPayload {
  id: string
  event: WebhookEvent
  timestamp: string
  data: Record<string, unknown>
  teamId: string
}

/**
 * Generate a webhook secret for signature verification
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Create a webhook signature
 */
export function createWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Verify a webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createWebhookSignature(payload, secret)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Create a new webhook
 */
export async function createWebhook(params: {
  teamId: string
  name: string
  url: string
  events: string[]
}): Promise<{ id: string; name: string; url: string; secret: string; events: string[] }> {
  const secret = generateWebhookSecret()

  const webhook = await prisma.webhook.create({
    data: {
      teamId: params.teamId,
      name: params.name,
      url: params.url,
      secret,
      events: params.events,
      isActive: true,
    },
  })

  return {
    id: webhook.id,
    name: webhook.name,
    url: webhook.url,
    secret, // Only returned on creation
    events: webhook.events as string[],
  }
}

/**
 * List webhooks for a team
 */
export async function listWebhooks(teamId: string) {
  const webhooks = await prisma.webhook.findMany({
    where: { teamId },
    select: {
      id: true,
      name: true,
      url: true,
      events: true,
      isActive: true,
      lastTriggered: true,
      failureCount: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return webhooks.map((w) => ({
    ...w,
    events: w.events as string[],
  }))
}

/**
 * Update a webhook
 */
export async function updateWebhook(
  webhookId: string,
  teamId: string,
  params: {
    name?: string
    url?: string
    events?: string[]
    isActive?: boolean
  }
) {
  const webhook = await prisma.webhook.updateMany({
    where: { id: webhookId, teamId },
    data: params,
  })

  return webhook.count > 0
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(webhookId: string, teamId: string): Promise<boolean> {
  const result = await prisma.webhook.deleteMany({
    where: { id: webhookId, teamId },
  })

  return result.count > 0
}

/**
 * Trigger webhooks for an event
 */
export async function triggerWebhooks(
  teamId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  // Find all webhooks that listen to this event
  const allWebhooks = await prisma.webhook.findMany({
    where: {
      teamId,
      isActive: true,
    },
  })

  // Filter webhooks that listen to this event
  const webhooks = allWebhooks.filter((w) => {
    const events = w.events as string[]
    return events.includes(event)
  })

  if (webhooks.length === 0) {
    return
  }

  const payload: WebhookPayload = {
    id: crypto.randomUUID(),
    event,
    timestamp: new Date().toISOString(),
    data,
    teamId,
  }

  const payloadString = JSON.stringify(payload)

  // Send to all webhooks (fire and forget, but track failures)
  await Promise.allSettled(
    webhooks.map(async (webhook) => {
      try {
        const signature = createWebhookSignature(payloadString, webhook.secret)

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event,
            'X-Webhook-ID': payload.id,
          },
          body: payloadString,
        })

        if (!response.ok) {
          throw new Error(`Webhook failed with status ${response.status}`)
        }

        // Update last triggered and reset failure count
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            lastTriggered: new Date(),
            failureCount: 0,
          },
        })
      } catch (error) {
        console.error(`Webhook ${webhook.id} failed:`, error)

        // Increment failure count
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            failureCount: { increment: 1 },
          },
        })

        // Disable webhook if too many failures
        if (webhook.failureCount >= 9) {
          await prisma.webhook.update({
            where: { id: webhook.id },
            data: { isActive: false },
          })
        }
      }
    })
  )
}

/**
 * Rotate webhook secret
 */
export async function rotateWebhookSecret(
  webhookId: string,
  teamId: string
): Promise<string | null> {
  const newSecret = generateWebhookSecret()

  const result = await prisma.webhook.updateMany({
    where: { id: webhookId, teamId },
    data: { secret: newSecret },
  })

  return result.count > 0 ? newSecret : null
}
