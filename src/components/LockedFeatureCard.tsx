'use client'

import { Lock, Crown } from 'lucide-react'
import Link from 'next/link'

interface LockedFeatureCardProps {
  featureKey: string
  featureName?: string
  description?: string
  reason?: 'plan_limit' | 'feature_locked' | 'usage_exceeded' | 'trial_expired' | 'no_subscription'
  limit?: number | null
  usage?: number
}

// Feature descriptions
const FEATURE_INFO: Record<string, { name: string; description: string }> = {
  INVOICE_CREATE: {
    name: 'Buat Invoice',
    description: 'Membuat invoice baru',
  },
  INVOICE_TEMPLATE: {
    name: 'Template Custom',
    description: 'Template invoice kustom',
  },
  CUSTOM_BRANDING: {
    name: 'Custom Branding',
    description: 'Logo dan warna kustom',
  },
  EXPORT_PDF: {
    name: 'Export PDF',
    description: 'Export invoice ke PDF',
  },
  EMAIL_SEND: {
    name: 'Kirim Email',
    description: 'Kirim invoice via email',
  },
  CLIENT_MANAGEMENT: {
    name: 'Klien',
    description: 'Manage client database',
  },
  ANALYTICS_VIEW: {
    name: 'Analitik',
    description: 'Lihat analitik bisnis',
  },
  TEAM_MEMBERS: {
    name: 'Tim',
    description: 'Tambah anggota tim',
  },
  API_ACCESS: {
    name: 'API Access',
    description: 'Akses API untuk integrasi',
  },
}

export function LockedFeatureCard({
  featureKey,
  featureName,
  description,
  reason,
  limit,
  usage,
}: LockedFeatureCardProps) {
  const featureInfo = FEATURE_INFO[featureKey] || {
    name: featureName || featureKey,
    description: description || 'Fitur tidak tersedia',
  }

  const getReasonMessage = () => {
    switch (reason) {
      case 'plan_limit':
        return 'Batas paket Anda telah tercapai.'
      case 'usage_exceeded':
        return limit ? `Anda telah menggunakan ${usage || 0} dari ${limit} batas bulanan.` : 'Batas penggunaan tercapai.'
      case 'trial_expired':
        return 'Masa percobaan gratis Anda telah berakhir.'
      case 'no_subscription':
        return 'Anda belum memiliki subscription.'
      case 'feature_locked':
      default:
        return 'Fitur ini tidak tersedia di paket Anda.'
    }
  }

  return (
    <div className="card p-6 text-center">
      <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4">
        <Lock className="w-6 h-6 text-amber-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        {featureInfo.name}
      </h3>
      <p className="text-gray-600 text-sm mb-2">
        {featureInfo.description}
      </p>
      <p className="text-gray-500 text-sm mb-4">
        {getReasonMessage()}
      </p>

      {reason === 'usage_exceeded' && limit && usage !== undefined && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            <span className="font-medium">Batas Tercapai:</span> {usage}/{limit} used
          </p>
        </div>
      )}

      <Link
        href="/dashboard/checkout"
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 transition-colors"
      >
        <Crown className="w-4 h-4" />
        Upgrade ke Pro
      </Link>
    </div>
  )
}
