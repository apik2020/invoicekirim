'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Sparkles, XCircle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number, title?: string) => void
  showSuccess: (message: string, title?: string) => void
  showError: (message: string, title?: string) => void
  showWarning: (message: string, title?: string) => void
  showInfo: (message: string, title?: string) => void
  hideToast: (id: string) => void
  toasts: Toast[]
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((
    message: string,
    type: ToastType = 'info',
    duration = 5000,
    title?: string
  ) => {
    const id = Math.random().toString(36).substring(2)
    const toast: Toast = { id, type, message, duration, title }
    setToasts((prev) => [...prev, toast])
  }, [])

  const showSuccess = useCallback((message: string, title?: string) => {
    showToast(message, 'success', 5000, title)
  }, [showToast])

  const showError = useCallback((message: string, title?: string) => {
    showToast(message, 'error', 6000, title)
  }, [showToast])

  const showWarning = useCallback((message: string, title?: string) => {
    showToast(message, 'warning', 5000, title)
  }, [showToast])

  const showInfo = useCallback((message: string, title?: string) => {
    showToast(message, 'info', 4000, title)
  }, [showToast])

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      hideToast,
      toasts
    }}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({
  toasts,
  onHide,
}: {
  toasts: Toast[]
  onHide: (id: string) => void
}) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onHide={onHide} />
      ))}
    </div>
  )
}

function ToastItem({
  toast,
  onHide,
}: {
  toast: Toast
  onHide: (id: string) => void
}) {
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(100)

  const handleHide = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => onHide(toast.id), 300)
  }, [onHide, toast.id])

  // Progress bar animation
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const startTime = Date.now()
      const duration = toast.duration

      const updateProgress = () => {
        const elapsed = Date.now() - startTime
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
        setProgress(remaining)

        if (remaining > 0) {
          requestAnimationFrame(updateProgress)
        }
      }

      const animationFrame = requestAnimationFrame(updateProgress)

      const timer = setTimeout(handleHide, duration)
      return () => {
        clearTimeout(timer)
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [toast.duration, handleHide])

  const config = {
    success: {
      icon: <CheckCircle className="w-5 h-5" />,
      bgClass: 'bg-gradient-to-r from-lime-50 to-green-50',
      borderClass: 'border-lime-200',
      iconBgClass: 'bg-gradient-to-br from-lime-400 to-green-500',
      progressClass: 'bg-gradient-to-r from-lime-400 to-green-500',
      titleDefault: 'Berhasil',
    },
    error: {
      icon: <XCircle className="w-5 h-5" />,
      bgClass: 'bg-gradient-to-r from-red-50 to-pink-50',
      borderClass: 'border-red-200',
      iconBgClass: 'bg-gradient-to-br from-red-400 to-pink-500',
      progressClass: 'bg-gradient-to-r from-red-400 to-pink-500',
      titleDefault: 'Kesalahan',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5" />,
      bgClass: 'bg-gradient-to-r from-amber-50 to-orange-50',
      borderClass: 'border-amber-200',
      iconBgClass: 'bg-gradient-to-br from-amber-400 to-orange-500',
      progressClass: 'bg-gradient-to-r from-amber-400 to-orange-500',
      titleDefault: 'Peringatan',
    },
    info: {
      icon: <Info className="w-5 h-5" />,
      bgClass: 'bg-gradient-to-r from-blue-50 to-indigo-50',
      borderClass: 'border-blue-200',
      iconBgClass: 'bg-gradient-to-br from-blue-400 to-indigo-500',
      progressClass: 'bg-gradient-to-r from-blue-400 to-indigo-500',
      titleDefault: 'Informasi',
    },
  }

  const { icon, bgClass, borderClass, iconBgClass, progressClass, titleDefault } = config[toast.type]
  const title = toast.title || titleDefault

  return (
    <div
      className={`
        pointer-events-auto relative overflow-hidden
        rounded-2xl border-2 shadow-xl shadow-black/5
        transition-all duration-300 ease-out
        ${bgClass} ${borderClass}
        ${isExiting ? 'opacity-0 translate-x-full scale-95' : 'opacity-100 translate-x-0 scale-100'}
        hover:shadow-2xl hover:shadow-black/10
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`
            flex-shrink-0 w-10 h-10 rounded-xl
            ${iconBgClass}
            flex items-center justify-center
            text-white shadow-lg
          `}>
            {icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            <h4 className="text-sm font-bold text-gray-900 mb-0.5">
              {title}
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {toast.message}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={handleHide}
            className="
              flex-shrink-0 p-1.5 rounded-lg
              text-gray-400 hover:text-gray-600
              hover:bg-black/5
              transition-all duration-200
              hover:scale-110
            "
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5">
        <div
          className={`h-full ${progressClass} transition-all duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Alert Box Component for inline notifications
 */
interface AlertBoxProps {
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  children: ReactNode
  className?: string
  onDismiss?: () => void
}

export function AlertBox({
  type = 'info',
  title,
  children,
  className = '',
  onDismiss
}: AlertBoxProps) {
  const config = {
    success: {
      icon: <CheckCircle className="w-5 h-5" />,
      bgClass: 'bg-gradient-to-r from-lime-50 to-green-50',
      borderClass: 'border-lime-300',
      iconClass: 'text-lime-600',
      titleClass: 'text-lime-800',
      textClass: 'text-lime-700',
    },
    error: {
      icon: <XCircle className="w-5 h-5" />,
      bgClass: 'bg-gradient-to-r from-red-50 to-pink-50',
      borderClass: 'border-red-300',
      iconClass: 'text-red-600',
      titleClass: 'text-red-800',
      textClass: 'text-red-700',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5" />,
      bgClass: 'bg-gradient-to-r from-amber-50 to-orange-50',
      borderClass: 'border-amber-300',
      iconClass: 'text-amber-600',
      titleClass: 'text-amber-800',
      textClass: 'text-amber-700',
    },
    info: {
      icon: <Sparkles className="w-5 h-5" />,
      bgClass: 'bg-gradient-to-r from-blue-50 to-indigo-50',
      borderClass: 'border-blue-300',
      iconClass: 'text-blue-600',
      titleClass: 'text-blue-800',
      textClass: 'text-blue-700',
    },
  }

  const { icon, bgClass, borderClass, iconClass, titleClass, textClass } = config[type]

  return (
    <div className={`
      rounded-2xl border-2 p-4
      ${bgClass} ${borderClass}
      ${className}
    `}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 mt-0.5 ${iconClass}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`text-sm font-bold ${titleClass} mb-1`}>
              {title}
            </h4>
          )}
          <div className={`text-sm ${textClass}`}>
            {children}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`
              flex-shrink-0 p-1 rounded-lg
              ${iconClass} hover:bg-black/5
              transition-colors
            `}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Convenience functions for different toast types
 */
export const toast = {
  success: (message: string, title?: string) => {
    const { showSuccess } = useToast()
    showSuccess(message, title)
  },
  error: (message: string, title?: string) => {
    const { showError } = useToast()
    showError(message, title)
  },
  warning: (message: string, title?: string) => {
    const { showWarning } = useToast()
    showWarning(message, title)
  },
  info: (message: string, title?: string) => {
    const { showInfo } = useToast()
    showInfo(message, title)
  },
}
