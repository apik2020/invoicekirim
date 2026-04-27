// Feature definitions for the JSON-based pricing model
// Only features that are actually implemented and/or gated in the system
export const FEATURE_DEFINITIONS = [
  { key: 'invoice_limit', name: 'Batas Invoice', nameEn: 'Invoice Limit', type: 'number' as const, description: 'Jumlah invoice yang dapat dibuat per bulan' },
  { key: 'whatsapp', name: 'Kirim via WhatsApp', nameEn: 'Send via WhatsApp', type: 'boolean' as const, description: 'Kirim invoice langsung ke WhatsApp klien' },
  { key: 'pdf_export', name: 'Ekspor PDF', nameEn: 'PDF Export', type: 'boolean' as const, description: 'Unduh invoice dalam format PDF berkualitas tinggi' },
  { key: 'email_send', name: 'Kirim Email', nameEn: 'Send Email', type: 'boolean' as const, description: 'Kirim invoice langsung ke email klien' },
  { key: 'custom_template', name: 'Template Custom', nameEn: 'Custom Template', type: 'boolean' as const, description: 'Buat dan edit template invoice sendiri' },
  { key: 'custom_branding', name: 'Custom Branding', nameEn: 'Custom Branding', type: 'boolean' as const, description: 'Logo, warna, dan identitas brand di invoice' },
  { key: 'analytics_view', name: 'Analitik', nameEn: 'Analytics', type: 'boolean' as const, description: 'Laporan dan analitik bisnis mendalam' },
  { key: 'custom_smtp', name: 'SMTP Sendiri', nameEn: 'Custom SMTP', type: 'boolean' as const, description: 'Gunakan SMTP sendiri untuk branding email profesional' },
] as const

export type FeatureKey = typeof FEATURE_DEFINITIONS[number]['key']

// Map old code keys to new JSON keys (backward compatibility)
export const OLD_TO_NEW_KEY_MAP: Record<string, string> = {
  'invoice_limit': 'invoice_limit',
  'INVOICE_CREATE': 'invoice_limit',
  'INVOICE_TEMPLATE': 'custom_template',
  'pdf_export': 'pdf_export',
  'EXPORT_PDF': 'pdf_export',
  'whatsapp': 'whatsapp',
  'branding': 'custom_branding',
  'BRANDING': 'custom_branding',
  'EMAIL_SEND': 'email_send',
  'CUSTOM_SMTP': 'custom_smtp',
  'CLIENT_MANAGEMENT': 'client_management',
  'ANALYTICS_VIEW': 'analytics_view',
  'templates': 'custom_template',
  'cloud_storage': 'cloud_storage',
  'priority_support': 'priority_support',
  'API_ACCESS': 'api_access',
}

// Map new JSON keys back to old code keys
export const NEW_TO_OLD_KEY_MAP: Record<string, string> = {
  'invoice_limit': 'invoice_limit',
  'custom_template': 'INVOICE_TEMPLATE',
  'pdf_export': 'pdf_export',
  'whatsapp': 'whatsapp',
  'custom_branding': 'branding',
  'email_send': 'EMAIL_SEND',
  'custom_smtp': 'CUSTOM_SMTP',
  'client_management': 'CLIENT_MANAGEMENT',
  'analytics_view': 'ANALYTICS_VIEW',
}

export interface PlanFeatures {
  [key: string]: boolean | number | null
}

export function parsePlanFeatures(json: unknown): PlanFeatures {
  if (!json || typeof json !== 'object') return {}
  return json as PlanFeatures
}

export function getFeatureValue(
  features: PlanFeatures,
  key: string
): { included: boolean; limitValue: number | null } {
  const value = features[key]

  if (value === undefined || value === false || value === null) {
    return { included: false, limitValue: null }
  }

  if (typeof value === 'number') {
    return { included: true, limitValue: value }
  }

  if (value === true) {
    return { included: true, limitValue: null }
  }

  return { included: false, limitValue: null }
}

export function getFeatureDisplayText(
  key: string,
  value: boolean | number | null,
  locale: 'id' | 'en' = 'id'
): string {
  const def = FEATURE_DEFINITIONS.find(f => f.key === key)
  const name = locale === 'en' && def ? def.nameEn : (def?.name || key)

  if (value === false || value === null || value === undefined) {
    return name
  }

  if (key === 'invoice_limit' && typeof value === 'number') {
    return locale === 'en'
      ? `${value} invoices/month`
      : `${value} invoice/bulan`
  }

  if (key === 'invoice_limit' && value === true) {
    return locale === 'en' ? 'Unlimited invoices' : 'Invoice unlimited'
  }

  return name
}

export function toNewKey(oldKey: string): string {
  return OLD_TO_NEW_KEY_MAP[oldKey] || oldKey
}

export function toOldKey(newKey: string): string {
  return NEW_TO_OLD_KEY_MAP[newKey] || newKey
}
