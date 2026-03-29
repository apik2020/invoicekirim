'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, Loader2, ChevronDown, Lock, Crown } from 'lucide-react'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import Link from 'next/link'

interface InvoiceExportButtonProps {
  status?: string
  search?: string
  startDate?: string
  endDate?: string
}

export function InvoiceExportButton({
  status,
  search,
  startDate,
  endDate,
}: InvoiceExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // Check feature access for PDF export
  const { hasAccess, isLoading, reason, limit, usage, showUpgradeModal } = useFeatureAccess('PDF_EXPORT')

  const handleExport = async (format: 'csv' | 'excel') => {
    // Check access before exporting
    if (!hasAccess) {
      showUpgradeModal()
      return
    }

    setIsExporting(true)
    setShowDropdown(false)

    try {
      // Build query parameters
      const params = new URLSearchParams()
      params.append('format', format)
      if (status && status !== 'ALL') {
        params.append('status', status)
      }
      if (search) {
        params.append('search', search)
      }
      if (startDate) {
        params.append('startDate', startDate)
      }
      if (endDate) {
        params.append('endDate', endDate)
      }

      // Fetch the export file
      const response = await fetch(`/api/invoices/export?${params.toString()}`)

      if (!response.ok) {
        const error = await response.json()
        // Handle feature locked response
        if (error.error === 'FEATURE_LOCKED') {
          setShowDropdown(false)
          // Redirect to checkout
          window.location.href = error.upgradeUrl || '/checkout'
          return
        }
        throw new Error(error.error || 'Gagal mengekspor invoice')
      }

      // Get the blob
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : `invoices-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`

      a.download = filename
      document.body.appendChild(a)
      a.click()

      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert(error instanceof Error ? error.message : 'Gagal mengekspor invoice')
    } finally {
      setIsExporting(false)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <button disabled className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-400 rounded-xl font-medium cursor-not-allowed">
        <Loader2 size={18} className="animate-spin" />
        <span>Loading...</span>
      </button>
    )
  }

  // Show locked state
  if (!hasAccess) {
    return (
      <div className="relative">
        <button
          onClick={showUpgradeModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl font-medium hover:bg-amber-100 transition-colors"
        >
          <Download size={18} />
          <span>Export</span>
          <Lock className="w-4 h-4 ml-1" />
          <span className="ml-1 px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full text-xs font-semibold">
            PRO
          </span>
        </button>

        {/* Usage info tooltip */}
        {(reason === 'usage_exceeded' && limit && usage) && (
          <div className="absolute right-0 mt-2 w-64 p-3 bg-white rounded-xl border border-gray-200 shadow-lg z-30">
            <p className="text-sm text-gray-700">
              Anda telah menggunakan <strong>{usage}</strong> dari <strong>{limit}</strong> ekspor bulanan.
            </p>
            <Link
              href="/checkout"
              className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand-500 hover:text-brand-600"
            >
              <Crown className="w-4 h-4" />
              Upgrade untuk unlimited
            </Link>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isExporting}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 btn-secondary font-medium disabled:opacity-50"
      >
        {isExporting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Mengekspor...</span>
          </>
        ) : (
          <>
            <Download size={18} />
            <span>Export</span>
            <ChevronDown size={16} />
          </>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-gray-200 shadow-lg z-20 py-2">
            <button
              onClick={() => handleExport('csv')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <FileText size={16} className="text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">CSV</p>
                <p className="text-xs text-gray-500">Format universal</p>
              </div>
            </button>

            <button
              onClick={() => handleExport('excel')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileSpreadsheet size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Excel</p>
                <p className="text-xs text-gray-500">Dengan formatting</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
