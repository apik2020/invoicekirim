'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertTriangle,
  Trash2,
  X,
  CheckCircle,
  Info,
  AlertCircle,
  LogOut,
  UserX,
  FileText,
  CreditCard,
  Shield,
  Clock,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

export type MessageBoxVariant =
  | 'danger'      // Untuk aksi destruktif (delete, remove)
  | 'warning'     // Untuk peringatan
  | 'info'        // Untuk informasi umum
  | 'success'     // Untuk konfirmasi sukses
  | 'confirm'     // Untuk konfirmasi umum

export type MessageBoxSize = 'sm' | 'md' | 'lg'

interface ActionButton {
  label: string
  onClick: () => void | Promise<void>
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  loading?: boolean
  disabled?: boolean
}

interface MessageBoxProps {
  open: boolean
  onClose: () => void
  title: string
  message: string | React.ReactNode
  variant?: MessageBoxVariant
  size?: MessageBoxSize
  icon?: React.ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  loading?: boolean
  actions?: ActionButton[]
  className?: string
  children?: React.ReactNode
}

// ============================================
// STYLES CONFIGURATION
// ============================================

const variantStyles = {
  danger: {
    overlay: 'bg-red-900/20 backdrop-blur-sm',
    container: 'bg-white border-2 border-red-100',
    iconWrapper: 'bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-200',
    icon: 'text-white',
    title: 'text-gray-900',
    message: 'text-gray-600',
    confirmBtn: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300',
    cancelBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    defaultIcon: Trash2,
    defaultConfirmText: 'Hapus',
  },
  warning: {
    overlay: 'bg-amber-900/20 backdrop-blur-sm',
    container: 'bg-white border-2 border-amber-100',
    iconWrapper: 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-200',
    icon: 'text-white',
    title: 'text-gray-900',
    message: 'text-gray-600',
    confirmBtn: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300',
    cancelBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    defaultIcon: AlertTriangle,
    defaultConfirmText: 'Lanjutkan',
  },
  info: {
    overlay: 'bg-blue-900/20 backdrop-blur-sm',
    container: 'bg-white border-2 border-blue-100',
    iconWrapper: 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200',
    icon: 'text-white',
    title: 'text-gray-900',
    message: 'text-gray-600',
    confirmBtn: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300',
    cancelBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    defaultIcon: Info,
    defaultConfirmText: 'Mengerti',
  },
  success: {
    overlay: 'bg-green-900/20 backdrop-blur-sm',
    container: 'bg-white border-2 border-green-100',
    iconWrapper: 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-200',
    icon: 'text-white',
    title: 'text-gray-900',
    message: 'text-gray-600',
    confirmBtn: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300',
    cancelBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    defaultIcon: CheckCircle,
    defaultConfirmText: 'Selesai',
  },
  confirm: {
    overlay: 'bg-gray-900/20 backdrop-blur-sm',
    container: 'bg-white border-2 border-gray-100',
    iconWrapper: 'bg-gradient-to-br from-orange-500 to-pink-600 shadow-lg shadow-orange-200',
    icon: 'text-white',
    title: 'text-gray-900',
    message: 'text-gray-600',
    confirmBtn: 'bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300',
    cancelBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    defaultIcon: AlertCircle,
    defaultConfirmText: 'Ya, Lanjutkan',
  },
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MessageBox({
  open,
  onClose,
  title,
  message,
  variant = 'confirm',
  size = 'md',
  icon,
  confirmText,
  cancelText = 'Batal',
  onConfirm,
  onCancel,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  loading = false,
  actions,
  className,
  children,
}: MessageBoxProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  const styles = variantStyles[variant]
  const DefaultIcon = styles.defaultIcon

  // Handle mount for portal
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Handle open/close animation
  useEffect(() => {
    if (open) {
      setIsVisible(true)
      document.body.style.overflow = 'hidden'
    } else {
      setIsVisible(false)
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !open) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, closeOnEscape, onClose])

  const handleConfirm = useCallback(async () => {
    if (onConfirm) {
      setIsLoading(true)
      try {
        await onConfirm()
        onClose()
      } catch (error) {
        console.error('Confirm action failed:', error)
      } finally {
        setIsLoading(false)
      }
    } else {
      onClose()
    }
  }, [onConfirm, onClose])

  const handleCancel = useCallback(() => {
    onCancel?.()
    onClose()
  }, [onCancel, onClose])

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }, [closeOnOverlayClick, onClose])

  if (!mounted || !open) return null

  const content = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'transition-all duration-300',
        isVisible ? 'opacity-100' : 'opacity-0',
        styles.overlay
      )}
      onClick={handleOverlayClick}
    >
      {/* Dialog Container */}
      <div
        className={cn(
          'relative w-full rounded-2xl shadow-2xl',
          'transform transition-all duration-300',
          sizeStyles[size],
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
          styles.container,
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="messagebox-title"
      >
        {/* Close Button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center',
              'transform transition-transform duration-300',
              isVisible ? 'scale-100 rotate-0' : 'scale-50 -rotate-12',
              styles.iconWrapper
            )}>
              {icon || <DefaultIcon className={cn('w-8 h-8', styles.icon)} />}
            </div>
          </div>

          {/* Title */}
          <h2
            id="messagebox-title"
            className={cn(
              'text-xl font-bold text-center mb-2',
              styles.title
            )}
          >
            {title}
          </h2>

          {/* Message */}
          <div className={cn(
            'text-center mb-6 text-sm leading-relaxed',
            styles.message
          )}>
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>

          {/* Children (for custom content) */}
          {children && (
            <div className="mb-6">
              {children}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Custom Actions or Default */}
            {actions ? (
              actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  disabled={action.disabled || action.loading}
                  className={cn(
                    'flex-1 px-5 py-3 rounded-xl font-semibold text-sm',
                    'transition-all duration-200 transform hover:scale-[1.02]',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
                    'flex items-center justify-center gap-2',
                    action.variant === 'primary' && 'bg-orange-500 text-white hover:bg-orange-600',
                    action.variant === 'danger' && styles.confirmBtn,
                    action.variant === 'secondary' && styles.cancelBtn,
                    action.variant === 'ghost' && 'text-gray-600 hover:bg-gray-100',
                    !action.variant && styles.cancelBtn
                  )}
                >
                  {action.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {action.label}
                </button>
              ))
            ) : (
              <>
                {/* Cancel Button */}
                {(variant !== 'success' || onCancel) && (
                  <button
                    onClick={handleCancel}
                    disabled={loading || isLoading}
                    className={cn(
                      'flex-1 px-5 py-3 rounded-xl font-semibold text-sm',
                      'transition-all duration-200 transform hover:scale-[1.02]',
                      'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
                      styles.cancelBtn
                    )}
                  >
                    {cancelText}
                  </button>
                )}

                {/* Confirm Button */}
                {onConfirm && (
                  <button
                    onClick={handleConfirm}
                    disabled={loading || isLoading}
                    className={cn(
                      'flex-1 px-5 py-3 rounded-xl font-semibold text-sm',
                      'transition-all duration-200 transform hover:scale-[1.02]',
                      'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
                      'flex items-center justify-center gap-2',
                      styles.confirmBtn
                    )}
                  >
                    {(loading || isLoading) && <Loader2 className="w-4 h-4 animate-spin" />}
                    {confirmText || styles.defaultConfirmText}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

// ============================================
// PRESET COMPONENTS
// ============================================

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title?: string
  message: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  loading?: boolean
}

// Delete Confirmation
export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Hapus Item?',
  message = 'Tindakan ini tidak dapat dibatalkan. Data yang dihapus tidak dapat dikembalikan.',
  confirmText = 'Ya, Hapus',
  cancelText = 'Batal',
  loading,
}: ConfirmDialogProps) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      message={message}
      variant="danger"
      confirmText={confirmText}
      cancelText={cancelText}
      loading={loading}
    />
  )
}

// Warning Confirmation
export function WarningConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Perhatian!',
  message,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  loading,
}: ConfirmDialogProps) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      message={message}
      variant="warning"
      confirmText={confirmText}
      cancelText={cancelText}
      loading={loading}
    />
  )
}

