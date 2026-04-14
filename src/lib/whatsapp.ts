/**
 * OpenWA WhatsApp Integration Client
 *
 * Connects to an OpenWA instance for automated WhatsApp messaging.
 * API docs: https://openwa.commitflow.space/docs
 *
 * Environment variables:
 * - OPENWA_BASE_URL: OpenWA instance URL (default: http://localhost:55111)
 * - OPENWA_API_KEY: API key for X-API-Key header auth
 * - OPENWA_SESSION_ID: WhatsApp session ID (default: "notabener")
 */

import { prisma } from './prisma'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OpenWAConfig {
  baseUrl: string
  apiKey: string
  sessionId: string
}

export interface SendMessageResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface HealthCheckResult {
  connected: boolean
  sessionId?: string
  phone?: string
  error?: string
}

// ─── Config ─────────────────────────────────────────────────────────────────

function getGlobalConfig(): OpenWAConfig {
  return {
    baseUrl: process.env.OPENWA_BASE_URL || 'http://localhost:55111',
    apiKey: process.env.OPENWA_API_KEY || '',
    sessionId: process.env.OPENWA_SESSION_ID || 'notabener',
  }
}

/**
 * Get user-level WhatsApp config (stored in DB settings).
 * Falls back to global env config if user hasn't configured their own.
 */
async function getUserConfig(userId: string): Promise<OpenWAConfig> {
  const globalConfig = getGlobalConfig()

  // In the future, per-user config could be stored in a settings table.
  // For now, all users share the global OpenWA instance.
  return globalConfig
}

// ─── Phone Number Formatting ────────────────────────────────────────────────

/**
 * Format a phone number for WhatsApp.
 * - Strips spaces, dashes, parens, plus sign
 * - Converts leading 0 to 62 (Indonesia)
 * - Returns digits only, suitable for OpenWA's phoneNumber field
 */
export function formatWhatsAppNumber(phone: string): string {
  // Strip non-digit characters except +
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '')

  // Remove leading +
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1)
  }

  // Convert leading 0 to country code 62 (Indonesia)
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1)
  }

  // Ensure it starts with a country code (at least 10 digits)
  if (cleaned.length < 10) {
    throw new Error(`Nomor WhatsApp tidak valid: ${phone}`)
  }

  return cleaned
}

// ─── OpenWA API Calls ───────────────────────────────────────────────────────

async function openwaRequest(
  config: OpenWAConfig,
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<Response> {
  const url = `${config.baseUrl}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (config.apiKey) {
    headers['X-API-Key'] = config.apiKey
  }

  return fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * Check OpenWA health/connection status
 */
export async function checkWhatsAppHealth(config?: OpenWAConfig): Promise<HealthCheckResult> {
  const cfg = config || getGlobalConfig()

  try {
    const res = await openwaRequest(cfg, 'GET', '/health')

    if (!res.ok) {
      return { connected: false, error: `Health check failed: HTTP ${res.status}` }
    }

    const data = await res.json()
    return {
      connected: data.status === 'ok' || data.connected === true,
      sessionId: cfg.sessionId,
      phone: data.phone || data.phoneNumber,
    }
  } catch (err: any) {
    return {
      connected: false,
      error: err.message || 'Tidak dapat terhubung ke OpenWA',
    }
  }
}

/**
 * Send a text message via WhatsApp
 */
export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string,
  config?: OpenWAConfig
): Promise<SendMessageResult> {
  const cfg = config || getGlobalConfig()

  if (!cfg.apiKey) {
    return { success: false, error: 'OPENWA_API_KEY belum dikonfigurasi' }
  }

  try {
    const formattedPhone = formatWhatsAppNumber(phoneNumber)

    const res = await openwaRequest(cfg, 'POST', '/api/messages/send', {
      sessionId: cfg.sessionId,
      phoneNumber: formattedPhone,
      body: message,
      type: 'text',
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.message || errorData.error || `HTTP ${res.status}`,
      }
    }

    const data = await res.json()
    return {
      success: true,
      messageId: data.messageId || data.id,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Gagal mengirim pesan WhatsApp',
    }
  }
}

/**
 * Send an image with caption via WhatsApp
 */
export async function sendWhatsAppImage(
  phoneNumber: string,
  imageUrl: string,
  caption?: string,
  config?: OpenWAConfig
): Promise<SendMessageResult> {
  const cfg = config || getGlobalConfig()

  if (!cfg.apiKey) {
    return { success: false, error: 'OPENWA_API_KEY belum dikonfigurasi' }
  }

  try {
    const formattedPhone = formatWhatsAppNumber(phoneNumber)

    const res = await openwaRequest(cfg, 'POST', '/api/messages/send', {
      sessionId: cfg.sessionId,
      phoneNumber: formattedPhone,
      mediaUrl: imageUrl,
      caption: caption || '',
      type: 'image',
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.message || errorData.error || `HTTP ${res.status}`,
      }
    }

    const data = await res.json()
    return {
      success: true,
      messageId: data.messageId || data.id,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Gagal mengirim gambar WhatsApp',
    }
  }
}

// ─── Invoice-Specific Helpers ───────────────────────────────────────────────

interface InvoiceMessageData {
  invoiceNumber: string
  clientName: string
  companyName: string | null
  total: string
  dueDate: string
  paymentStatus: string
  invoiceUrl: string
}

/**
 * Build invoice notification message text
 */
export function buildInvoiceMessage(data: InvoiceMessageData): string {
  return `*INVOICE ${data.invoiceNumber}*

Halo ${data.clientName},

${data.companyName || 'NotaBener'} telah mengirimkan invoice kepada Anda. Berikut detail invoice:

💰 *Total:* ${data.total}
📅 *Jatuh Tempo:* ${data.dueDate}
✅ *Status Pembayaran:* ${data.paymentStatus}

📄 Lihat Invoice:
${data.invoiceUrl}

Terima kasih!`
}

/**
 * Build payment reminder message text
 */
export function buildReminderMessage(data: InvoiceMessageData & { daysUntilDue?: number; daysOverdue?: number }): string {
  const urgencyPrefix = data.daysOverdue && data.daysOverdue > 0
    ? `⚠️ *REMINDER: Invoice Jatuh Tempo ${data.daysOverdue} hari yang lalu*\n\n`
    : data.daysUntilDue !== undefined && data.daysUntilDue <= 3
      ? `⏰ *Reminder: Invoice jatuh tempo dalam ${data.daysUntilDue} hari*\n\n`
      : `📋 *Reminder Invoice*\n\n`

  return `${urgencyPrefix}Halo ${data.clientName},

Ini adalah reminder untuk invoice berikut:

📄 *Invoice:* ${data.invoiceNumber}
💰 *Total:* ${data.total}
📅 *Jatuh Tempo:* ${data.dueDate}
✅ *Status:* ${data.paymentStatus}

Lihat & bayar invoice:
${data.invoiceUrl}

Mohon segera lakukan pembayaran. Terima kasih!`
}

/**
 * Build payment confirmation message
 */
export function buildPaymentConfirmedMessage(data: {
  invoiceNumber: string
  clientName: string
  companyName: string | null
  total: string
  paidAt: string
  invoiceUrl: string
}): string {
  return `✅ *Pembayaran Dikonfirmasi*

Halo ${data.clientName},

Pembayaran untuk invoice berikut telah kami terima:

📄 *Invoice:* ${data.invoiceNumber}
💰 *Total:* ${data.total}
📅 *Dibayar pada:* ${data.paidAt}

Terima kasih atas pembayaran Anda!

Lihat invoice:
${data.invoiceUrl}`
}
