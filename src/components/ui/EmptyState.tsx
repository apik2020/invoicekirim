import { LucideIcon } from 'lucide-react'
import React from 'react'

interface EmptyStateProps {
  icon?: LucideIcon | ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  } | ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  const renderIcon = () => {
    if (!icon) return null

    // Check if it's a LucideIcon component
    if (typeof icon === 'function' && 'displayName' in icon) {
      const Icon = icon as LucideIcon
      return (
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )
    }

    // Otherwise render as ReactNode
    return <div className="mb-4">{icon}</div>
  }

  const renderAction = () => {
    if (!action) return null

    // If action is a ReactNode, render it directly
    if (React.isValidElement(action)) {
      return <div className="mt-6">{action}</div>
    }

    // Otherwise render as button
    const buttonAction = action as { label: string; onClick: () => void; variant?: 'primary' | 'secondary' }
    const variantStyles = buttonAction.variant === 'primary'
      ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600'
      : 'border-2 border-gray-200 text-gray-700 hover:bg-gray-50'

    return (
      <button
        onClick={buttonAction.onClick}
        className={`mt-6 px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-orange-200 ${variantStyles}`}
      >
        {buttonAction.label}
      </button>
    )
  }

  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-4 ${className}`}>
      {renderIcon()}

      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-gray-600 max-w-sm">
          {description}
        </p>
      )}

      {renderAction()}
    </div>
  )
}

// Preset Empty States
export function NoData({ action, className }: { action?: EmptyStateProps['action']; className?: string }) {
  return (
    <EmptyState
      title="Tidak Ada Data"
      description="Belum ada data yang tersedia saat ini."
      action={action}
      className={className}
    />
  )
}

export function NoSearchResults({ action, className }: { action?: EmptyStateProps['action']; className?: string }) {
  return (
    <EmptyState
      title="Tidak Ditemukan"
      description="Pencarian Anda tidak menemukan hasil. Coba kata kunci lain."
      action={action}
      className={className}
    />
  )
}

export function NoInvoices({ action, className }: { action?: EmptyStateProps['action']; className?: string }) {
  return (
    <EmptyState
      title="Belum Ada Invoice"
      description="Anda belum membuat invoice sama sekali. Buat invoice pertama Anda sekarang."
      action={action || {
        label: 'Buat Invoice',
        onClick: () => {}, // Will be overridden by parent
        variant: 'primary',
      }}
      className={className}
    />
  )
}

export function NoClients({ action, className }: { action?: EmptyStateProps['action']; className?: string }) {
  return (
    <EmptyState
      title="Belum Ada Klien"
      description="Tambahkan klien pertama Anda untuk mulai membuat invoice."
      action={action || {
        label: 'Tambah Klien',
        onClick: () => {},
        variant: 'primary',
      }}
      className={className}
    />
  )
}

export function ErrorState({ error, onRetry, className }: { error: string; onRetry?: () => void; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-4 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center mb-4">
        <span className="text-3xl">⚠️</span>
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Terjadi Kesalahan
      </h3>

      <p className="text-gray-600 max-w-sm mb-6">
        {error}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 transition-all font-medium shadow-lg shadow-red-200"
        >
          Coba Lagi
        </button>
      )}
    </div>
  )
}

export function LoadingState({ message = 'Memuat data...', className }: { message?: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-4 ${className}`}>
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
      </div>

      <p className="text-gray-600">{message}</p>
    </div>
  )
}
