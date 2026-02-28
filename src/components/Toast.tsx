'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
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

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substring(2)
    const toast: Toast = { id, type, message, duration }

    setToasts((prev) => [...prev, toast])

    if (duration > 0) {
      setTimeout(() => {
        hideToast(id)
      }, duration)
    }
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, hideToast, toasts }}>
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
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
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

  const handleHide = () => {
    setIsExiting(true)
    setTimeout(() => onHide(toast.id), 300)
  }

  // Auto hide after duration
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(handleHide, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast.duration])

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-lime-600" />,
    error: <AlertCircle className="w-5 h-5 text-pink-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-orange-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
  }

  const bgColors = {
    success: 'bg-lime-50 border-lime-200',
    error: 'bg-pink-50 border-pink-200',
    warning: 'bg-orange-50 border-orange-200',
    info: 'bg-blue-50 border-blue-200',
  }

  return (
    <div
      className={`
        pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg
        transition-all duration-300 transform
        ${bgColors[toast.type]}
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
    >
      <div className="flex-shrink-0 mt-0.5">
        {icons[toast.type]}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{toast.message}</p>
      </div>

      <button
        onClick={handleHide}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  )
}

/**
 * Convenience functions for different toast types
 */
export const toast = {
  success: (message: string, duration?: number) => {
    const { showToast } = useToast()
    showToast(message, 'success', duration)
  },
  error: (message: string, duration?: number) => {
    const { showToast } = useToast()
    showToast(message, 'error', duration)
  },
  warning: (message: string, duration?: number) => {
    const { showToast } = useToast()
    showToast(message, 'warning', duration)
  },
  info: (message: string, duration?: number) => {
    const { showToast } = useToast()
    showToast(message, 'info', duration)
  },
}
