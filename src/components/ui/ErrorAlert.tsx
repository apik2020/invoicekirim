import { AlertCircle, AlertTriangle, Info, X, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

type AlertVariant = 'error' | 'warning' | 'info' | 'success'

interface ErrorAlertProps {
  variant?: AlertVariant
  title?: string
  message: string | React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
  actions?: React.ReactNode
}

export function ErrorAlert({
  variant = 'error',
  title,
  message,
  dismissible = false,
  onDismiss,
  className = '',
  actions,
}: ErrorAlertProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  useEffect(() => {
    if (dismissible && !isVisible) {
      const timer = setTimeout(() => {
        // Optional: remove from DOM after animation
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible, dismissible])

  if (!isVisible) return null

  const variants = {
    error: {
      container: 'bg-red-50 border-red-200',
      icon: 'text-red-600',
      iconBg: 'bg-red-100',
      title: 'text-red-900',
      message: 'text-red-800',
      iconComponent: AlertCircle,
    },
    warning: {
      container: 'bg-amber-50 border-amber-200',
      icon: 'text-amber-600',
      iconBg: 'bg-amber-100',
      title: 'text-amber-900',
      message: 'text-amber-800',
      iconComponent: AlertTriangle,
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-600',
      iconBg: 'bg-blue-100',
      title: 'text-blue-900',
      message: 'text-blue-800',
      iconComponent: Info,
    },
    success: {
      container: 'bg-green-50 border-green-200',
      icon: 'text-green-600',
      iconBg: 'bg-green-100',
      title: 'text-green-900',
      message: 'text-green-800',
      iconComponent: CheckCircle,
    },
  }

  const style = variants[variant]
  const IconComponent = style.iconComponent

  return (
    <div
      className={`
        rounded-xl border-2 p-4 shadow-sm
        transition-all duration-300 transform
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        ${style.container} ${className}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${style.iconBg} flex items-center justify-center`}>
          <IconComponent className={`w-5 h-5 ${style.icon}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={`font-semibold mb-1 ${style.title}`}>
              {title}
            </h3>
          )}
          <div className={`text-sm ${style.message}`}>
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>

          {/* Actions */}
          {actions && (
            <div className="mt-3 flex flex-wrap gap-2">
              {actions}
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`
              flex-shrink-0 p-1 rounded-lg transition-colors
              ${variant === 'error' ? 'hover:bg-red-100 text-red-600' : ''}
              ${variant === 'warning' ? 'hover:bg-amber-100 text-amber-600' : ''}
              ${variant === 'info' ? 'hover:bg-blue-100 text-blue-600' : ''}
              ${variant === 'success' ? 'hover:bg-green-100 text-green-600' : ''}
            `}
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Preset components for common use cases
export function FormError({ message, className }: { message: string; className?: string }) {
  return (
    <ErrorAlert
      variant="error"
      title="Form Error"
      message={message}
      className={className}
    />
  )
}

export function ValidationError({ errors, className }: { errors: string[]; className?: string }) {
  const message = (
    <div className="space-y-1">
      <p>Mohon perbaiki error berikut:</p>
      <ul className="list-disc list-inside ml-2">
        {errors.map((error, index) => (
          <li key={index} className="text-xs">{error}</li>
        ))}
      </ul>
    </div>
  )

  return (
    <ErrorAlert
      variant="error"
      title="Validasi Gagal"
      message={message}
      className={className}
    />
  )
}

export function NetworkError({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <ErrorAlert
      variant="error"
      title="Koneksi Error"
      message="Tidak dapat terhubung ke server. Periksa koneksi internet Anda."
      actions={
        onRetry ? (
          <button
            onClick={onRetry}
            className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Coba Lagi
          </button>
        ) : undefined
      }
      className={className}
    />
  )
}

export function PermissionError({ className }: { className?: string }) {
  return (
    <ErrorAlert
      variant="warning"
      title="Akses Ditolak"
      message="Anda tidak memiliki izin untuk mengakses halaman ini."
      className={className}
    />
  )
}