// Logout Confirmation
export function LogoutConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Keluar dari Akun?',
  message = 'Anda yakin ingin keluar dari akun Anda? Anda perlu login kembali untuk mengakses dashboard.',
  confirmText = 'Ya, Keluar',
  cancelText = 'Tetap Di Sini',
  loading,
}: ConfirmDialogProps) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      message={message}
      variant="confirm"
      confirmText={confirmText}
      cancelText={cancelText}
      icon={<LogOut className="w-8 h-8 text-white" />}
      loading={loading}
    />
  )
}

// Remove Team Member
export function RemoveMemberDialog({
  open,
  onClose,
  onConfirm,
  memberName,
  loading,
}: ConfirmDialogProps & { memberName: string }) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Hapus Anggota Tim?"
      message={
        <div className="space-y-2">
          <p>
            Anda akan menghapus <span className="font-semibold text-gray-900">{memberName}</span> dari tim.
          </p>
          <p className="text-xs text-gray-500">
            Anggota yang dihapus tidak akan dapat mengakses data tim lagi.
          </p>
        </div>
      }
      variant="danger"
      confirmText="Ya, Hapus Anggota"
      cancelText="Batal"
      icon={<UserX className="w-8 h-8 text-white" />}
      loading={loading}
    />
  )
}

// Cancel Subscription
export function CancelSubscriptionDialog({
  open,
  onClose,
  onConfirm,
  planName,
  loading,
}: ConfirmDialogProps & { planName: string }) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Batalkan Langganan?"
      message={
        <div className="space-y-2">
          <p>
            Anda akan membatalkan langganan <span className="font-semibold text-gray-900">{planName}</span>.
          </p>
          <p className="text-xs text-gray-500">
            Anda dapat terus menggunakan fitur hingga periode berlangganan berakhir.
          </p>
        </div>
      }
      variant="warning"
      confirmText="Ya, Batalkan"
      cancelText="Tetap Berlangganan"
      icon={<CreditCard className="w-8 h-8 text-white" />}
      loading={loading}
    />
  )
}

