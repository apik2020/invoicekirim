'use client'

import { useState, useEffect } from 'react'
import { X, Crown, Sparkles, Check, Zap } from 'lucide-react'
import Link from 'next/link'
import { setUpgradeModalCallback } from '@/hooks/useFeatureAccess'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  featureKey?: string
  reason?: 'plan_limit' | 'feature_locked' | 'usage_exceeded' | 'trial_expired'
}

const FEATURE_INFO: Record<string, { name: string; description: string }> = {
  INVOICE_CREATE: {
    name: 'Buat Invoice',
    description: 'Buat invoice tanpa batas dengan paket Pro',
  },
  INVOICE_TEMPLATE: {
    name: 'Template Custom',
    description: 'Template invoice kustom untuk branding konsisten',
  },
  CUSTOM_BRANDING: {
    name: 'Custom Branding',
    description: 'Logo dan warna kustom untuk profesionalisme',
  },
  EXPORT_PDF: {
    name: 'Export PDF',
    description: 'Export invoice ke PDF berkualitas tinggi',
  },
  EMAIL_SEND: {
    name: 'Kirim Email',
    description: 'Kirim invoice langsung email ke klien',
  },
  ANALYTICS_VIEW: {
    name: 'Analitik',
    description: 'Lihat analitik bisnis mendalam',
  },
  TEAM_MEMBERS: {
    name: 'Tim',
    description: 'Kolaborasi dengan anggota tim',
  },
  API_ACCESS: {
    name: 'Akses API',
    description: 'Integrasikan dengan sistem lain via API',
  },
}

export function UpgradeModal({ isOpen, onClose, featureKey, reason }: UpgradeModalProps) {
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Register callback for hook to trigger modal
    setUpgradeModalCallback(() => {
      setShowModal(true)
    })

    return () => {
      setUpgradeModalCallback(null)
    }
  }, [])

  // Sync with external isOpen prop
  useEffect(() => {
    setShowModal(isOpen)
  }, [isOpen])

  if (!showModal) return null

  const featureInfo = featureKey ? FEATURE_INFO[featureKey] : null

  const getReasonMessage = () => {
    switch (reason) {
      case 'plan_limit':
        return 'Batas paket Anda telah tercapai.'
      case 'feature_locked':
        return 'Fitur ini tidak tersedia di paket Anda.'
      case 'usage_exceeded':
        return 'Anda telah mencapai batas penggunaan bulanan.'
      case 'trial_expired':
        return 'Masa percobaan gratis Anda telah berakhir.'
      default:
        return 'Upgrade ke Pro untuk mengakses fitur ini.'
    }
  }

  const benefits = [
    { icon: Check, text: 'Invoice tanpa batas' },
    { icon: Check, text: 'Custom branding & logo' },
    { icon: Check, text: 'Export PDF berkualitas' },
    { icon: Check, text: 'Analitik lengkap' },
    { icon: Check, text: 'Dukungan prioritas' },
    { icon: Check, text: 'Akses API penuh' },
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-8 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Crown className="w-8 h-8" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-center">
              Upgrade ke Pro
            </h2>
            <p className="text-brand-100 text-center mt-2">
              Buka potensi penuh bisnis Anda
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {featureInfo && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      {featureInfo.name}
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      {getReasonMessage()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-gray-600 text-sm mb-6">
              Dengan paket Pro, Anda mendapatkan akses ke semua fitur premium
              untuk mengembangkan bisnis Anda lebih cepat.
            </p>

            {/* Benefits */}
            <div className="space-y-3 mb-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700">{benefit.text}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href="/dashboard/checkout"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Upgrade ke Pro Sekarang
              </Link>
              <button
                onClick={onClose}
                className="w-full py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
