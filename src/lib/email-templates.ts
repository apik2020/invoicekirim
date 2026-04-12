import { prisma } from './prisma'
import { emailTemplates } from './email'

export type TemplateName =
  | 'INVOICE_SENT'
  | 'PAYMENT_REMINDER'
  | 'OVERDUE_NOTICE'
  | 'PAYMENT_CONFIRMATION'
  | 'WELCOME_EMAIL'

export interface ResolvedEmail {
  subject: string
  html: string
}

/**
 * Replace {{variable}} placeholders in a template string
 */
function replaceVariables(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] ?? match)
}

/**
 * Check if a string is a full HTML document (has <html> or <!DOCTYPE>)
 */
function isFullHtml(html: string): boolean {
  const trimmed = html.trim().toLowerCase()
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')
}

/**
 * Wrap partial HTML content in the standard NotaBener email shell
 */
function wrapInEmailShell(
  body: string,
  options?: {
    headerImageUrl?: string | null
    logoUrl?: string | null
    primaryColor?: string | null
  }
): string {
  const primary = options?.primaryColor || '#F97316'
  const deepTeal = '#0A637D'

  const logoBlock = options?.logoUrl
    ? `<div style="text-align: center; margin-bottom: 30px;">
         <img src="${options.logoUrl}" alt="Logo" style="max-height: 60px; border-radius: 8px;" />
       </div>`
    : `<div style="text-align: center; margin-bottom: 40px;">
         <div style="width: 60px; height: 60px; background: linear-gradient(145deg, ${deepTeal}, #2d7d8a); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
           <img src="https://notabener.com/images/notabener-icon-admin.png" alt="NotaBener" width="48" height="48" style="border-radius: 12px;" />
         </div>
         <h1 style="color: ${deepTeal}; font-size: 24px; font-weight: bold; margin: 0;">NotaBener</h1>
         <p style="color: #64748b; margin: 8px 0 0;">Platform Invoice untuk Freelancer</p>
       </div>`

  const headerImageBlock = options?.headerImageUrl
    ? `<div style="text-align: center; margin-bottom: 20px;">
         <img src="${options.headerImageUrl}" alt="Header" style="max-width: 100%; border-radius: 12px;" />
       </div>`
    : ''

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f7f7f7; }
    </style>
  </head>
  <body>
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      ${logoBlock}
      ${headerImageBlock}
      ${body}
      <!-- Footer -->
      <div style="text-align: center; margin-top: 40px; color: #94a3b8; font-size: 14px;">
        <p style="margin: 0 0 8px;">Invoice dibuat dengan NotaBener</p>
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} NotaBener. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`
}

/**
 * Build fallback data from a flat variables map for the hardcoded templates.
 * This converts the generic variables back into the named arguments each template function expects.
 */
function buildFallbackData(templateName: TemplateName, vars: Record<string, string>) {
  const base = {
    invoiceNumber: vars.invoiceNumber || '',
    clientName: vars.clientName || '',
    companyName: vars.companyName || '',
    total: vars.amount || vars.total || '',
  }

  switch (templateName) {
    case 'INVOICE_SENT':
      return {
        ...base,
        dueDate: vars.dueDate || '',
        invoiceUrl: vars.invoiceUrl || '#',
      }
    case 'PAYMENT_REMINDER':
      return {
        ...base,
        dueDate: vars.dueDate || '',
        daysUntilDue: parseInt(vars.daysUntilDue || '3'),
        invoiceUrl: vars.invoiceUrl || '#',
      }
    case 'OVERDUE_NOTICE':
      return {
        ...base,
        dueDate: vars.dueDate || '',
        daysOverdue: parseInt(vars.daysOverdue || '1'),
        invoiceUrl: vars.invoiceUrl || '#',
      }
    case 'PAYMENT_CONFIRMATION':
      return {
        ...base,
        paidDate: vars.paidDate || '',
      }
    default:
      return base
  }
}

/**
 * Resolve an email template from the database, falling back to hardcoded templates.
 *
 * @param templateName - One of the predefined template types
 * @param variables - Flat map of variable name → value for {{replacement}}
 * @param options - userId or teamId for branding lookup
 */
export async function resolveEmailTemplate(
  templateName: TemplateName,
  variables: Record<string, string>,
  options?: {
    userId?: string
    teamId?: string
  }
): Promise<ResolvedEmail> {
  // 1. Try to find an active template in the database
  const dbTemplate = await prisma.email_templates.findFirst({
    where: { name: templateName, isActive: true },
  })

  // 2. Resolve branding for logoUrl
  let logoUrl: string | null = null
  let primaryColor: string | null = null
  const teamId = options?.teamId

  if (teamId) {
    const branding = await prisma.branding.findUnique({
      where: { teamId },
      select: { logoUrl: true, showLogo: true, primaryColor: true, showColors: true },
    })
    if (branding?.showLogo && branding.logoUrl) {
      logoUrl = branding.logoUrl
    }
    if (branding?.showColors && branding.primaryColor) {
      primaryColor = branding.primaryColor
    }
  }

  // 3. If database template exists, use it
  if (dbTemplate) {
    // Build final variables with auto-injected ones
    const finalVars: Record<string, string> = {
      ...variables,
      logoUrl: logoUrl || '',
      headerImageUrl: dbTemplate.headerImageUrl || '',
    }

    let subject = replaceVariables(dbTemplate.subject, finalVars)
    let body = replaceVariables(dbTemplate.body, finalVars)

    // If body is partial HTML, wrap in email shell
    if (!isFullHtml(body)) {
      body = wrapInEmailShell(body, {
        headerImageUrl: dbTemplate.headerImageUrl,
        logoUrl,
        primaryColor,
      })
    }

    return { subject, html: body }
  }

  // 4. Fall back to hardcoded templates from email.ts
  const fallbackData = buildFallbackData(templateName, variables)

  switch (templateName) {
    case 'INVOICE_SENT': {
      const t = emailTemplates.invoiceSent(fallbackData as any)
      return { subject: t.subject, html: t.html }
    }
    case 'PAYMENT_REMINDER': {
      const t = emailTemplates.paymentReminder(fallbackData as any)
      return { subject: t.subject, html: t.html }
    }
    case 'OVERDUE_NOTICE': {
      const t = emailTemplates.invoiceOverdue(fallbackData as any)
      return { subject: t.subject, html: t.html }
    }
    case 'PAYMENT_CONFIRMATION': {
      const t = emailTemplates.invoicePaid(fallbackData as any)
      return { subject: t.subject, html: t.html }
    }
    default: {
      // WELCOME_EMAIL or unknown — minimal fallback
      return {
        subject: variables.subject || 'Email dari NotaBener',
        html: wrapInEmailShell(
          `<div style="background: white; border-radius: 20px; padding: 40px;">
            <p style="color: #334155; line-height: 1.6;">${variables.message || 'Terima kasih telah menggunakan NotaBener.'}</p>
          </div>`,
          { logoUrl, primaryColor }
        ),
      }
    }
  }
}