// Send Invoice Confirmation
export function SendInvoiceDialog({
  open,
  onClose,
  onConfirm,
  clientName,
  invoiceNumber,
  loading,
}: ConfirmDialogProps & { clientName: string; invoiceNumber: string }) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Kirim Invoice?"
      message={
        <div className="space-y-2">
          <p>
            Invoice <span className="font-semibold text-gray-900">#{invoiceNumber}</span> akan dikirim ke:
          </p>
          <p className="font-semibold text-orange-600">{clientName}</p>
        </div>
      }
      variant="confirm"
      confirmText="Ya, Kirim Sekarang"
      cancelText="Batal"
      icon={<FileText className="w-8 h-8 text-white" />}
      loading={loading}
    />
  )
}

// Success Dialog
export function SuccessDialog({
  open,
  onClose,
  title = 'Berhasil!',
  message,
  buttonText = 'Selesai',
}: {
  open: boolean
  onClose: () => void
  title?: string
  message: string | React.ReactNode
  buttonText?: string
}) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title={title}
      message={message}
      variant="success"
      confirmText={buttonText}
      cancelText=""
      showCloseButton={false}
    />
  )
}

// Info Dialog
export function InfoDialog({
  open,
  onClose,
  title = 'Informasi',
  message,
  buttonText = 'Mengerti',
}: {
  open: boolean
  onClose: () => void
  title?: string
  message: string | React.ReactNode
  buttonText?: string
}) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title={title}
      message={message}
      variant="info"
      confirmText={buttonText}
      cancelText=""
      showCloseButton={false}
    />
  )
}

// Change Plan Dialog
export function ChangePlanDialog({
  open,
  onClose,
  onConfirm,
  currentPlan,
  newPlan,
  loading,
}: ConfirmDialogProps & { currentPlan: string; newPlan: string }) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Ganti Paket?"
      message={
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="px-3 py-1.5 bg-gray-100 rounded-lg">
              <span className="text-gray-500">Saat ini:</span>
              <span className="font-semibold text-gray-900 ml-1">{currentPlan}</span>
            </div>
            <span className="text-gray-400">→</span>
            <div className="px-3 py-1.5 bg-orange-50 rounded-lg">
              <span className="text-orange-600">Baru:</span>
              <span className="font-semibold text-orange-700 ml-1">{newPlan}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Perubahan paket akan diterapkan segera.
          </p>
        </div>
      }
      variant="confirm"
      confirmText="Ya, Ganti Paket"
      cancelText="Batal"
      loading={loading}
    />
  )
}

// Unsaved Changes Dialog
export function UnsavedChangesDialog({
  open,
  onClose,
  onDiscard,
  onSave,
  loading,
}: {
  open: boolean
  onClose: () => void
  onDiscard: () => void
  onSave: () => void | Promise<void>
  loading?: boolean
}) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title="Perubahan Belum Disimpan"
      message="Anda memiliki perubahan yang belum disimpan. Apa yang ingin Anda lakukan?"
      variant="warning"
      showCloseButton={false}
      closeOnOverlayClick={false}
      actions={[
        {
          label: 'Buang Perubahan',
          onClick: onDiscard,
          variant: 'ghost',
        },
        {
          label: 'Simpan',
          onClick: onSave,
          variant: 'primary',
          loading,
        },
      ]}
    />
  )
}

// Session Timeout Warning
export function SessionTimeoutDialog({
  open,
  onClose,
  onExtend,
  remainingSeconds,
}: {
  open: boolean
  onClose: () => void
  onExtend: () => void
  remainingSeconds: number
}) {
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title="Sesi Akan Berakhir"
      message={
        <div className="space-y-2">
          <p>Sesi Anda akan berakhir dalam:</p>
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-orange-600">
            <Clock className="w-6 h-6" />
            <span>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Klik "Perpanjang Sesi" untuk tetap masuk.
          </p>
        </div>
      }
      variant="warning"
      confirmText="Perpanjang Sesi"
      cancelText="Keluar"
      onConfirm={onExtend}
      icon={<Clock className="w-8 h-8 text-white" />}
    />
  )
}

// Export default
export default MessageBox
