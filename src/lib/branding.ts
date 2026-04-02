import { prisma } from '@/lib/prisma'

export interface BrandingSettings {
  id: string
  teamId: string
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string | null
  accentColor: string | null
  invoicePrefix: string | null
  receiptPrefix: string | null
  showLogo: boolean
  showColors: boolean
  emailFromName: string | null
  emailReplyTo: string | null
  customDomain: string | null
  domainVerified: boolean
  fontFamily: string | null
}

const DEFAULT_BRANDING = {
  primaryColor: '#F97316',
  secondaryColor: '#FFFFFF',
  accentColor: null,
  invoicePrefix: 'INV',
  receiptPrefix: 'RCP',
  showLogo: true,
  showColors: true,
  fontFamily: 'inter',
}

/**
 * Get branding settings for a team
 */
export async function getBranding(teamId: string): Promise<BrandingSettings | null> {
  const branding = await prisma.branding.findUnique({
    where: { teamId },
  })

  if (!branding) {
    // Create default branding
    return createDefaultBranding(teamId)
  }

  return branding
}

/**
 * Create default branding for a team
 */
async function createDefaultBranding(teamId: string): Promise<BrandingSettings> {
  const branding = await prisma.branding.create({
    data: {
      id: crypto.randomUUID(),
      teamId,
      ...DEFAULT_BRANDING,
      updatedAt: new Date(),
    },
  })

  return branding
}

/**
 * Update branding settings
 */
export async function updateBranding(
  teamId: string,
  data: Partial<Omit<BrandingSettings, 'id' | 'teamId'>>
): Promise<BrandingSettings> {
  console.log('[Branding] Updating for teamId:', teamId, 'with data:', data)

  try {
    const branding = await prisma.branding.upsert({
      where: { teamId },
      update: { ...data, updatedAt: new Date() },
      create: {
        id: crypto.randomUUID(),
        teamId,
        ...DEFAULT_BRANDING,
        ...data,
        updatedAt: new Date(),
      },
    })

    console.log('[Branding] Update successful:', branding)
    return branding
  } catch (error) {
    console.error('[Branding] Update failed:', error)
    throw error
  }
}

/**
 * Upload logo and update branding
 */
export async function updateLogo(
  teamId: string,
  logoUrl: string
): Promise<BrandingSettings> {
  return updateBranding(teamId, { logoUrl })
}

/**
 * Remove logo
 */
export async function removeLogo(teamId: string): Promise<BrandingSettings> {
  return updateBranding(teamId, { logoUrl: null })
}

/**
 * Update custom domain
 */
export async function updateCustomDomain(
  teamId: string,
  domain: string
): Promise<{ branding: BrandingSettings; verificationToken: string }> {
  // Generate verification token
  const verificationToken = generateDomainVerificationToken(teamId, domain)

  const branding = await updateBranding(teamId, {
    customDomain: domain,
    domainVerified: false,
  })

  return { branding, verificationToken }
}

/**
 * Generate domain verification token
 */
function generateDomainVerificationToken(teamId: string, domain: string): string {
  // Simple token for DNS TXT record verification
  const crypto = require('crypto')
  const hash = crypto
    .createHash('sha256')
    .update(`${teamId}:${domain}:${process.env.NEXTAUTH_SECRET}`)
    .digest('hex')
    .slice(0, 32)

  return `notabener-verification=${hash}`
}

/**
 * Verify custom domain
 */
export async function verifyCustomDomain(
  teamId: string
): Promise<{ verified: boolean; error?: string }> {
  const branding = await getBranding(teamId)

  if (!branding?.customDomain) {
    return { verified: false, error: 'No custom domain configured' }
  }

  // In production, this would check DNS TXT records
  // For now, we'll just mark it as verified
  const verified = true

  if (verified) {
    await prisma.branding.update({
      where: { teamId },
      data: { domainVerified: true },
    })
  }

  return { verified }
}

/**
 * Remove custom domain
 */
export async function removeCustomDomain(teamId: string): Promise<BrandingSettings> {
  return updateBranding(teamId, {
    customDomain: null,
    domainVerified: false,
  })
}

/**
 * Get branding CSS variables
 */
export function getBrandingCSS(branding: BrandingSettings | null): Record<string, string> {
  const settings = branding || DEFAULT_BRANDING

  return {
    '--color-primary': settings.primaryColor,
    '--color-secondary': settings.secondaryColor || DEFAULT_BRANDING.secondaryColor,
    '--color-accent': settings.accentColor || settings.primaryColor,
    '--font-family': settings.fontFamily || DEFAULT_BRANDING.fontFamily,
  }
}

/**
 * Generate invoice number with custom prefix
 */
export async function generateInvoiceNumberWithPrefix(teamId: string): Promise<string> {
  const branding = await getBranding(teamId)
  const prefix = branding?.invoicePrefix || DEFAULT_BRANDING.invoicePrefix

  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')

  return `${prefix}-${timestamp}${random}`
}

/**
 * Generate receipt number with custom prefix
 */
export async function generateReceiptNumberWithPrefix(teamId: string): Promise<string> {
  const branding = await getBranding(teamId)
  const prefix = branding?.receiptPrefix || DEFAULT_BRANDING.receiptPrefix

  const date = new Date()
  const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')

  return `${prefix}-${dateStr}-${random}`
}
