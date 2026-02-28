import { Check, AlertCircle, Info, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type FormMessageType = 'error' | 'success' | 'info' | 'loading'

interface FormMessageProps {
  type: FormMessageType
  message: string
  className?: string
}

export function FormMessage({ type, message, className }: FormMessageProps) {
  const styles = {
    error: {
      container: 'bg-red-50 text-red-800 border-red-200',
      icon: AlertCircle,
    },
    success: {
      container: 'bg-green-50 text-green-800 border-green-200',
      icon: Check,
    },
    info: {
      container: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: Info,
    },
    loading: {
      container: 'bg-gray-50 text-gray-800 border-gray-200',
      icon: Loader2,
    },
  }

  const style = styles[type]
  const Icon = style.icon

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium',
        style.container,
        className
      )}
    >
      <Icon className={cn('w-4 h-4 flex-shrink-0', type === 'loading' && 'animate-spin')} />
      <span>{message}</span>
    </div>
  )
}

// Helper components for form field errors
interface FieldErrorProps {
  error?: string | null
  className?: string
}

export function FieldError({ error, className }: FieldErrorProps) {
  if (!error) return null

  return (
    <p className={cn('text-sm text-red-600 mt-1.5 flex items-center gap-1', className)}>
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{error}</span>
    </p>
  )
}

interface FieldHintProps {
  hint?: string | null
  className?: string
}

export function FieldHint({ hint, className }: FieldHintProps) {
  if (!hint) return null

  return (
    <p className={cn('text-xs text-gray-500 mt-1.5', className)}>
      {hint}
    </p>
  )
}

// Form status banner
interface FormStatusBannerProps {
  status?: 'error' | 'success' | 'info' | 'loading' | null
  message?: string | null
  className?: string
}

export function FormStatusBanner({ status, message, className }: FormStatusBannerProps) {
  if (!status || !message) return null

  return (
    <div className={className}>
      <FormMessage type={status} message={message} />
    </div>
  )
}
