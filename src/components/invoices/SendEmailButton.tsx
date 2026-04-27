'use client'

import { useState } from 'react'
import { Send, Loader2, Lock, Crown } from 'lucide-react'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import Link from 'next/link'

interface SendEmailButtonProps {
  invoiceId: string
  invoiceNumber: string
  clientEmail: string
  onSent?: () => void
  variant?: 'primary' | 'outline'
  size?: 'sm' | 'md'
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

export function SendEmailButton({
  invoiceId,
  invoiceNumber,
  clientEmail,
  onSent,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  children,
}: SendEmailButtonProps) {
  const [isSending, setIsSending] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // Check feature access for email sending
  const { hasAccess, isLoading, reason, limit, usage, showUpgradeModal } = useFeatureAccess('EMAIL_SEND')

  const handleSend = async () => {
    // Check access before sending
    if (!hasAccess) {
      showUpgradeModal()
      return
    }

    setIsSending(true)
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
      })

      if (!res.ok) {
        const errorData = await res.json()

        // Handle feature locked response
        if (errorData.error === 'FEATURE_LOCKED') {
          setShowDropdown(false)
          // Redirect to checkout
          window.location.href = errorData.upgradeUrl || '/dashboard/checkout'
          return
        }

        throw new Error(errorData.error || 'Gagal mengirim invoice')
      }

      const data = await res.json()

      // Call success callback
      if (onSent) {
        onSent()
      }

      // Show success message
      alert(`Invoice ${invoiceNumber} berhasil dikirim ke ${clientEmail}`)
    } catch (error) {
      console.error('Send email error:', error)
      alert(error instanceof Error ? error.message : 'Gagal mengirim invoice')
    } finally {
      setIsSending(false)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <button
        disabled
        className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
          size === 'sm'
            ? 'px-4 py-2.5 text-sm'
            : 'px-6 py-3'
        } bg-gray-100 text-gray-400 ${className}`}
      >
        <Loader2 size={size === 'sm' ? 16 : 18} className="animate-spin" />
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
          disabled={disabled}
          className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all ${
            variant === 'primary'
              ? 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
              : 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
          } ${
            size === 'sm'
              ? 'px-4 py-2.5 text-sm'
              : 'px-6 py-3'
          } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
          <Send size={size === 'sm' ? 16 : 18} />
          <span>{children || (isSending ? 'Mengirim...' : 'Kirim Invoice')}</span>
          <Lock className="w-4 h-4 ml-1" />
          <span className="ml-1 px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full text-xs font-semibold">
            PRO
          </span>
        </button>

        {/* Usage info tooltip */}
        {reason === 'usage_exceeded' && limit !== null && usage !== undefined && (
          <div className="absolute right-0 mt-2 w-64 p-3 bg-white rounded-xl border border-gray-200 shadow-lg z-30">
            <p className="text-sm text-gray-700">
              Anda telah menggunakan <strong>{usage}</strong> dari <strong>{limit}</strong> kirim email bulanan.
            </p>
            <Link
              href="/dashboard/checkout"
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

  // Show normal state (has access)
  return (
    <button
      onClick={handleSend}
      disabled={disabled || isSending}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all ${
        variant === 'primary'
          ? 'text-white btn-primary'
          : variant === 'outline'
            ? 'text-primary-600 border-2 border-primary-200 hover:bg-primary-50'
            : 'text-white bg-success-500 hover:bg-success-600'
      } disabled:opacity-50 disabled:cursor-not-allowed ${
        size === 'sm'
          ? 'px-4 py-2.5 text-sm'
          : 'px-6 py-3'
      } ${className}`}
    >
      {isSending ? (
        <Loader2 size={size === 'sm' ? 16 : 18} className="animate-spin" />
      ) : (
        <Send size={size === 'sm' ? 16 : 18} />
      )}
      <span>{children || (isSending ? 'Mengirim...' : 'Kirim Invoice')}</span>
    </button>
  )
}
