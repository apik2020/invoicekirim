'use client'

import { useState, useEffect } from 'react'
import {
  List,
  Check,
  X,
  Infinity,
  Loader2,
  Tag,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { cn } from '@/lib/utils'
import { FEATURE_DEFINITIONS } from '@/lib/pricing-features'

interface Plan {
  id: string
  name: string
  slug: string
  features_json: Record<string, boolean | number | null>
}

export default function AdminPricingFeaturesPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/pricing')
      if (res.ok) {
        const data = await res.json()
        setPlans(data.plans)
      } else {
        setError('Gagal memuat data paket')
      }
    } catch {
      setError('Gagal memuat data paket')
    } finally {
      setIsLoading(false)
    }
  }

  const getFeatureValue = (plan: Plan, featureKey: string) => {
    const features = plan.features_json as Record<string, boolean | number | null>
    return features[featureKey]
  }

  const renderFeatureValue = (value: boolean | number | null | undefined) => {
    if (value === undefined || value === false || value === null) {
      return (
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>
      )
    }

    if (typeof value === 'number') {
      return (
        <div className="flex items-center justify-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-success-400 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-text-primary">{value}</span>
        </div>
      )
    }

    if (value === true) {
      return (
        <div className="flex items-center justify-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-success-400 flex items-center justify-center">
            <Infinity className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs text-text-muted">Unlimited</span>
        </div>
      )
    }

    return null
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
            <List className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Fitur Pricing</h1>
            <p className="text-text-secondary">Overview fitur yang tersedia di setiap paket subscription</p>
          </div>
        </div>

        {error && (
          <div className="card p-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-3 text-red-700">
              <X className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Feature Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURE_DEFINITIONS.map((def) => (
            <div key={def.key} className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-brand-500" />
                <span className="font-semibold text-text-primary text-sm">{def.nameEn}</span>
              </div>
              <p className="text-xs text-text-muted mb-2">{def.description}</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{def.key}</code>
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded font-medium',
                  def.type === 'number' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                )}>
                  {def.type}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Matrix Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header text-left min-w-[200px]">Fitur</th>
                  <th className="table-header">Key</th>
                  <th className="table-header">Tipe</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="table-header min-w-[120px]">
                      <div className="text-center">
                        <span className={cn(
                          'font-bold',
                          plan.slug === 'plan-basic' ? 'text-brand-500' : 'text-text-primary'
                        )}>
                          {plan.name}
                        </span>
                        {plan.slug === 'plan-basic' && (
                          <span className="block text-xs text-brand-400">Popular</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {FEATURE_DEFINITIONS.map((def) => (
                  <tr key={def.key} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <div>
                        <span className="font-medium text-text-primary">{def.name}</span>
                        <p className="text-xs text-text-muted mt-0.5">{def.nameEn}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-text-muted">
                        {def.key}
                      </code>
                    </td>
                    <td className="table-cell">
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full font-medium',
                        def.type === 'number' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      )}>
                        {def.type}
                      </span>
                    </td>
                    {plans.map((plan) => (
                      <td key={`${plan.id}-${def.key}`} className="table-cell">
                        {renderFeatureValue(getFeatureValue(plan, def.key))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="card p-6 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">Tentang Fitur Pricing</h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• Fitur didefinisikan di <code className="bg-blue-100 px-1 rounded">src/lib/pricing-features.ts</code> (FEATURE_DEFINITIONS)</li>
            <li>• Nilai fitur per paket disimpan di <code className="bg-blue-100 px-1 rounded">features_json</code> pada tabel pricing_plans</li>
            <li>• Untuk mengubah nilai fitur per paket, gunakan halaman <strong>Kelola Pricing</strong></li>
            <li>• Tipe <code>number</code> berarti fitur memiliki batas (contoh: 10 invoice/bulan)</li>
            <li>• Nilai <code>true</code> berarti fitur tersedia tanpa batas (unlimited)</li>
            <li>• Nilai <code>false</code> berarti fitur tidak tersedia di paket tersebut</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  )
}
