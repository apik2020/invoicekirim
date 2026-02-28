'use client'

import { useState, useEffect } from 'react'
import { X, Download, FileText, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface ReceiptViewerProps {
  paymentId: string
  onClose: () => void
}

export function ReceiptViewer({ paymentId, onClose }: ReceiptViewerProps) {
  const [receipt, setReceipt] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetchReceipt()
  }, [paymentId])

  const fetchReceipt = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/payments/${paymentId}/receipt`)
      const data = await res.json()

      if (res.ok) {
        setReceipt(data)
      } else {
        alert(`Error: ${data.error}`)
        onClose()
      }
    } catch (error) {
      console.error('Error fetching receipt:', error)
      alert('Gagal memuat receipt')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      setDownloading(true)
      // For now, open receipt in new tab
      // In production, you would download the actual PDF
      window.open(`/api/payments/${paymentId}/receipt`, '_blank')
    } catch (error) {
      console.error('Error downloading receipt:', error)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900">Receipt</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="p-8">
              {/* Receipt Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">InvoiceKirim</h1>
                <p className="text-gray-600">Payment Receipt</p>
              </div>

              {/* Receipt Details */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Receipt Number</p>
                    <p className="font-mono font-bold text-gray-900">
                      {receipt?.receiptNumber || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(new Date())}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-medium text-gray-900">Stripe</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">Status</span>
                  <span className="px-3 py-1 rounded-lg bg-lime-100 text-lime-700 text-sm font-bold">
                    COMPLETED
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">Description</span>
                  <span className="font-medium text-gray-900">
                    InvoiceKirim Subscription Payment
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="bg-orange-50 rounded-xl p-6 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total Paid</span>
                  <span className="text-2xl font-bold text-orange-600">
                    {receipt?.amount ? formatCurrency(receipt.amount) : '-'}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-sm text-gray-500">
                <p>Receipt ini bukti pembayaran yang sah</p>
                <p>Generated by InvoiceKirim</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {!loading && (
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              Download Receipt
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
