import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { InvoicePrintView } from '@/components/InvoicePrintView'
import { getBranding, type BrandingSettings } from '@/lib/branding'
import { checkFeatureAccess, FEATURE_KEYS } from '@/lib/feature-access'

// Disable static generation for this page
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{ token: string }>
}

interface InvoiceSettings {
  showClientInfo?: boolean
  showDiscount?: boolean
  showAdditionalDiscount?: boolean
  showTax?: boolean
  showSignature?: boolean
}

// Default InvoiceKirim branding
const DEFAULT_INVOICEKIRIM_BRANDING: Partial<BrandingSettings> = {
  primaryColor: '#F97316',
  secondaryColor: '#FFFFFF',
  accentColor: '#276874',
  showLogo: true,
  showColors: true,
  fontFamily: 'inter',
  logoUrl: null,
}

export default async function InvoicePage({ params }: PageProps) {
  const { token } = await params

  const invoice = await prisma.invoices.findUnique({
    where: { accessToken: token },
    include: { invoice_items: true },
  })

  if (!invoice) {
    notFound()
  }

  // Get user's team to fetch branding
  let branding: BrandingSettings | null = null

  // Check if user has branding feature access
  const brandingAccess = await checkFeatureAccess(invoice.userId, FEATURE_KEYS.BRANDING)
  const hasCustomBranding = brandingAccess.allowed

  // Only fetch branding if user has access to custom branding
  if (hasCustomBranding) {
    // Try to get team via user's activeTeamId first
    const user = await prisma.users.findUnique({
      where: { id: invoice.userId },
      select: { activeTeamId: true },
    })

    if (user?.activeTeamId) {
      branding = await getBranding(user.activeTeamId)
    } else {
      // Fallback: find team where user is the owner
      const team = await prisma.teams.findFirst({
        where: { ownerId: invoice.userId },
        select: { id: true },
      })

      if (team) {
        branding = await getBranding(team.id)
      }
    }
  }

  // Apply branding based on feature access:
  // - Free users: Always use default InvoiceKirim branding
  // - Pro users: Use custom branding if configured, otherwise default
  const effectiveBranding: BrandingSettings = {
    id: branding?.id || 'default',
    teamId: branding?.teamId || 'default',
    logoUrl: hasCustomBranding && branding?.showLogo ? (branding?.logoUrl || null) : null,
    primaryColor: hasCustomBranding && branding?.showColors ? (branding?.primaryColor || DEFAULT_INVOICEKIRIM_BRANDING.primaryColor!) : DEFAULT_INVOICEKIRIM_BRANDING.primaryColor!,
    secondaryColor: hasCustomBranding && branding?.showColors ? (branding?.secondaryColor || DEFAULT_INVOICEKIRIM_BRANDING.secondaryColor!) : DEFAULT_INVOICEKIRIM_BRANDING.secondaryColor!,
    accentColor: hasCustomBranding && branding?.showColors ? (branding?.accentColor || DEFAULT_INVOICEKIRIM_BRANDING.accentColor!) : DEFAULT_INVOICEKIRIM_BRANDING.accentColor!,
    invoicePrefix: branding?.invoicePrefix || 'INV',
    receiptPrefix: branding?.receiptPrefix || 'RCP',
    showLogo: hasCustomBranding && branding?.showLogo ? true : false,
    showColors: hasCustomBranding && branding?.showColors ? true : false,
    emailFromName: branding?.emailFromName || null,
    emailReplyTo: branding?.emailReplyTo || null,
    customDomain: branding?.customDomain || null,
    domainVerified: branding?.domainVerified || false,
    fontFamily: hasCustomBranding ? (branding?.fontFamily || 'inter') : 'inter',
  }

  // Parse settings from JSON
  const settings = invoice.settings as InvoiceSettings | null

  // Convert dates and serialize for client component
  const invoiceData = {
    ...invoice,
    date: invoice.date,
    dueDate: invoice.dueDate,
    settings,
    items: invoice.invoice_items.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      price: item.price,
    })),
  }

  return <InvoicePrintView invoice={invoiceData} branding={effectiveBranding} />
}
