'use client'

/**
 * Example: Complete Feature-Gated Section
 *
 * This shows how to gate entire sections of the UI
 * with locked/unlocked states
 */

import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { Lock, Crown, TrendingUp, BarChart3, Users, Settings, Zap } from 'lucide-react'
import Link from 'next/link'

interface FeatureSectionProps {
  title: string
  description: string
  featureKey: string
  children: React.ReactNode
  icon?: React.ReactNode
}

/**
 * Wraps children with feature access control
 * Shows locked state when user doesn't have access
 */
export function FeatureSection({
  title,
  description,
  featureKey,
  children,
  icon,
}: FeatureSectionProps) {
  const { hasAccess, isLoading, reason, limit, usage, showUpgradeModal } =
    useFeatureAccess(featureKey)

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden">
        {/* Locked overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10 p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {title}
            </h3>

            <p className="text-gray-600 mb-4">
              {getLockedDescription(featureKey, reason, limit, usage)}
            </p>

            {/* Upgrade options */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/checkout"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Crown className="w-5 h-5" />
                Upgrade ke Pro Sekarang
              </Link>
              <button
                onClick={showUpgradeModal}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Pelajari Lebih
              </button>
            </div>

            {/* Feature benefits */}
            <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Dengan Pro, Anda dapat:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                {getFeatureBenefits(featureKey).map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Preview of the feature (blurred) */}
        <div className="p-6 opacity-30 filter blur-sm pointer-events-none">
          {icon && (
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-200 rounded-lg">
                {icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
          )}
          <p className="text-gray-600 mb-6">{description}</p>
          {children}
        </div>
      </div>
    )
  }

  // Feature allowed - show actual content
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        {icon && (
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg text-white">
              {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

/**
 * Get description for why feature is locked
 */
function getLockedDescription(
  featureKey: string,
  reason?: string,
  limit?: number | null,
  usage?: number
): string {
  if (reason === 'usage_exceeded' && limit !== null && usage !== undefined) {
    return `Anda telah menggunakan ${usage} dari ${limit} ekspor bulanan ini. Upgrade ke Pro untuk ekspor tanpa batas.`
  }

  const descriptions: Record<string, string> = {
    ANALYTICS_VIEW: 'Lihat analitik bisnis mendalam untuk memahami performa dan tren pendapatan Anda.',
    PDF_EXPORT: 'Export invoice ke PDF profesional dengan branding kustom Anda.',
    EMAIL_SEND: 'Kirim invoice langsung ke email klien dalam satu klik.',
    CUSTOM_BRANDING: 'Kustomisasi logo, warna, dan tampilan invoice sesuai brand Anda.',
    INVOICE_TEMPLATE: 'Simpan dan gunakan template invoice untuk mempercepat pembuatan.',
    TEAM_MEMBERS: 'Undang tim untuk kolaborasi dalam mengelola invoice dan klien.',
  }

  return descriptions[featureKey] || 'Upgrade ke Pro untuk membuka fitur ini.'
}

/**
 * Get feature benefits list
 */
function getFeatureBenefits(featureKey: string): string[] {
  const benefits: Record<string, string[]> = {
    ANALYTICS_VIEW: [
      'Lihat grafik pendapatan bulanan',
      'Track invoice berdasarkan status',
      'Analisis tren pertumbuhan bisnis',
    ],
    PDF_EXPORT: [
      'Export invoice berkualitas tinggi',
      'Branding kustom pada setiap PDF',
      'Tanpa batas ekspor bulanan',
    ],
    EMAIL_SEND: [
      'Kirim langsung ke klien',
      'Template email profesional',
      'Tracking status pengiriman',
    ],
    CUSTOM_BRANDING: [
      'Upload logo perusahaan',
      'Kustomisasi warna brand',
      'Tampilan profesional',
    ],
    INVOICE_TEMPLATE: [
      'Simpan format invoice',
      'Buat invoice lebih cepat',
      'Konsistensi branding',
    ],
    TEAM_MEMBERS: [
      'Undang anggota tim',
      'Bagi tugas dengan tim',
      'Akses kontrol peran',
    ],
  }

  return benefits[featureKey] || ['Akses penuh fitur', 'Prioritas support', 'Tanpa batasan']
}

/**
 * Example: Analytics Section with Feature Gate
 */
export function AnalyticsSection() {
  return (
    <FeatureSection
      title="Analitik Bisnis"
      description="Pantau performa bisnis Anda dengan grafik dan laporan mendalam."
      featureKey="ANALYTICS_VIEW"
      icon={<BarChart3 className="w-5 h-5" />}
    >
      <div className="space-y-6">
        {/* Revenue Chart */}
        <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-12 h-12 text-blue-500" />
          <span className="ml-4 text-blue-600 font-medium">Revenue Chart</span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">Rp 15.5M</p>
            <p className="text-sm text-green-700">Pendapatan Total</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">142</p>
            <p className="text-sm text-blue-700">Invoice Terkirim</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-purple-600">+23%</p>
            <p className="text-sm text-purple-700">Pertumbuhan</p>
          </div>
        </div>
      </div>
    </FeatureSection>
  )
}

/**
 * Example: Team Section with Feature Gate
 */
export function TeamSection() {
  return (
    <FeatureSection
      title="Kolaborasi Tim"
      description="Undang anggota tim dan kelola invoice bersama."
      featureKey="TEAM_MEMBERS"
      icon={<Users className="w-5 h-5" />}
    >
      <div className="space-y-4">
        {/* Team members list */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              A
            </div>
            <div className="flex-1">
              <p className="font-medium">Andi (Owner)</p>
              <p className="text-sm text-gray-500">andi@company.com</p>
            </div>
          </div>
        </div>

        {/* Invite button */}
        <button className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors">
          + Undang Anggota Tim
        </button>
      </div>
    </FeatureSection>
  )
}
