'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, Loader2, ChevronDown } from 'lucide-react'

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

  const handleExport = async (format: 'csv' | 'excel') => {
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
